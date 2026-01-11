/**
 * JSearch API Client
 *
 * Principle Focus:
 * - Modularity: Single responsibility - fetch jobs from JSearch
 * - Resilience: Retry logic, rate limiting awareness
 * - Scale: Deduplication, efficient API usage
 */

import type { JobOpportunity, SearchConfig, JobSource } from '@/lib/types'
import { withRetry, RetryPresets } from '@/lib/resilience/retry'
import { SearchError } from '@/lib/resilience/errors'
import type { JSearchJob, JSearchResponse, JSearchParams } from './types'

const JSEARCH_BASE = 'https://jsearch.p.rapidapi.com'

/**
 * Get list of ignored job site domains from environment variable
 */
function getIgnoredSites(): string[] {
  const ignoredSites = process.env.IGNORED_JOB_SITES
  if (!ignoredSites) return []

  return ignoredSites
    .split(',')
    .map(site => site.trim().toLowerCase())
    .filter(site => site.length > 0)
}

/**
 * Filter out jobs from ignored sites
 */
function filterIgnoredSites(jobs: JobOpportunity[]): { filtered: JobOpportunity[], ignoredCount: number } {
  const ignoredSites = getIgnoredSites()

  if (ignoredSites.length === 0) {
    return { filtered: jobs, ignoredCount: 0 }
  }

  const filtered = jobs.filter(job => {
    const url = job.applicationUrl?.toLowerCase() || ''
    return !ignoredSites.some(site => url.includes(site))
  })

  return {
    filtered,
    ignoredCount: jobs.length - filtered.length
  }
}

/**
 * Search for jobs using the JSearch API
 *
 * @param config - Search configuration
 * @returns Array of job opportunities with metadata
 */
export async function searchJobs(config: SearchConfig): Promise<{
  jobs: JobOpportunity[]
  metadata: {
    searchedAt: string
    sources: JobSource[]
    totalFound: number
    deduplicated: number
  }
}> {
  const searchedAt = new Date().toISOString()
  const allJobs: JobOpportunity[] = []
  const sourcesFound = new Set<JobSource>()

  // Search for each target role
  for (const role of config.targetRoles) {
    try {
      const jobs = await withRetry(
        () => fetchJobs(role, config),
        RetryPresets.rateLimited,
        {
          onRetry: (attempt, delay) => {
            console.warn(`[jsearch] Retry ${attempt} for "${role}", waiting ${delay}ms`)
          },
        }
      )

      allJobs.push(...jobs)
      jobs.forEach((job) => sourcesFound.add(job.source))
    } catch (error) {
      console.error(`[jsearch] Failed to fetch jobs for "${role}":`, error)
      // Continue with other roles (graceful degradation)
    }
  }

  // Filter out ignored sites
  const { filtered: filteredJobs, ignoredCount } = filterIgnoredSites(allJobs)
  if (ignoredCount > 0) {
    console.log(`[jsearch] Filtered out ${ignoredCount} jobs from ignored sites`)
  }

  // Deduplicate jobs
  const totalFound = filteredJobs.length
  const uniqueJobs = deduplicateJobs(filteredJobs)
  const deduplicated = totalFound - uniqueJobs.length

  return {
    jobs: uniqueJobs,
    metadata: {
      searchedAt,
      sources: Array.from(sourcesFound),
      totalFound,
      deduplicated,
    },
  }
}

/**
 * Fetch jobs for a single query
 */
async function fetchJobs(query: string, config: SearchConfig): Promise<JobOpportunity[]> {
  const apiKey = process.env.RAPIDAPI_KEY

  if (!apiKey) {
    throw new SearchError(
      'RAPIDAPI_KEY environment variable not set',
      'SEARCH_FAILED',
      false
    )
  }

  // Build search query
  let searchQuery = query
  if (config.locations.length > 0) {
    searchQuery = `${query} in ${config.locations[0]}`
  }

  // Build URL parameters
  const params: JSearchParams = {
    query: searchQuery,
    num_pages: 1,
    date_posted: 'month',
    employment_types: 'FULLTIME,CONTRACTOR',
    job_requirements: 'under_3_years_experience,more_than_3_years_experience,no_experience',
  }

  // Handle work preferences
  const wantsRemote = config.workPreferences.includes('remote')
  const wantsOnsiteOrHybrid = config.workPreferences.includes('onsite') || config.workPreferences.includes('hybrid')
  const searchRadius = config.radius ?? 10

  if (wantsRemote && !wantsOnsiteOrHybrid) {
    // Only remote selected - filter to remote jobs only
    params.remote_jobs_only = true
  } else if (wantsOnsiteOrHybrid) {
    // Onsite/hybrid selected (with or without remote) - apply radius filter
    params.radius = searchRadius
  }

  const url = new URL(`${JSEARCH_BASE}/search`)
  url.searchParams.set('query', params.query)
  url.searchParams.set('num_pages', String(params.num_pages))
  url.searchParams.set('date_posted', params.date_posted!)
  url.searchParams.set('employment_types', params.employment_types!)
  url.searchParams.set('job_requirements', params.job_requirements!)

  if (params.radius) {
    url.searchParams.set('radius', String(params.radius))
  }

  if (params.remote_jobs_only) {
    url.searchParams.set('remote_jobs_only', 'true')
  }

  const response = await fetch(url.toString(), {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
    },
  })

  if (!response.ok) {
    const status = response.status

    if (status === 429) {
      throw new SearchError(
        'JSearch API rate limit exceeded (200 requests/month on free tier)',
        'RATE_LIMITED',
        true,
        { status }
      )
    }

    if (status === 401 || status === 403) {
      throw new SearchError(
        'JSearch API authentication failed - check RAPIDAPI_KEY',
        'SEARCH_FAILED',
        false,
        { status }
      )
    }

    throw new SearchError(
      `JSearch API error: ${status} ${response.statusText}`,
      'SEARCH_FAILED',
      status >= 500, // Server errors are retryable
      { status }
    )
  }

  const data: JSearchResponse = await response.json()

  if (!data.data || !Array.isArray(data.data)) {
    return []
  }

  return data.data.map((job) => transformJob(job))
}

