"use client"

/**
 * SSE Pipeline Client Hook
 *
 * Connects to /api/pipeline via SSE and provides:
 * - Real-time updates as jobs/analyses stream in
 * - AbortController for cancellation
 * - Type-safe event handling
 *
 * Server uses @agenisea/sse-kit for stream creation.
 * Client uses manual parsing to support event type tracking.
 */

import { useRef, useCallback } from "react"
import { useSearch } from "@/lib/context/search-context"
import type {
  SearchConfig,
  UserProfileWithMetadata,
  JobOpportunity,
  FitAnalysis,
  CoverLetterDraft,
  PipelineSummary,
  PipelineError,
  PhaseUpdate,
} from "@/lib/types"

interface UsePipelineSSEOptions {
  onComplete?: (summary: PipelineSummary) => void
  onError?: (error: PipelineError) => void
}

interface UsePipelineSSE {
  start: (resumeFile: File, config: SearchConfig, template?: string | null) => Promise<void>
  cancel: () => void
  isRunning: boolean
}

// SSE event structure from the server
interface SSEMessage {
  event: string
  data: unknown
}

export function usePipelineSSE(options: UsePipelineSSEOptions = {}): UsePipelineSSE {
  const abortControllerRef = useRef<AbortController | null>(null)
  const isRunningRef = useRef(false)

  const {
    updateStatus,
    updateProgress,
    setUserProfile,
    addJob,
    addAnalysis,
    addCoverLetter,
    setError,
  } = useSearch()

  // Event handler - processes parsed SSE messages
  const handleMessage = useCallback(
    (message: SSEMessage) => {
      switch (message.event) {
        case "phase": {
          const phase = message.data as PhaseUpdate
          updateStatus(phase.phase)
          updateProgress(phase.progress)
          break
        }

        case "profile": {
          const profile = message.data as UserProfileWithMetadata
          setUserProfile(profile)
          break
        }

        case "job": {
          const job = message.data as JobOpportunity
          addJob(job)
          break
        }

        case "analysis": {
          const analysis = message.data as FitAnalysis
          addAnalysis(analysis)
          break
        }

        case "coverLetter": {
          const letter = message.data as CoverLetterDraft
          addCoverLetter(letter)
          break
        }

        case "complete": {
          const summary = message.data as PipelineSummary
          updateStatus("completed")
          updateProgress(100)
          options.onComplete?.(summary)
          break
        }

        case "error": {
          const error = message.data as PipelineError
          setError(error.message)
          updateStatus("error")
          options.onError?.(error)
          break
        }

        case "heartbeat":
          // Keep-alive, no action needed
          break
      }
    },
    [updateStatus, updateProgress, setUserProfile, addJob, addAnalysis, addCoverLetter, setError, options]
  )

  const start = useCallback(
    async (resumeFile: File, config: SearchConfig, template?: string | null) => {
      // Prevent double-start
      if (isRunningRef.current) {
        console.warn("[usePipelineSSE] Pipeline already running")
        return
      }

      // Create new AbortController
      abortControllerRef.current = new AbortController()
      isRunningRef.current = true

      // Track current event type for SSE parsing
      let currentEvent = "message"

      try {
        // Build form data
        const formData = new FormData()
        formData.append("resume", resumeFile)
        formData.append(
          "config",
          JSON.stringify({
            searchConfig: config,
            template: template || null,
            options: {
              minFitScore: 60,
              generateCoverLetters: true,
            },
          })
        )

        // Start SSE request
        const response = await fetch("/api/pipeline", {
          method: "POST",
          body: formData,
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`Pipeline request failed: ${response.status}`)
        }

        if (!response.body) {
          throw new Error("No response body")
        }

        // Read SSE stream using sse-kit parser
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            break
          }

          // Decode chunk and add to buffer
          buffer += decoder.decode(value, { stream: true })

          // Process complete lines
          const lines = buffer.split("\n")
          buffer = lines.pop() || "" // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim()

            // Track event type
            if (trimmed.startsWith("event:")) {
              currentEvent = trimmed.slice(6).trim()
            }
            // Parse data lines
            else if (trimmed.startsWith("data:")) {
              const dataStr = trimmed.slice(5).trim()
              if (dataStr) {
                try {
                  const data = JSON.parse(dataStr)
                  handleMessage({ event: currentEvent, data })
                } catch {
                  // Non-JSON data (like heartbeat), ignore
                }
              }
            }
          }
        }
      } catch (error) {
        // Handle abort gracefully
        if (error instanceof DOMException && error.name === "AbortError") {
          console.log("[usePipelineSSE] Pipeline aborted by user")
          updateStatus("cancelled")
          return
        }

        // Real error
        console.error("[usePipelineSSE] Pipeline error:", error)
        const errorMessage = error instanceof Error ? error.message : "Pipeline failed"
        setError(errorMessage)
        options.onError?.({
          message: errorMessage,
          code: "PIPELINE_ERROR",
          phase: "error",
          recoverable: false,
        })
      } finally {
        isRunningRef.current = false
        abortControllerRef.current = null
      }
    },
    [handleMessage, updateStatus, setError, options]
  )

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      updateStatus("cancelled")
    }
  }, [updateStatus])

  return {
    start,
    cancel,
    isRunning: isRunningRef.current,
  }
}
