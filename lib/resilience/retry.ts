/**
 * Retry Logic with Exponential Backoff
 *
 * Principle Focus: Resilience (defensive coding, idempotent operations)
 *
 * Features:
 * - Exponential backoff with jitter
 * - Configurable retry conditions
 * - Observability hooks
 */

import { ScouterError, type ErrorCode } from './errors'

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number
  /** Initial delay in milliseconds */
  baseDelay: number
  /** Maximum delay cap in milliseconds */
  maxDelay: number
  /** Multiplier for exponential backoff */
  backoffMultiplier: number
  /** Add randomness to prevent thundering herd */
  jitter: boolean
  /** Error codes/patterns that should trigger retry */
  retryablePatterns: string[]
}

export interface RetryObserver {
  onRetry?: (attempt: number, delay: number, error: unknown) => void
  onSuccess?: (attempt: number) => void
  onExhausted?: (attempts: number, lastError: unknown) => void
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
  retryablePatterns: [
    'TIMEOUT',
    'RATE_LIMITED',
    '429',
    '503',
    '502',
    '500',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'fetch failed',
  ],
}

/**
 * Execute an operation with retry logic
 *
 * @param operation - Async function to execute
 * @param config - Partial retry configuration (merged with defaults)
 * @param observer - Optional observability hooks
 * @returns Result of the operation
 * @throws Last error if all retries exhausted
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  observer?: RetryObserver
): Promise<T> {
  const opts: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: unknown

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await operation()
      observer?.onSuccess?.(attempt)
      return result
    } catch (error) {
      lastError = error

      // Check if error is retryable
      if (!isRetryable(error, opts.retryablePatterns)) {
        throw error
      }

      // Check if we've exhausted retries
      if (attempt === opts.maxRetries) {
        observer?.onExhausted?.(attempt + 1, error)
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = calculateDelay(attempt, opts)
      observer?.onRetry?.(attempt + 1, delay, error)

      await sleep(delay)
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError
}

/**
 * Check if an error is retryable based on patterns
 */
function isRetryable(error: unknown, patterns: string[]): boolean {
  // Extract error information
  const errorInfo = extractErrorInfo(error)

  // Check each pattern against error info
  return patterns.some(
    (pattern) =>
      errorInfo.code.includes(pattern) ||
      errorInfo.status.includes(pattern) ||
      errorInfo.message.toLowerCase().includes(pattern.toLowerCase())
  )
}

/**
 * Extract error information for pattern matching
 */
function extractErrorInfo(error: unknown): {
  code: string
  status: string
  message: string
} {
  if (error instanceof ScouterError) {
    return {
      code: error.code,
      status: '',
      message: error.message,
    }
  }

  if (error instanceof Error) {
    const err = error as Error & { code?: string; status?: number; statusCode?: number }
    return {
      code: err.code || '',
      status: String(err.status || err.statusCode || ''),
      message: err.message,
    }
  }

  return {
    code: '',
    status: '',
    message: String(error),
  }
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff: baseDelay * (multiplier ^ attempt)
  let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt)

  // Cap at maxDelay
  delay = Math.min(delay, config.maxDelay)

  // Add jitter (0.5 to 1.5 multiplier) to prevent thundering herd
  if (config.jitter) {
    delay = delay * (0.5 + Math.random())
  }

  return Math.floor(delay)
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Preset configurations for common use cases
 */
export const RetryPresets = {
  /** Fast retries for quick operations */
  fast: {
    maxRetries: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffMultiplier: 1.5,
  } as Partial<RetryConfig>,

  /** Standard retries for API calls */
  standard: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  } as Partial<RetryConfig>,

  /** Aggressive retries for critical operations */
  aggressive: {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  } as Partial<RetryConfig>,

  /** Rate limit specific (longer delays) */
  rateLimited: {
    maxRetries: 3,
    baseDelay: 5000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    retryablePatterns: ['429', 'RATE_LIMITED', 'rate limit'],
  } as Partial<RetryConfig>,
}
