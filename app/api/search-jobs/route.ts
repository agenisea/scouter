/**
 * Search Jobs API Route
 *
 * Principle Focus:
 * - Modularity: Delegates to JSearch client
 * - Resilience: Graceful error handling
 * - Trust: Transparent metadata in response
 */

import { searchJobs } from '@/lib/jobs/jsearch'
import { wrapError } from '@/lib/resilience/errors'
import type { SearchConfig } from '@/lib/types'

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const config = body.config as SearchConfig

    // Validate required fields
    if (!config || !config.targetRoles || config.targetRoles.length === 0) {
      return Response.json(
        {
          error: 'targetRoles is required and must not be empty',
          code: 'VALIDATION_FAILED',
        },
        { status: 400 }
      )
    }

    const result = await searchJobs(config)

    console.log(
      `[search-jobs] Found ${result.jobs.length} jobs in ${Date.now() - startTime}ms`
    )

    return Response.json({
      jobs: result.jobs,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error('[search-jobs] Error:', error)

    const scouterError = wrapError(error, 'searching', 'SEARCH_FAILED')

    return Response.json(
      {
        error: scouterError.message,
        code: scouterError.code,
        recoverable: scouterError.recoverable,
      },
      { status: scouterError.recoverable ? 503 : 500 }
    )
  }
}
