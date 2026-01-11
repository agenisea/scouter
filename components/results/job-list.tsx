"use client"

import { JobCard } from "./job-card"
import type { JobOpportunity, FitAnalysis } from "@/lib/types"

interface JobListProps {
  jobs: JobOpportunity[]
  analyses: Record<string, FitAnalysis>
  selectedJobs: Set<string>
  onToggleSelect: (jobId: string) => void
}

export function JobList({ jobs, analyses, selectedJobs, onToggleSelect }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No jobs match your filters</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          analysis={analyses[job.id]}
          isSelected={selectedJobs.has(job.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  )
}
