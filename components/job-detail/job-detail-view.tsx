"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FitScoreBadge } from "@/components/shared/fit-score-badge"
import { RemoteBadge } from "@/components/shared/remote-badge"
import { SourceBadge } from "@/components/shared/source-badge"
import { FitAnalysisSection } from "./fit-analysis"
import { CoverLetterEditor } from "./cover-letter-editor"
import { JobActions } from "./job-actions"
import { ArrowLeft, Building2, MapPin, Calendar, DollarSign } from "lucide-react"
import { formatTimeAgo } from "@/lib/utils/format"
import type { JobOpportunity, FitAnalysis, CoverLetterDraft } from "@/lib/types"

interface JobDetailViewProps {
  job: JobOpportunity
  analysis?: FitAnalysis
  coverLetter?: CoverLetterDraft
}

export function JobDetailView({ job, analysis, coverLetter }: JobDetailViewProps) {
  const handleDownload = () => {
    console.log("[v0] Download job details as markdown")
    // TODO: Implement markdown download
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4 gap-2 -ml-2">
          <Link href="/search/results">
            <ArrowLeft className="h-4 w-4" />
            Back to Results
          </Link>
        </Button>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold mb-3">{job.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      <span className="text-lg">{job.company}</span>
                    </div>
                    {job.location && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          <span>{job.location}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {analysis && <FitScoreBadge score={analysis.overallScore} showLabel />}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <RemoteBadge status={job.remoteStatus} />
                <SourceBadge source={job.source} />
                {job.postedDate && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Posted {formatTimeAgo(job.postedDate)}</span>
                  </div>
                )}
                {job.salaryRange && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>{job.salaryRange}</span>
                  </div>
                )}
              </div>

              <JobActions job={job} onDownload={handleDownload} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {analysis && <FitAnalysisSection analysis={analysis} />}

      <Card className="bg-card border-border">
        <CardContent className="pt-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-3">Job Description</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          {job.requirements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements.map((req, index) => (
                  <li key={index} className="text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.techStack.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {job.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium border border-primary/20"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {coverLetter && <CoverLetterEditor coverLetter={coverLetter} />}
    </div>
  )
}
