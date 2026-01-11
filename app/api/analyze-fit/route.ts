/**
 * Analyze Fit API Route
 *
 * Principle Focus:
 * - Clarity: Detailed scoring rationale
 * - Trust: Transparent confidence scores
 * - Resilience: Retry logic for AI calls
 */

import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { withRetry, RetryPresets } from '@/lib/resilience/retry'
import { wrapError, AnalysisError } from '@/lib/resilience/errors'
import type { UserProfile, JobOpportunity, FitAnalysis } from '@/lib/types'

interface AnalyzeRequest {
  profile: UserProfile
  job: JobOpportunity
}

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const { profile, job } = (await request.json()) as AnalyzeRequest

    // Validate input
    if (!profile || !job) {
      throw new AnalysisError(
        'Both profile and job are required',
        'ANALYSIS_FAILED',
        false
      )
    }

    if (!job.id) {
      throw new AnalysisError('Job must have an id', 'ANALYSIS_FAILED', false)
    }

    // Generate analysis with retry
    const { text: analysisJson } = await withRetry(
      () =>
        generateText({
          model: openai('gpt-4o-mini'),
          prompt: buildAnalysisPrompt(profile, job),
        }),
      RetryPresets.standard,
      {
        onRetry: (attempt, delay) => {
          console.warn(`[analyze-fit] Retry ${attempt}, waiting ${delay}ms`)
        },
      }
    )

    // Parse response
    let parsedAnalysis: Omit<FitAnalysis, 'jobId' | 'confidence' | 'analyzedAt'>
    try {
      parsedAnalysis = JSON.parse(analysisJson)
    } catch {
      throw new AnalysisError(
        'Failed to parse AI analysis response',
        'ANALYSIS_FAILED',
        true
      )
    }

    // Build complete analysis with metadata
    const analysis: FitAnalysis = {
      ...parsedAnalysis,
      jobId: job.id,
      confidence: calculateConfidence(parsedAnalysis),
      analyzedAt: new Date().toISOString(),
    }

    console.log(
      `[analyze-fit] Completed in ${Date.now() - startTime}ms, score: ${analysis.overallScore}`
    )

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('[analyze-fit] Error:', error)

    const scouterError = wrapError(error, 'analyzing', 'ANALYSIS_FAILED')

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
 * Build the analysis prompt
 */
function buildAnalysisPrompt(profile: UserProfile, job: JobOpportunity): string {
  return `Analyze the fit between this candidate profile and job opportunity.

Candidate Profile:
${JSON.stringify(profile, null, 2)}

Job Opportunity:
${JSON.stringify(job, null, 2)}

Generate a detailed fit analysis with scores (0-100) for each category.

Return JSON with this structure:
{
  "overallScore": <weighted average 0-100>,
  "skillsMatch": {
    "score": <0-100>,
    "matched": ["skill1", "skill2"],
    "missing": ["skill3"],
    "rationale": "explanation"
  },
  "experienceMatch": {
    "score": <0-100>,
    "matched": ["relevant experience"],
    "missing": ["gap"],
    "rationale": "explanation"
  },
  "techStackMatch": {
    "score": <0-100>,
    "matched": ["tech1", "tech2"],
    "missing": ["tech3"],
    "rationale": "explanation"
  },
  "seniorityFit": {
    "score": <0-100>,
    "matched": ["level indicators"],
    "missing": [],
    "rationale": "explanation"
  },
  "summary": "2-3 sentence overall assessment",
  "concerns": ["potential issue 1", "potential issue 2"],
  "strengths": ["advantage 1", "advantage 2", "advantage 3"]
}

Scoring guidelines:
- 90-100: Exceptional fit, exceeds requirements
- 80-89: Strong fit, meets all key requirements
- 70-79: Good fit, meets most requirements
- 60-69: Moderate fit, some gaps but transferable skills
- Below 60: Weak fit, significant gaps

Return ONLY valid JSON, no markdown or explanations.`
}

/**
 * Calculate confidence based on analysis completeness
 */
function calculateConfidence(
  analysis: Omit<FitAnalysis, 'jobId' | 'confidence' | 'analyzedAt'>
): number {
  let score = 1.0

  // Check for complete match details
  if (!analysis.skillsMatch?.rationale) score -= 0.1
  if (!analysis.experienceMatch?.rationale) score -= 0.1
  if (!analysis.techStackMatch?.rationale) score -= 0.1
  if (!analysis.seniorityFit?.rationale) score -= 0.1

  // Check for meaningful content
  if (!analysis.summary) score -= 0.15
  if (!analysis.strengths?.length) score -= 0.1
  if (analysis.concerns === undefined) score -= 0.05

  return Math.max(0, Math.min(1, score))
}
