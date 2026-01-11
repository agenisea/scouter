"use client"

/**
 * Search Progress Component
 *
 * Pure UI component that displays pipeline progress.
 * All orchestration logic is handled by usePipelineSSE hook.
 */

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StageIndicator } from "./stage-indicator"
import { JobStream } from "./job-stream"
import { CancelButton } from "./cancel-button"
import { useSearch } from "@/lib/context/search-context"
import { usePipelineSSE } from "@/hooks/use-pipeline-sse"
import { Loader2 } from "lucide-react"

export function SearchProgress() {
  const router = useRouter()
  const { session, resumeFile, isHydrated } = useSearch()
  const hasStarted = useRef(false)

  // Track latest session to avoid stale closure in callbacks
  const sessionRef = useRef(session)
  sessionRef.current = session

  const pipeline = usePipelineSSE({
    onComplete: () => {
      // Save results to localStorage before redirect (use ref for latest data)
      saveResultsToStorage(sessionRef.current)
      setTimeout(() => router.push("/search/results"), 1000)
    },
  })

  // Start pipeline when ready
  useEffect(() => {
    if (!isHydrated) return
    if (!resumeFile || !session.searchConfig) return
    if (session.status !== "idle" || hasStarted.current) return

    hasStarted.current = true
    pipeline.start(resumeFile, session.searchConfig, session.coverLetterTemplate)
  }, [isHydrated, resumeFile, session.searchConfig, session.coverLetterTemplate, session.status, pipeline])

  const handleCancel = () => {
    pipeline.cancel()
    setTimeout(() => router.push("/search"), 500)
  }

  // Save results to localStorage for the results page
  // Accepts session parameter to avoid stale closure issues
  const saveResultsToStorage = (currentSession: typeof session) => {
    const timestamp = new Date().toISOString().split("T")[0]

    // Generate markdown
    let markdown = `# Job Search Results - ${timestamp}\n\n`

    if (currentSession.userProfile) {
      markdown += `## Candidate Profile\n`
      markdown += `- **Experience**: ${currentSession.userProfile.experienceYears} years\n`
      markdown += `- **Seniority**: ${currentSession.userProfile.seniorityLevel}\n`
      markdown += `- **Skills**: ${currentSession.userProfile.skills.slice(0, 10).join(", ")}\n`
      markdown += `- **Tech Stack**: ${currentSession.userProfile.techStack.slice(0, 8).join(", ")}\n\n`
    }

    markdown += `---\n\n`
    markdown += `## Jobs Found (${currentSession.jobs.length})\n\n`

    const sortedJobs = [...currentSession.jobs].sort((a, b) => {
      const scoreA = currentSession.analyses[a.id]?.overallScore ?? 0
      const scoreB = currentSession.analyses[b.id]?.overallScore ?? 0
      return scoreB - scoreA
    })

    for (const job of sortedJobs) {
      const analysis = currentSession.analyses[job.id]
      const coverLetter = currentSession.coverLetters[job.id]

      markdown += `### ${job.title} at ${job.company}\n\n`
      markdown += `- **Location**: ${job.location}\n`
      markdown += `- **Work**: ${job.remoteStatus}\n`
      if (job.salaryRange) markdown += `- **Salary**: ${job.salaryRange}\n`
      markdown += `- **Source**: ${job.source}\n`
      markdown += `- **Apply**: [${job.applicationUrl}](${job.applicationUrl})\n\n`

      if (analysis) {
        markdown += `#### Fit Analysis (Score: ${analysis.overallScore}/100)\n\n`
        markdown += `${analysis.summary}\n\n`
        markdown += `**Strengths**: ${analysis.strengths?.join(", ") || "N/A"}\n\n`
        markdown += `**Concerns**: ${analysis.concerns?.join(", ") || "None"}\n\n`
      }

      if (coverLetter) {
        markdown += `#### Generated Cover Letter\n\n`
        markdown += `${coverLetter.content}\n\n`
      }

      markdown += `---\n\n`
    }

    localStorage.setItem("scouter:resultsMarkdown", markdown)

    const structuredResults = {
      timestamp,
      profile: currentSession.userProfile
        ? {
            experienceYears: currentSession.userProfile.experienceYears,
            seniorityLevel: currentSession.userProfile.seniorityLevel,
            skills: currentSession.userProfile.skills.slice(0, 10),
            techStack: currentSession.userProfile.techStack.slice(0, 8),
          }
        : null,
      jobs: sortedJobs.map((job) => ({
        ...job,
        analysis: currentSession.analyses[job.id] || null,
        coverLetter: currentSession.coverLetters[job.id] || null,
      })),
    }
    localStorage.setItem("scouter:resultsData", JSON.stringify(structuredResults))
    localStorage.setItem("scouter:resultsTimestamp", new Date().toISOString())
  }

  // Cancelled state
  if (session.status === "cancelled") {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Search cancelled. Redirecting...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (session.status === "error") {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Card className="border-destructive">
          <CardContent className="pt-6 space-y-4">
            <p className="text-destructive font-medium">Error</p>
            <p className="text-muted-foreground">{session.error}</p>
            <button
              onClick={() => router.push("/search")}
              className="text-primary underline hover:no-underline"
            >
              Go back and try again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state
  if (!isHydrated || !resumeFile || !session.searchConfig) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Card>
          <CardContent className="pt-6 flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-muted-foreground">Preparing search...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main progress view
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Searching for opportunities</CardTitle>
            {session.status !== "completed" && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Overall Progress</p>
              <p className="text-sm text-muted-foreground">{session.progress}%</p>
            </div>
            <Progress value={session.progress} className="h-2" />
          </div>

          <StageIndicator currentStage={session.status} />

          {session.status === "completed" && (
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-center">
              <p className="text-sm font-medium text-primary">
                Search complete! Redirecting to results...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {session.jobs.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Jobs Discovered ({session.jobs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <JobStream jobs={session.jobs} />
          </CardContent>
        </Card>
      )}

      {session.status !== "completed" && (
        <div className="flex justify-center">
          <CancelButton onCancel={handleCancel} />
        </div>
      )}
    </div>
  )
}
