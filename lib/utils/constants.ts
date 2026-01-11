export const APP_NAME = "Scouter"
export const APP_DESCRIPTION = "AI-powered job search assistant for tech professionals"

export const JOB_SOURCES = ["linkedin", "indeed", "wellfound", "company_site", "ziprecruiter", "glassdoor", "monster"] as const
export const REMOTE_STATUSES = ["remote", "hybrid", "onsite", "unknown"] as const
export const SENIORITY_LEVELS = ["junior", "mid", "senior", "staff", "principal"] as const

export const PIPELINE_STAGES = {
  idle: "Ready to start",
  parsing: "Parsing resume",
  searching: "Searching job boards",
  analyzing: "Analyzing fit",
  generating: "Generating cover letters",
  exporting: "Exporting results",
  completed: "Complete",
  cancelled: "Cancelled",
  error: "Error",
} as const

export const FIT_SCORE_COLORS = {
  high: "emerald", // >= 80
  medium: "amber", // >= 60
  low: "red", // < 60
} as const

export const COVER_LETTER_PLACEHOLDERS = [
  "COMPANY_NAME",
  "ROLE_TITLE",
  "OPENING_HOOK",
  "EXPERIENCE_HIGHLIGHT_1",
  "EXPERIENCE_HIGHLIGHT_2",
  "SKILLS_BRIDGE",
  "CLOSING",
  "CANDIDATE_NAME",
] as const
