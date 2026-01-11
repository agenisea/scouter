import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract JSON from AI responses
 * Handles:
 * - ```json ... ``` code fences
 * - Raw JSON with trailing text
 * - JSON embedded in explanatory text
 */
export function sanitizeLLMResponse(text: string): string {
  const trimmed = text.trim()

  // Try to extract from code fences first
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }

  // Try to extract a JSON object (find matching braces)
  const jsonStart = trimmed.indexOf('{')
  if (jsonStart !== -1) {
    let depth = 0
    let inString = false
    let escape = false

    for (let i = jsonStart; i < trimmed.length; i++) {
      const char = trimmed[i]

      if (escape) {
        escape = false
        continue
      }

      if (char === '\\' && inString) {
        escape = true
        continue
      }

      if (char === '"' && !escape) {
        inString = !inString
        continue
      }

      if (!inString) {
        if (char === '{') depth++
        if (char === '}') {
          depth--
          if (depth === 0) {
            return trimmed.slice(jsonStart, i + 1)
          }
        }
      }
    }
  }

  return trimmed
}
