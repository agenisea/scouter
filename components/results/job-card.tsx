"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { FitScoreBadge } from "@/components/shared/fit-score-badge"
import { RemoteBadge } from "@/components/shared/remote-badge"
import { Building2, MapPin, Check, X } from "lucide-react"
import type { JobOpportunity, FitAnalysis } from "@/lib/types"

interface JobCardProps {
  job: JobOpportunity
  analysis?: FitAnalysis
  isSelected: boolean
  onToggleSelect: (jobId: string) => void
}

export function JobCard({ job, analysis, isSelected, onToggleSelect }: JobCardProps) {
  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(job.id)}
            className="mt-1"
            aria-label={`Select ${job.title} at ${job.company}`}
          />

          <Link href={`/job/${job.id}`} className="flex-1 min-w-0 group">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors truncate">
                  {job.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{job.company}</span>
                  </div>
                  {job.location && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {analysis && (
                <div className="flex-shrink-0">
                  <FitScoreBadge score={analysis.overallScore} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <RemoteBadge status={job.remoteStatus} />
              {job.salaryRange && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{job.salaryRange}</span>
              )}
            </div>

            {analysis && job.techStack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {job.techStack.slice(0, 5).map((tech) => {
                  const isMatched = analysis.techStackMatch.matched.includes(tech)
                  return (
                    <div
                      key={tech}
                      className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 ${
                        isMatched
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground line-through opacity-60"
                      }`}
                    >
                      {isMatched ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>{tech}</span>
                    </div>
                  )
                })}
                {job.techStack.length > 5 && (
                  <span className="text-xs text-muted-foreground px-2 py-1">+{job.techStack.length - 5} more</span>
                )}
              </div>
            )}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
