/**
 * Core Data Types for Scouter
 *
 * Principle Focus: Clarity (name things precisely), Trust (audit trails via metadata)
 *
 * All types include metadata fields for observability and debugging
 */

// =============================================================================
// Metadata Types
// =============================================================================

export interface ExtractionMetadata {
  extractedAt: string // ISO timestamp
  confidence: number // 0-1 extraction confidence
  warnings: string[] // Extraction issues (Trust: transparent)
  sourceType: string // What was parsed
}

export interface SearchMetadata {
  searchedAt: string // ISO timestamp
  sources: JobSource[] // Which sources were queried
  totalFound: number // Total before deduplication
  deduplicated: number // Removed as duplicates
}

export interface AnalysisMetadata {
  analyzedAt: string // ISO timestamp
  confidence: number // 0-1 analysis confidence
  modelVersion: string // Model used for analysis
}

export interface GenerationMetadata {
  generatedAt: string // ISO timestamp
  templateUsed: boolean // Whether a template was applied
}

// =============================================================================
// User Profile Types
// =============================================================================

export interface UserProfile {
  skills: string[]
  experienceYears: number
  techStack: string[]
  jobHistory: JobEntry[]
  education: Education[]
  seniorityLevel: SeniorityLevel
  careerTrajectory: string
}

export interface UserProfileWithMetadata extends UserProfile {
  metadata: ExtractionMetadata
}

export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'staff' | 'principal'

export interface JobEntry {
  title: string
  company: string
  duration: string
  highlights: string[]
}

export interface Education {
  degree: string
  institution: string
  year: number
}

// =============================================================================
// Search Configuration Types
// =============================================================================

export interface SearchConfig {
  targetRoles: string[]
  locations: string[]
  workPreferences: WorkPreference[]
  salaryRange: SalaryRange | null
  excludeCompanies: string[]
  radius?: number // Search radius in miles (default 10)
  sources?: JobSource[] // Optional: filter to specific sources
  minFitScore?: number // Optional: minimum fit threshold (default 60)
}

export type WorkPreference = 'remote' | 'hybrid' | 'onsite'

export interface SalaryRange {
  min: number
  max: number
  currency?: string
}

export type JobSource =
  | 'indeed'
  | 'linkedin'
  | 'ziprecruiter'
  | 'glassdoor'
  | 'monster'
  | 'wellfound'
  | 'company_site'

// =============================================================================
// Job Opportunity Types
// =============================================================================

export interface JobOpportunity {
  id: string
  title: string
  company: string
  location: string
  remoteStatus: RemoteStatus
  description: string
  requirements: string[]
  techStack: string[]
  applicationUrl: string
  source: JobSource
  postedDate: string | null
  salaryRange: string | null
  // Metadata fields (Trust: audit trails)
  scrapedAt: string // ISO timestamp
  sourceUrl: string // Original listing URL
}

export type RemoteStatus = 'remote' | 'hybrid' | 'onsite' | 'unknown'

// =============================================================================
// Fit Analysis Types
// =============================================================================

export interface FitAnalysis {
  jobId: string
  overallScore: number // 0-100
  skillsMatch: MatchDetail
  experienceMatch: MatchDetail
  techStackMatch: MatchDetail
  seniorityFit: MatchDetail
  summary: string
  concerns: string[]
  strengths: string[]
  // Metadata fields
  confidence: number // 0-1 analysis confidence
  analyzedAt: string // ISO timestamp
}

export interface MatchDetail {
  score: number
  matched: string[]
  missing: string[]
  rationale: string
}

// =============================================================================
// Cover Letter Types
// =============================================================================

export interface CoverLetterDraft {
  jobId: string
  content: string
  highlightedExperiences: string[]
  customizations: string[]
}

export interface CoverLetterDraftWithMetadata extends CoverLetterDraft {
  metadata: GenerationMetadata
}

// =============================================================================
// Search Session Types
// =============================================================================

export interface SearchSession {
  id: string
  userProfile: UserProfileWithMetadata | null
  searchConfig: SearchConfig | null
  coverLetterTemplate: string | null
  jobs: JobOpportunity[]
  analyses: Record<string, FitAnalysis>
  coverLetters: Record<string, CoverLetterDraft>
  status: PipelineStage
  progress: number
  error: string | null
  // Session metadata
  createdAt: string
  updatedAt: string
}

export type PipelineStage =
  | 'idle'
  | 'parsing'
  | 'searching'
  | 'analyzing'
  | 'generating'
  | 'exporting'
  | 'completed'
  | 'cancelled'
  | 'error'

// =============================================================================
// Pipeline Event Types (for SSE streaming)
// =============================================================================

export type PipelineEvent =
  | { event: 'phase'; data: PhaseUpdate }
  | { event: 'profile'; data: UserProfileWithMetadata }
  | { event: 'job'; data: JobOpportunity }
  | { event: 'analysis'; data: FitAnalysis }
  | { event: 'coverLetter'; data: CoverLetterDraft }
  | { event: 'export'; data: ExportUpdate }
  | { event: 'complete'; data: PipelineSummary }
  | { event: 'error'; data: PipelineError }
  | { event: 'heartbeat'; data: { timestamp: string } }

export interface PhaseUpdate {
  phase: PipelineStage
  progress: number
  message?: string
}

export interface ExportUpdate {
  files: string[]
  outputDir: string
}

export interface PipelineSummary {
  totalJobs: number
  analyzedJobs: number
  highFitJobs: number // score >= 80
  mediumFitJobs: number // score 60-79
  coverLettersGenerated: number
  filesExported: number
  durationMs: number
}

export interface PipelineError {
  message: string
  code: string
  phase: PipelineStage
  recoverable: boolean
}

// =============================================================================
// Export Types
// =============================================================================

export interface ExportInput {
  jobs: JobOpportunity[]
  analyses: Record<string, FitAnalysis>
  coverLetters: Record<string, CoverLetterDraft>
  outputDir: string
}

export interface ExportOutput {
  success: boolean
  files: string[]
  summaryPath: string
  count: number
  outputDir: string
}
