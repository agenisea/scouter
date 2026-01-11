/**
 * Export API Route
 *
 * Principle Focus:
 * - Trust: Reliable file system operations
 * - Accessibility: Clear success/failure feedback
 * - Resilience: Graceful handling of write failures
 */

import { NextResponse } from 'next/server'
import { exportToMarkdown } from '@/lib/export/markdown-writer'
import { wrapError, ExportError } from '@/lib/resilience/errors'
import type { ExportInput } from '@/lib/types'

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { jobs, analyses, coverLetters, outputDir } = body as ExportInput

    // Validate required fields
    if (!jobs || !Array.isArray(jobs)) {
      throw new ExportError('jobs array is required', 'EXPORT_FAILED', false)
    }

    if (!outputDir) {
      throw new ExportError('outputDir is required', 'EXPORT_FAILED', false)
    }

    // Use environment variable as default if not specified
    const targetDir = outputDir || process.env.OUTPUT_DIR || './output'

    const result = await exportToMarkdown({
      jobs,
      analyses: analyses || {},
      coverLetters: coverLetters || {},
      outputDir: targetDir,
    })

    console.log(
      `[export] Wrote ${result.count} files to ${targetDir} in ${Date.now() - startTime}ms`
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('[export] Error:', error)

    const scouterError = wrapError(error, 'exporting', 'EXPORT_FAILED')

    return NextResponse.json(
      {
        success: false,
        error: scouterError.message,
        code: scouterError.code,
        recoverable: scouterError.recoverable,
      },
      { status: 500 }
    )
  }
}
