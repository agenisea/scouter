/**
 * SSE Handler Utilities
 *
 * Principle Focus:
 * - Delight: Real-time progress updates
 * - Resilience: Heartbeat, graceful close
 * - Scale: Observability hooks
 *
 * Uses @agenisea/sse-kit for production-ready SSE streaming
 */

import {
  createStreamingResponse,
  createSSEResponse,
  type StreamOrchestrator,
  type StreamObserver,
} from '@agenisea/sse-kit/server'
import type {
  PipelineStage,
  UserProfileWithMetadata,
  JobOpportunity,
  FitAnalysis,
  CoverLetterDraft,
  ExportUpdate,
  PipelineSummary,
  PipelineError,
} from '@/lib/types'

export interface PipelineStreamConfig {
  signal?: AbortSignal
  heartbeatMs?: number
  onStart?: () => void
  onEnd?: (durationMs: number, success: boolean, error?: Error) => void
}

export interface PipelineOrchestrator {
  orchestrator: StreamOrchestrator
  stream: ReadableStream<Uint8Array>
  response: Response

  // Typed event senders
  sendPhase: (phase: PipelineStage, progress: number, message?: string) => Promise<void>
  sendJob: (job: JobOpportunity) => Promise<void>
  sendProfile: (profile: UserProfileWithMetadata) => Promise<void>
  sendAnalysis: (analysis: FitAnalysis) => Promise<void>
  sendCoverLetter: (letter: CoverLetterDraft) => Promise<void>
  sendExport: (exportData: ExportUpdate) => Promise<void>
  sendComplete: (summary: PipelineSummary) => Promise<void>
  sendError: (error: PipelineError) => Promise<void>

  // Lifecycle
  startHeartbeat: () => void
  close: () => Promise<void>
  abort: (reason?: string) => void
}

/**
 * Create a pipeline-specific SSE stream
 *
 * @param config - Stream configuration
 * @returns Pipeline orchestrator with typed event senders
 */
export function createPipelineStream(config: PipelineStreamConfig = {}): PipelineOrchestrator {
  const observer: StreamObserver = {
    onStreamStart: () => {
      console.log('[pipeline] Stream started')
      config.onStart?.()
    },
    onStreamEnd: (durationMs, success, error) => {
      console.log(`[pipeline] Stream ended: ${durationMs}ms, success=${success}`)
      config.onEnd?.(durationMs, success, error)
    },
    onHeartbeat: () => {
      console.debug('[pipeline] Heartbeat sent')
    },
    onAbort: (reason) => {
      console.warn(`[pipeline] Aborted: ${reason}`)
    },
  }

  const { stream, orchestrator } = createStreamingResponse({
    signal: config.signal,
    heartbeat: {
      intervalMs: config.heartbeatMs ?? 5000,
    },
    observer,
  })

  const response = createSSEResponse(stream)

  return {
    orchestrator,
    stream,
    response,

    // Typed event senders for pipeline events
    sendPhase: async (phase, progress, message) => {
      await orchestrator.sendEvent('phase', { phase, progress, message })
    },

    sendJob: async (job) => {
      await orchestrator.sendEvent('job', job)
    },

    sendProfile: async (profile) => {
      await orchestrator.sendEvent('profile', profile)
    },

    sendAnalysis: async (analysis) => {
      await orchestrator.sendEvent('analysis', analysis)
    },

    sendCoverLetter: async (letter) => {
      await orchestrator.sendEvent('coverLetter', letter)
    },

    sendExport: async (exportData) => {
      await orchestrator.sendEvent('export', exportData)
    },

    sendComplete: async (summary) => {
      await orchestrator.sendEvent('complete', summary)
    },

    sendError: async (error) => {
      await orchestrator.sendEvent('error', error)
    },

    // Lifecycle methods
    startHeartbeat: () => {
      orchestrator.startHeartbeat()
    },

    close: async () => {
      await orchestrator.close()
    },

    abort: (reason) => {
      orchestrator.abort(reason)
    },
  }
}

/**
 * Progress calculator for pipeline phases
 */
export function calculateProgress(
  phase: PipelineStage,
  subProgress: number = 0
): number {
  const phaseRanges: Record<PipelineStage, [number, number]> = {
    idle: [0, 0],
    parsing: [0, 15],
    searching: [15, 35],
    analyzing: [35, 75],
    generating: [75, 90],
    exporting: [90, 100],
    completed: [100, 100],
    cancelled: [0, 0],
    error: [0, 0],
  }

  const [start, end] = phaseRanges[phase]
  return Math.round(start + (end - start) * (subProgress / 100))
}
