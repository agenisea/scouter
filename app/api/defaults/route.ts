import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const RESUME_PATH = path.join(process.cwd(), "RESUME.pdf")
const TEMPLATE_PATH = path.join(process.cwd(), "COVER_LETTER_TEMPLATE.md")

export async function GET() {
  const result: {
    hasResume: boolean
    hasTemplate: boolean
    template: string | null
  } = {
    hasResume: false,
    hasTemplate: false,
    template: null,
  }

  // Check for resume
  if (existsSync(RESUME_PATH)) {
    result.hasResume = true
  }

  // Check for template and read it
  if (existsSync(TEMPLATE_PATH)) {
    result.hasTemplate = true
    try {
      const content = await readFile(TEMPLATE_PATH, "utf-8")
      // Extract just the template part (before the ---) if it has documentation
      const templateMatch = content.match(/^([\s\S]*?)(?:\n---|\n## )/m)
      result.template = templateMatch ? templateMatch[1].trim() : content.trim()
    } catch {
      result.template = null
    }
  }

  return NextResponse.json(result)
}
