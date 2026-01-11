/**
 * Pipeline API Route - SSE Orchestrator
 *
 * Principle Focus:
 * - Resilience: Graceful degradation, heartbeat, error recovery
 * - Delight: Real-time progress streaming
 * - Scale: Parallel job analysis
 * - Trust: Transparent progress updates
 *
 * This is the main orchestrator that coordinates all agents via SSE
 */

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createPipelineStream, calculateProgress } from '@/lib/streaming/sse-handler'
import { extractTextFromPDF, isPDFParseError } from '@/lib/utils/pdf-parser'
import { searchJobs } from '@/lib/jobs/jsearch'
import { withRetry, RetryPresets } from '@/lib/resilience/retry'
import { wrapError } from '@/lib/resilience/errors'
import type {
  UserProfile,
  UserProfileWithMetadata,
  SearchConfig,
  JobOpportunity,
  FitAnalysis,
  CoverLetterDraft,
  PipelineSummary,
} from '@/lib/types'

export const dynamic = 'force-dynamic'

interface PipelineRequest {
  searchConfig: SearchConfig
  template?: string | null
  options?: {
    minFitScore?: number
    generateCoverLetters?: boolean
  }
}

export async function POST(request: Request) {
  const startTime = Date.now()

  // Create SSE stream
  const pipeline = createPipelineStream({
    signal: request.signal,
    heartbeatMs: 5000,
  })

  // Start the pipeline in the background
  ;(async () => {
    pipeline.startHeartbeat()

    try {
      // Parse multipart form data
      const formData = await request.formData()
      const resumeFile = formData.get('resume') as File | null
      const configJson = formData.get('config') as string | null

      if (!resumeFile || !configJson) {
        await pipeline.sendError({
          message: 'Missing resume file or search config',
          code: 'VALIDATION_FAILED',
          phase: 'idle',
          recoverable: false,
        })
        await pipeline.close()
        return
      }

      const { searchConfig, template, options } = JSON.parse(configJson) as PipelineRequest
      const minFitScore = options?.minFitScore ?? 60
      const generateCoverLetters = options?.generateCoverLetters ?? true
      const coverLetterTemplate = template || null

      // =========================================================================
      // Phase 1: Parse Resume
      // =========================================================================
      await pipeline.sendPhase('parsing', 0, 'Extracting resume content...')

      let resumeText: string
      const mimeType = resumeFile.type || 'application/octet-stream'

      if (mimeType === 'application/pdf' || resumeFile.name.toLowerCase().endsWith('.pdf')) {
        const buffer = Buffer.from(await resumeFile.arrayBuffer())
        try {
          const result = await extractTextFromPDF(buffer)
          resumeText = result.text
        } catch (error) {
          if (isPDFParseError(error)) {
            await pipeline.sendError({
              message: error.message,
              code: error.code,
              phase: 'parsing',
              recoverable: error.recoverable,
            })
            await pipeline.close()
            return
          }
          throw error
        }
      } else {
        resumeText = await resumeFile.text()
      }

      await pipeline.sendPhase('parsing', 50, 'Analyzing resume with AI...')

      // Parse resume with AI
      const { text: profileJson } = await withRetry(
        () =>
          generateText({
            model: openai('gpt-4o-mini'),
            prompt: buildParsePrompt(resumeText),
          }),
        RetryPresets.standard
      )

      const profile: UserProfile = JSON.parse(profileJson)
      const profileWithMetadata: UserProfileWithMetadata = {
        ...profile,
        metadata: {
          extractedAt: new Date().toISOString(),
          confidence: 0.85,
          warnings: [],
          sourceType: mimeType.includes('pdf') ? 'pdf' : 'text',
        },
      }

      await pipeline.sendProfile(profileWithMetadata)
      await pipeline.sendPhase('parsing', 100, 'Resume parsed successfully')

      // =========================================================================
      // Phase 2: Search Jobs
      // =========================================================================
      await pipeline.sendPhase('searching', 0, 'Searching for matching jobs...')

      const searchResult = await searchJobs(searchConfig)
      const jobs = searchResult.jobs

      // Stream each job as it's found
      for (let i = 0; i < jobs.length; i++) {
        await pipeline.sendJob(jobs[i])
        await pipeline.sendPhase(
          'searching',
          Math.round(((i + 1) / jobs.length) * 100),
          `Found ${i + 1} of ${jobs.length} jobs`
        )
      }

      if (jobs.length === 0) {
        await pipeline.sendComplete({
          totalJobs: 0,
          analyzedJobs: 0,
          highFitJobs: 0,
          mediumFitJobs: 0,
          coverLettersGenerated: 0,
          filesExported: 0,
          durationMs: Date.now() - startTime,
        })
        await pipeline.close()
        return
      }

      // =========================================================================
      // Phase 3: Analyze Fit (parallel)
      // =========================================================================
      await pipeline.sendPhase('analyzing', 0, 'Analyzing job fit...')

      const analyses: FitAnalysis[] = []
      const highFitJobs: JobOpportunity[] = []

      // Process jobs in batches of 3 for parallel efficiency
      const batchSize = 3
      for (let i = 0; i < jobs.length; i += batchSize) {
        const batch = jobs.slice(i, i + batchSize)

        const batchResults = await Promise.all(
          batch.map(async (job) => {
            try {
              return await analyzeJobFit(profile, job)
            } catch (error) {
              console.error(`[pipeline] Analysis failed for ${job.id}:`, error)
              return null
            }
          })
        )

        for (const analysis of batchResults) {
          if (analysis) {
            analyses.push(analysis)
            await pipeline.sendAnalysis(analysis)

            if (analysis.overallScore >= minFitScore) {
              const job = jobs.find((j) => j.id === analysis.jobId)
              if (job) highFitJobs.push(job)
            }
          }
        }

        const progress = Math.round(((i + batch.length) / jobs.length) * 100)
        await pipeline.sendPhase('analyzing', progress, `Analyzed ${i + batch.length} of ${jobs.length} jobs`)
      }

      // =========================================================================
      // Phase 4: Generate Cover Letters (for high-fit jobs)
      // =========================================================================
      const coverLetters: CoverLetterDraft[] = []

      if (generateCoverLetters && highFitJobs.length > 0) {
        await pipeline.sendPhase('generating', 0, 'Generating cover letters...')

        for (let i = 0; i < highFitJobs.length; i++) {
          const job = highFitJobs[i]
          const analysis = analyses.find((a) => a.jobId === job.id)

          if (analysis) {
            try {
              const coverLetter = await generateCoverLetter(profile, job, analysis, coverLetterTemplate)
              coverLetters.push(coverLetter)
              await pipeline.sendCoverLetter(coverLetter)
            } catch (error) {
              console.error(`[pipeline] Cover letter failed for ${job.id}:`, error)
            }
          }

          const progress = Math.round(((i + 1) / highFitJobs.length) * 100)
          await pipeline.sendPhase('generating', progress, `Generated ${i + 1} of ${highFitJobs.length} cover letters`)
        }
      }

      // =========================================================================
      // Phase 5: Complete
      // =========================================================================
      const summary: PipelineSummary = {
        totalJobs: jobs.length,
        analyzedJobs: analyses.length,
        highFitJobs: analyses.filter((a) => a.overallScore >= 80).length,
        mediumFitJobs: analyses.filter((a) => a.overallScore >= 60 && a.overallScore < 80).length,
        coverLettersGenerated: coverLetters.length,
        filesExported: 0, // Export handled separately
        durationMs: Date.now() - startTime,
      }

      await pipeline.sendComplete(summary)
      await pipeline.close()
    } catch (error) {
      console.error('[pipeline] Fatal error:', error)

      const scouterError = wrapError(error, 'error', 'UNKNOWN')
      await pipeline.sendError({
        message: scouterError.message,
        code: scouterError.code,
        phase: scouterError.phase,
        recoverable: scouterError.recoverable,
      })
      await pipeline.close()
    }
  })()

  return pipeline.response
}

