"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type {
  SearchSession,
  UserProfile,
  UserProfileWithMetadata,
  SearchConfig,
  JobOpportunity,
  FitAnalysis,
  CoverLetterDraft,
  PipelineStage,
} from "@/lib/types"

const STORAGE_KEYS = {
  searchConfig: "scouter:searchConfig",
  coverLetterTemplate: "scouter:coverLetterTemplate",
  resumeData: "scouter:resumeData",
} as const

// Helper to safely access localStorage
function getStoredValue<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

function setStoredValue<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.warn("Failed to save to localStorage:", key)
  }
}

// Convert File to storable format (chunked to avoid stack overflow)
async function fileToStorable(file: File): Promise<{ name: string; type: string; data: string }> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  // Process in chunks to avoid stack overflow on large files
  let binary = ""
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, chunk as unknown as number[])
  }

  const base64 = btoa(binary)
  return { name: file.name, type: file.type, data: base64 }
}

// Convert stored format back to File
function storableToFile(stored: { name: string; type: string; data: string }): File {
  const binary = atob(stored.data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], stored.name, { type: stored.type })
}

interface SearchContextType {
  session: SearchSession
  resumeFile: File | null
  isHydrated: boolean
  setResumeFile: (file: File | null) => void
  setUserProfile: (profile: UserProfileWithMetadata) => void
  setSearchConfig: (config: SearchConfig) => void
  setCoverLetterTemplate: (template: string) => void
  addJob: (job: JobOpportunity) => void
  addAnalysis: (analysis: FitAnalysis) => void
  addCoverLetter: (coverLetter: CoverLetterDraft) => void
  updateStatus: (status: PipelineStage) => void
  updateProgress: (progress: number) => void
  setError: (error: string) => void
  resetSession: () => void
  resetPipeline: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

const createInitialSession = (): SearchSession => ({
  id: crypto.randomUUID(),
  userProfile: null,
  searchConfig: null,
  coverLetterTemplate: null,
  jobs: [],
  analyses: {},
  coverLetters: {},
  status: "idle",
  progress: 0,
  error: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export function SearchProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SearchSession>(createInitialSession())
  const [resumeFile, setResumeFileState] = useState<File | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cached values on mount
  useEffect(() => {
    const cachedConfig = getStoredValue<SearchConfig>(STORAGE_KEYS.searchConfig)
    const cachedTemplate = getStoredValue<string>(STORAGE_KEYS.coverLetterTemplate)
    const cachedResume = getStoredValue<{ name: string; type: string; data: string }>(STORAGE_KEYS.resumeData)

    if (cachedConfig) {
      setSession((prev) => ({ ...prev, searchConfig: cachedConfig }))
    }
    if (cachedTemplate) {
      setSession((prev) => ({ ...prev, coverLetterTemplate: cachedTemplate }))
    }
    if (cachedResume) {
      try {
        const file = storableToFile(cachedResume)
        setResumeFileState(file)
      } catch {
        console.warn("Failed to restore cached resume")
      }
    }
    setIsHydrated(true)
  }, [])

  const setResumeFile = useCallback(async (file: File | null) => {
    setResumeFileState(file)
    if (file) {
      const storable = await fileToStorable(file)
      setStoredValue(STORAGE_KEYS.resumeData, storable)
    } else {
      localStorage.removeItem(STORAGE_KEYS.resumeData)
    }
  }, [])

  const setUserProfile = useCallback((profile: UserProfileWithMetadata) => {
    setSession((prev) => ({ ...prev, userProfile: profile }))
  }, [])

  const setSearchConfig = useCallback((config: SearchConfig) => {
    setSession((prev) => ({ ...prev, searchConfig: config }))
    setStoredValue(STORAGE_KEYS.searchConfig, config)
  }, [])

  const setCoverLetterTemplate = useCallback((template: string) => {
    setSession((prev) => ({ ...prev, coverLetterTemplate: template }))
    setStoredValue(STORAGE_KEYS.coverLetterTemplate, template)
  }, [])

  const addJob = useCallback((job: JobOpportunity) => {
    setSession((prev) => ({
      ...prev,
      jobs: [...prev.jobs, job],
    }))
  }, [])

  const addAnalysis = useCallback((analysis: FitAnalysis) => {
    setSession((prev) => ({
      ...prev,
      analyses: { ...prev.analyses, [analysis.jobId]: analysis },
    }))
  }, [])

  const addCoverLetter = useCallback((coverLetter: CoverLetterDraft) => {
    setSession((prev) => ({
      ...prev,
      coverLetters: { ...prev.coverLetters, [coverLetter.jobId]: coverLetter },
    }))
  }, [])

  const updateStatus = useCallback((status: PipelineStage) => {
    setSession((prev) => ({ ...prev, status }))
  }, [])

  const updateProgress = useCallback((progress: number) => {
    setSession((prev) => ({ ...prev, progress }))
  }, [])

  const setError = useCallback((error: string) => {
    setSession((prev) => ({ ...prev, error, status: "error" }))
  }, [])

  const resetSession = useCallback(() => {
    setSession(createInitialSession())
  }, [])

  // Reset only pipeline state (status, jobs, results) - keeps form config
  const resetPipeline = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      userProfile: null,
      jobs: [],
      analyses: {},
      coverLetters: {},
      status: "idle",
      progress: 0,
      error: null,
    }))
  }, [])

  return (
    <SearchContext.Provider
      value={{
        session,
        resumeFile,
        isHydrated,
        setResumeFile,
        setUserProfile,
        setSearchConfig,
        setCoverLetterTemplate,
        addJob,
        addAnalysis,
        addCoverLetter,
        updateStatus,
        updateProgress,
        setError,
        resetSession,
        resetPipeline,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider")
  }
  return context
}
