import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const RESUME_PATH = path.join(process.cwd(), "RESUME.pdf")

export async function GET() {
  if (!existsSync(RESUME_PATH)) {
    return NextResponse.json({ error: "No default resume found" }, { status: 404 })
  }

  try {
    const buffer = await readFile(RESUME_PATH)
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=RESUME.pdf",
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to read resume" }, { status: 500 })
  }
}
