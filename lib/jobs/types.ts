/**
 * JSearch API Types
 *
 * Principle Focus: Clarity (explicit types for external API)
 *
 * Types for the JSearch RapidAPI response format
 */

/**
 * Raw job from JSearch API response
 */
export interface JSearchJob {
  job_id: string
  job_title: string
  employer_name: string
  employer_logo: string | null
  employer_website: string | null
  employer_company_type: string | null
  job_publisher: string
  job_employment_type: string
  job_city: string
  job_state: string
  job_country: string
  job_description: string
  job_is_remote: boolean
  job_posted_at_datetime_utc: string
  job_apply_link: string
  job_apply_is_direct: boolean
  job_required_skills: string[] | null
  job_required_experience: {
    no_experience_required: boolean
    required_experience_in_months: number | null
    experience_mentioned: boolean
    experience_preferred: boolean
  } | null
  job_required_education: {
    postgraduate_degree: boolean
    professional_certification: boolean
    high_school: boolean
    associates_degree: boolean
    bachelors_degree: boolean
    degree_mentioned: boolean
    degree_preferred: boolean
    professional_certification_mentioned: boolean
  } | null
  job_min_salary: number | null
  job_max_salary: number | null
  job_salary_currency: string | null
  job_salary_period: string | null
  job_highlights: {
    Qualifications?: string[]
    Responsibilities?: string[]
    Benefits?: string[]
  } | null
}

/**
 * JSearch API response envelope
 */
export interface JSearchResponse {
  status: string
  request_id: string
  parameters: {
    query: string
    page: number
    num_pages: number
  }
  data: JSearchJob[]
}

/**
 * JSearch API error response
 */
export interface JSearchError {
  message: string
  status: number
  code?: string
}

/**
 * Search parameters for JSearch API
 */
export interface JSearchParams {
  query: string
  page?: number
  num_pages?: number
  date_posted?: 'all' | 'today' | '3days' | 'week' | 'month'
  remote_jobs_only?: boolean
  employment_types?: string // comma-separated: FULLTIME,PARTTIME,CONTRACTOR,INTERN
  job_requirements?: string // comma-separated: under_3_years_experience,more_than_3_years_experience,no_experience,no_degree
  radius?: number // in miles
  categories?: string // comma-separated job categories
}
