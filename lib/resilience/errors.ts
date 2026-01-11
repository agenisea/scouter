/**
 * Error Types for Scouter Pipeline
 *
 * Principle Focus: Clarity (name things precisely), Trust (fail openly)
 *
 * Provides a consistent error taxonomy across all agents
 */

export type PipelinePhase =
  | 'idle'
  | 'parsing'
  | 'searching'
  | 'analyzing'
  | 'generating'
  | 'exporting'
  | 'completed'
  | 'error'

export type ErrorCode =
  | 'PARSE_FAILED'
  | 'INVALID_PDF'
  | 'EMPTY_CONTENT'
  | 'SEARCH_FAILED'
  | 'RATE_LIMITED'
  | 'ANALYSIS_FAILED'
  | 'GENERATION_FAILED'
  | 'EXPORT_FAILED'
  | 'TIMEOUT'
  | 'CIRCUIT_OPEN'
  | 'VALIDATION_FAILED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'

/**
 * Base error class for all Scouter errors
 *
 * Includes phase context and recoverability flag for resilient handling
 */
export class ScouterError extends Error {
  public readonly timestamp: string

  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly recoverable: boolean,
    public readonly phase: PipelinePhase,
    public readonly context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ScouterError'
    this.timestamp = new Date().toISOString()

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ScouterError)
    }
  }

  /**
   * Serialize error for SSE transmission
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      recoverable: this.recoverable,
      phase: this.phase,
      timestamp: this.timestamp,
      context: this.context,
    }
  }
}

/**
 * Parse-specific errors
 */
export class ParseError extends ScouterError {
  constructor(
    message: string,
    code: 'PARSE_FAILED' | 'INVALID_PDF' | 'EMPTY_CONTENT' = 'PARSE_FAILED',
    recoverable = false,
    context?: Record<string, unknown>
  ) {
    super(message, code, recoverable, 'parsing', context)
    this.name = 'ParseError'
  }
}

/**
 * Search-specific errors
 */
export class SearchError extends ScouterError {
  constructor(
    message: string,
    code: 'SEARCH_FAILED' | 'RATE_LIMITED' | 'TIMEOUT' = 'SEARCH_FAILED',
    recoverable = true,
    context?: Record<string, unknown>
  ) {
    super(message, code, recoverable, 'searching', context)
    this.name = 'SearchError'
  }
}

/**
 * Analysis-specific errors
 */
export class AnalysisError extends ScouterError {
  constructor(
    message: string,
    code: 'ANALYSIS_FAILED' | 'TIMEOUT' = 'ANALYSIS_FAILED',
    recoverable = true,
    context?: Record<string, unknown>
  ) {
    super(message, code, recoverable, 'analyzing', context)
    this.name = 'AnalysisError'
  }
}

/**
 * Generation-specific errors
 */
export class GenerationError extends ScouterError {
  constructor(
    message: string,
    code: 'GENERATION_FAILED' | 'TIMEOUT' = 'GENERATION_FAILED',
    recoverable = true,
    context?: Record<string, unknown>
  ) {
    super(message, code, recoverable, 'generating', context)
    this.name = 'GenerationError'
  }
}

/**
 * Export-specific errors
 */
export class ExportError extends ScouterError {
  constructor(
    message: string,
    code: 'EXPORT_FAILED' = 'EXPORT_FAILED',
    recoverable = true,
    context?: Record<string, unknown>
  ) {
    super(message, code, recoverable, 'exporting', context)
    this.name = 'ExportError'
  }
}

/**
 * Type guard for ScouterError
 */
function isScouterError(error: unknown): error is ScouterError {
  return error instanceof ScouterError
}

/**
 * Wrap unknown errors into ScouterError
 */
export function wrapError(
  error: unknown,
  phase: PipelinePhase,
  defaultCode: ErrorCode = 'UNKNOWN'
): ScouterError {
  if (isScouterError(error)) {
    return error
  }

  const message = error instanceof Error ? error.message : String(error)
  return new ScouterError(message, defaultCode, false, phase, {
    originalError: error instanceof Error ? error.name : typeof error,
  })
}
