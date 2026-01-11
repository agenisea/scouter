/**
 * PDF Parser Utility
 *
 * Principle Focus: Clarity (explicit error messages), Resilience (graceful degradation)
 *
 * Single Responsibility: Extract text from PDF buffers
 */

import { extractText } from 'unpdf'

export interface PDFParseResult {
  text: string
  metadata: {
    pages: number
    info: Record<string, unknown>
  }
}

export interface PDFParseError {
  code: 'INVALID_PDF' | 'PARSE_FAILED' | 'EMPTY_CONTENT'
  message: string
  recoverable: boolean
}

/**
 * Extract text content from a PDF buffer
 *
 * @param buffer - PDF file as Buffer or Uint8Array
 * @returns Extracted text with metadata
 * @throws PDFParseError on failure
 */
export async function extractTextFromPDF(buffer: Buffer | Uint8Array): Promise<PDFParseResult> {
  if (!buffer || buffer.length === 0) {
    throw createPDFError('INVALID_PDF', 'Empty buffer provided', false)
  }

  // Check PDF magic bytes (PDF files start with %PDF)
  const header = Buffer.from(buffer.subarray(0, 5)).toString('utf-8')
  if (!header.startsWith('%PDF')) {
    throw createPDFError('INVALID_PDF', 'File is not a valid PDF', false)
  }

  try {
    // Create a fresh Uint8Array copy for unpdf (it rejects Node.js Buffer)
    const data = Uint8Array.from(buffer)

    const result = await extractText(data, { mergePages: true })

    const fullText = result.text?.trim() ?? ''

    if (!fullText || fullText.length === 0) {
      throw createPDFError(
        'EMPTY_CONTENT',
        'PDF contains no extractable text (may be image-based)',
        true
      )
    }

    return {
      text: fullText,
      metadata: {
        pages: result.totalPages ?? 0,
        info: {},
      },
    }
  } catch (error) {
    // Re-throw our custom errors
    if (isPDFParseError(error)) {
      throw error
    }

    // Wrap unknown errors
    const message = error instanceof Error ? error.message : 'Unknown PDF parsing error'
    throw createPDFError('PARSE_FAILED', message, false)
  }
}

/**
 * Type guard for PDFParseError
 */
export function isPDFParseError(error: unknown): error is PDFParseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'recoverable' in error
  )
}

/**
 * Factory function for PDFParseError
 */
function createPDFError(
  code: PDFParseError['code'],
  message: string,
  recoverable: boolean
): PDFParseError {
  return { code, message, recoverable }
}
