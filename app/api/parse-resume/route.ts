/**
 * Parse Resume API Route
 *
 * Principle Focus:
 * - Clarity: Explicit error messages with context
 * - Resilience: Retry logic, graceful degradation
 * - Trust: Transparent metadata, no hidden failures
 */

import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { extractTextFromPDF, isPDFParseError } from '@/lib/utils/pdf-parser'
import { withRetry, RetryPresets } from '@/lib/resilience/retry'
import { ParseError, wrapError } from '@/lib/resilience/errors'
import type { UserProfile, UserProfileWithMetadata, ExtractionMetadata } from '@/lib/types'

const SUPPORTED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/octet-stream', // Sometimes PDFs come as this
]

export async function POST(request: Request) {
  const startTime = Date.now()
  const warnings: string[] = []

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    // Validate input
    if (!file) {
      throw new ParseError('No file provided', 'PARSE_FAILED', false)
    }

    if (file.size === 0) {
      throw new ParseError('File is empty', 'EMPTY_CONTENT', false)
    }

    // Check file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      throw new ParseError(
        `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 5MB)`,
        'PARSE_FAILED',
        false
      )
    }

    // Determine file type and extract text
    const mimeType = file.type || 'application/octet-stream'
    let text: string
    let sourceType: string

    if (mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // PDF extraction
      sourceType = 'pdf'
      const buffer = Buffer.from(await file.arrayBuffer())

      try {
        const result = await extractTextFromPDF(buffer)
        text = result.text

        if (result.metadata.pages > 10) {
          warnings.push(`Large document: ${result.metadata.pages} pages`)
        }
      } catch (error) {
        if (isPDFParseError(error)) {
          throw new ParseError(error.message, error.code, error.recoverable)
        }
        throw error
      }
    } else if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      // Plain text or Markdown
      sourceType = mimeType === 'text/markdown' ? 'markdown' : 'text'
      text = await file.text()
    } else {
      // Try to read as text anyway (graceful degradation)
      warnings.push(`Unknown file type: ${mimeType}, attempting text extraction`)
      sourceType = 'unknown'
      text = await file.text()
    }

    // Validate extracted text
    if (!text || text.trim().length < 50) {
      throw new ParseError(
        'Insufficient content extracted from resume (minimum 50 characters)',
        'EMPTY_CONTENT',
        false
      )
    }

    // Use AI to parse resume with retry logic
    const { text: parsedData } = await withRetry(
      () =>
        generateText({
          model: openai('gpt-4o-mini'),
          prompt: buildParsePrompt(text),
        }),
      RetryPresets.standard,
      {
        onRetry: (attempt, delay) => {
          console.warn(`[parse-resume] Retry ${attempt}, waiting ${delay}ms`)
        },
      }
    )

    // Parse and validate response
    let profile: UserProfile
    try {
      profile = JSON.parse(parsedData)
    } catch {
      throw new ParseError(
        'Failed to parse AI response as JSON',
        'PARSE_FAILED',
        true,
        { rawResponse: parsedData.substring(0, 200) }
      )
    }

    // Validate required fields
    if (!profile.skills || !Array.isArray(profile.skills)) {
      warnings.push('Skills array not properly extracted')
      profile.skills = []
    }

    // Build metadata
    const metadata: ExtractionMetadata = {
      extractedAt: new Date().toISOString(),
      confidence: calculateConfidence(profile, warnings),
      warnings,
      sourceType,
    }

    const profileWithMetadata: UserProfileWithMetadata = {
      ...profile,
      metadata,
    }

    console.log(
      `[parse-resume] Success in ${Date.now() - startTime}ms, confidence: ${metadata.confidence}`
    )

    return NextResponse.json({ profile: profileWithMetadata })
  } catch (error) {
    console.error('[parse-resume] Error:', error)

    const scouterError = wrapError(error, 'parsing', 'PARSE_FAILED')

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
 * Build the parsing prompt for the AI model
 */
function buildParsePrompt(resumeText: string): string {
  return `Parse this resume and extract structured information in JSON format.

Resume text:
${resumeText}

Extract the following fields:
- skills: array of technical and professional skills
- experienceYears: total years of professional experience (number)
- techStack: array of technologies, tools, and frameworks
- jobHistory: array of {title, company, duration, highlights[]}
- education: array of {degree, institution, year}
- seniorityLevel: one of 'junior' | 'mid' | 'senior' | 'staff' | 'principal'
- careerTrajectory: brief 1-2 sentence summary of career progression

Important:
- Return ONLY valid JSON, no markdown or explanations
- Infer seniority from years of experience and role titles
- Extract specific technologies, not just categories
- Include both technical and soft skills`
}

/**
 * Calculate extraction confidence based on profile completeness
 */
function calculateConfidence(profile: UserProfile, warnings: string[]): number {
  let score = 1.0

  // Deduct for missing or empty fields
  if (!profile.skills?.length) score -= 0.2
  if (!profile.techStack?.length) score -= 0.15
  if (!profile.jobHistory?.length) score -= 0.25
  if (!profile.education?.length) score -= 0.1
  if (!profile.careerTrajectory) score -= 0.1
  if (profile.experienceYears === 0) score -= 0.1

  // Deduct for warnings
  score -= warnings.length * 0.05

  return Math.max(0, Math.min(1, score))
}
