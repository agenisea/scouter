"use client"

import { Button } from "@/components/ui/button"
import { ExternalLink, Download } from "lucide-react"
import type { JobOpportunity } from "@/lib/types"

interface JobActionsProps {
  job: JobOpportunity
  onDownload: () => void
}

export function JobActions({ job, onDownload }: JobActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild className="gap-2">
        <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer">
          Apply on {job.source === "wellfound" ? "Wellfound" : job.source === "linkedin" ? "LinkedIn" : "Website"}
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
      <Button variant="outline" onClick={onDownload} className="gap-2 bg-transparent">
        <Download className="h-4 w-4" />
        Download Markdown
      </Button>
    </div>
  )
}
