/**
 * Generate Cover Letter API Route
 *
 * Principle Focus:
 * - Delight: Personalized, professional output
 * - Adaptability: Optional template customization
 * - Resilience: Retry logic for AI calls
 */

import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { withRetry, RetryPresets } from '@/lib/resilience/retry'
import { wrapError, GenerationError } from '@/lib/resilience/errors'
import { sanitizeLLMResponse } from '@/lib/utils'
import type {
  UserProfile,
  JobOpportunity,
  FitAnalysis,
  CoverLetterDraft,
  CoverLetterDraftWithMetadata,
} from '@/lib/types'

interface GenerateRequest {
  profile: UserProfile
  job: JobOpportunity
  analysis?: FitAnalysis
  template?: string
}

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const { profile, job, analysis, template } = (await request.json()) as GenerateRequest

    // Validate input
    if (!profile || !job) {
      throw new GenerationError(
        'Both profile and job are required',
        'GENERATION_FAILED',
        false
      )
    }

    if (!job.id) {
      throw new GenerationError('Job must have an id', 'GENERATION_FAILED', false)
    }

    // Generate cover letter with retry
    const { text: letterJson } = await withRetry(
      () =>
        generateText({
          model: openai('gpt-4o-mini'),
          prompt: buildCoverLetterPrompt(profile, job, analysis, template),
        }),
      RetryPresets.standard,
      {
        onRetry: (attempt, delay) => {
          console.warn(`[generate-cover-letter] Retry ${attempt}, waiting ${delay}ms`)
        },
      }
    )

    // Parse response
    let parsedLetter: Omit<CoverLetterDraft, 'jobId'>
    try {
      parsedLetter = JSON.parse(sanitizeLLMResponse(letterJson))
    } catch {
      throw new GenerationError(
        'Failed to parse AI cover letter response',
        'GENERATION_FAILED',
        true
      )
    }

    // Build complete cover letter with metadata
    const coverLetter: CoverLetterDraftWithMetadata = {
      ...parsedLetter,
      jobId: job.id,
      metadata: {
        generatedAt: new Date().toISOString(),
        templateUsed: !!template,
      },
    }

    console.log(
      `[generate-cover-letter] Completed in ${Date.now() - startTime}ms for ${job.company}`
    )

    return NextResponse.json({ coverLetter })
  } catch (error) {
    console.error('[generate-cover-letter] Error:', error)

    const scouterError = wrapError(error, 'generating', 'GENERATION_FAILED')

    return NextResponse.json(
      {
        error: scouterError.message,
        code: scouterError.code,
        recoverable: scouterError.recoverable,
      },
      { status: scouterError.recoverable ? 500 : 400 }
    )
  }
}

/**
 * Build the cover letter generation prompt
 */
function buildCoverLetterPrompt(
  profile: UserProfile,
  job: JobOpportunity,
  analysis?: FitAnalysis,
  template?: string
): string {
  const strengthsSection = analysis?.strengths?.length
    ? `\nKey strengths to highlight:\n${analysis.strengths.map((s) => `- ${s}`).join('\n')}`
    : ''

  const templateSection = template
    ? `\nUse this template structure as a guide:\n${template}`
    : ''

  return `Generate a professional, personalized cover letter.

Candidate Profile:
- Experience: ${profile.experienceYears} years
- Seniority: ${profile.seniorityLevel}
- Key Skills: ${profile.skills.slice(0, 10).join(', ')}
- Tech Stack: ${profile.techStack.slice(0, 8).join(', ')}
- Career Focus: ${profile.careerTrajectory}

Recent Experience:
${profile.jobHistory
  .slice(0, 2)
  .map((j) => `- ${j.title} at ${j.company} (${j.duration})`)
  .join('\n')}

Target Position:
- Role: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
${strengthsSection}
${templateSection}

Write a compelling cover letter that:
1. Opens with enthusiasm for the specific role and company
2. Highlights 2-3 relevant experiences with concrete achievements
3. Connects the candidate's skills to the job requirements
4. Shows knowledge of the company/industry
5. Closes with a clear call to action

Return JSON with this structure:
{
  "content": "Full cover letter text (3-4 paragraphs, professional tone)",
  "highlightedExperiences": ["experience 1 mentioned", "experience 2 mentioned"],
  "customizations": ["customization 1 made for this job", "customization 2"]
}

Guidelines:
- Keep it concise (250-350 words)
- Use specific examples, not generic claims
- Match the tone to the company culture
- Avoid clichés like "I'm a perfect fit" or "I'm excited to apply"

Return ONLY valid JSON, no markdown or explanations.`
}