// =============================================================================
// Helper Functions
// =============================================================================

function buildParsePrompt(resumeText: string): string {
  return `Parse this resume and extract structured information in JSON format.

Resume text:
${resumeText}

Extract:
- skills: array of technical and professional skills
- experienceYears: total years of professional experience (number)
- techStack: array of technologies, tools, and frameworks
- jobHistory: array of {title, company, duration, highlights[]}
- education: array of {degree, institution, year}
- seniorityLevel: one of 'junior' | 'mid' | 'senior' | 'staff' | 'principal'
- careerTrajectory: brief 1-2 sentence summary

Return ONLY valid JSON.`
}

async function analyzeJobFit(
  profile: UserProfile,
  job: JobOpportunity
): Promise<FitAnalysis> {
  const { text: analysisJson } = await withRetry(
    () =>
      generateText({
        model: openai('gpt-4o-mini'),
        prompt: `Analyze fit between candidate and job.

Candidate:
${JSON.stringify(profile, null, 2)}

Job:
${JSON.stringify(job, null, 2)}

Return JSON with:
- overallScore: 0-100
- skillsMatch: {score, matched[], missing[], rationale}
- experienceMatch: {score, matched[], missing[], rationale}
- techStackMatch: {score, matched[], missing[], rationale}
- seniorityFit: {score, matched[], missing[], rationale}
- summary: 2-3 sentence assessment
- concerns: array of potential issues
- strengths: array of advantages

Write summary and rationale in second person ("you/your"), addressing the job seeker directly.

Return ONLY valid JSON.`,
      }),
    RetryPresets.fast
  )

  const analysis = JSON.parse(analysisJson)

  return {
    ...analysis,
    jobId: job.id,
    confidence: 0.85,
    analyzedAt: new Date().toISOString(),
  }
}

async function generateCoverLetter(
  profile: UserProfile,
  job: JobOpportunity,
  analysis: FitAnalysis,
  template?: string | null
): Promise<CoverLetterDraft> {
  const templateInstructions = template
    ? `Use this template as a guide, filling in the placeholders:
${template}

Replace placeholders like {{COMPANY_NAME}}, {{ROLE_TITLE}}, {{CANDIDATE_NAME}}, etc. with appropriate content.`
    : `Write a professional cover letter from scratch.`

  const { text: letterJson } = await withRetry(
    () =>
      generateText({
        model: openai('gpt-4o-mini'),
        prompt: `Generate a professional cover letter.

Candidate:
${JSON.stringify(profile, null, 2)}

Job: ${job.title} at ${job.company}
${job.description.substring(0, 1000)}

Strengths to highlight:
${analysis.strengths.join('\n')}

${templateInstructions}

Return JSON with:
- content: the full cover letter text
- highlightedExperiences: array of experiences mentioned
- customizations: array of job-specific customizations made

Return ONLY valid JSON.`,
      }),
    RetryPresets.fast
  )

  const letter = JSON.parse(letterJson)

  return {
    ...letter,
    jobId: job.id,
  }
}