/**
 * Transform JSearch job to our JobOpportunity type
 */
function transformJob(job: JSearchJob): JobOpportunity {
  const location = [job.job_city, job.job_state, job.job_country]
    .filter(Boolean)
    .join(', ')

  const remoteStatus = job.job_is_remote ? 'remote' : 'onsite'

  // Extract requirements from highlights
  const requirements =
    job.job_highlights?.Qualifications ||
    job.job_highlights?.Responsibilities ||
    []

  return {
    id: job.job_id,
    title: job.job_title,
    company: job.employer_name,
    location: location || 'Location not specified',
    remoteStatus,
    description: job.job_description,
    requirements,
    techStack: job.job_required_skills || [],
    applicationUrl: job.job_apply_link,
    source: detectSource(job.job_apply_link, job.job_publisher),
    postedDate: job.job_posted_at_datetime_utc,
    salaryRange: formatSalary(
      job.job_min_salary,
      job.job_max_salary,
      job.job_salary_currency,
      job.job_salary_period
    ),
    scrapedAt: new Date().toISOString(),
    sourceUrl: job.job_apply_link,
  }
}

/**
 * Detect job source from URL or publisher
 */
function detectSource(url: string, publisher: string): JobSource {
  const urlLower = url.toLowerCase()
  const publisherLower = publisher.toLowerCase()

  if (urlLower.includes('indeed.com') || publisherLower.includes('indeed')) {
    return 'indeed'
  }
  if (urlLower.includes('linkedin.com') || publisherLower.includes('linkedin')) {
    return 'linkedin'
  }
  if (urlLower.includes('ziprecruiter.com') || publisherLower.includes('ziprecruiter')) {
    return 'ziprecruiter'
  }
  if (urlLower.includes('glassdoor.com') || publisherLower.includes('glassdoor')) {
    return 'glassdoor'
  }
  if (urlLower.includes('monster.com') || publisherLower.includes('monster')) {
    return 'monster'
  }
  if (urlLower.includes('wellfound.com') || publisherLower.includes('wellfound')) {
    return 'wellfound'
  }

  return 'indeed' // Default fallback
}

/**
 * Format salary range string
 */
function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null,
  period: string | null
): string | null {
  if (!min && !max) return null

  const curr = currency || 'USD'
  const per = period ? ` ${period.toLowerCase()}` : ''

  const formatNum = (n: number) => {
    if (n >= 1000) {
      return `${Math.round(n / 1000)}k`
    }
    return n.toLocaleString()
  }

  if (min && max) {
    return `${curr} ${formatNum(min)} - ${formatNum(max)}${per}`
  }
  if (min) {
    return `${curr} ${formatNum(min)}+${per}`
  }
  if (max) {
    return `Up to ${curr} ${formatNum(max)}${per}`
  }

  return null
}

/**
 * Deduplicate jobs based on company + title
 */
function deduplicateJobs(jobs: JobOpportunity[]): JobOpportunity[] {
  const seen = new Set<string>()

  return jobs.filter((job) => {
    // Create a normalized key
    const key = `${job.company.toLowerCase().trim()}-${job.title.toLowerCase().trim()}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

/**
 * Check if JSearch API is available (for health checks)
 */
export async function checkJSearchHealth(): Promise<{
  available: boolean
  message: string
}> {
  const apiKey = process.env.RAPIDAPI_KEY

  if (!apiKey) {
    return { available: false, message: 'RAPIDAPI_KEY not configured' }
  }

  try {
    const response = await fetch(`${JSEARCH_BASE}/search?query=test&num_pages=1`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    })

    if (response.ok) {
      return { available: true, message: 'JSearch API operational' }
    }

    if (response.status === 429) {
      return { available: false, message: 'Rate limit exceeded' }
    }

    return { available: false, message: `HTTP ${response.status}` }
  } catch (error) {
    return {
      available: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
