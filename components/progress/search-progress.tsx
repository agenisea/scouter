"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StageIndicator } from "./stage-indicator"
import { JobStream } from "./job-stream"
import { CancelButton } from "./cancel-button"
import { useSearch } from "@/lib/context/search-context"
import { Loader2 } from "lucide-react"
import type { JobOpportunity, FitAnalysis, CoverLetterDraft, UserProfile } from "@/lib/types"

export function SearchProgress() {
  const router = useRouter()
  const {
    session,
    resumeFile,
    isHydrated,
    updateStatus,
    updateProgress,
    setUserProfile,
    setError,
    addJob,
    addAnalysis,
    addCoverLetter,
  } = useSearch()
  const hasStarted = useRef(false)

  useEffect(() => {
    // Wait for hydration to complete before starting
    if (!isHydrated) return
    // Wait for required data to be available
    if (!resumeFile || !session.searchConfig) return
    if (session.status !== "idle" || hasStarted.current) return
    hasStarted.current = true

    // Capture the file reference for the async closure
    const file = resumeFile

    async function runPipeline() {
      try {
        // Stage 1: Parse resume
        updateStatus("parsing")
        updateProgress(10)

        const formData = new FormData()
        formData.append("file", file)

        const parseRes = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        })

        if (!parseRes.ok) {
          const err = await parseRes.json()
          throw new Error(err.error || "Failed to parse resume")
        }

        const { profile } = await parseRes.json()
        setUserProfile(profile)
        updateProgress(30)

        // Stage 2: Search jobs
        updateStatus("searching")
        updateProgress(40)

        if (!session.searchConfig) {
          throw new Error("No search config provided")
        }

        const searchRes = await fetch("/api/search-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: session.searchConfig }),
        })

        if (!searchRes.ok) {
          const err = await searchRes.json()
          throw new Error(err.error || "Failed to search jobs")
        }

        const { jobs } = await searchRes.json()
        const jobList: JobOpportunity[] = []
        for (const job of jobs) {
          addJob(job)
          jobList.push(job)
        }
        updateProgress(60)

        // Stage 3: Analyze fit for each job
        updateStatus("analyzing")
        const analyses: FitAnalysis[] = []

        for (let i = 0; i < jobList.length; i++) {
          const job = jobList[i]
          try {
            const analyzeRes = await fetch("/api/analyze-fit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ profile, job }),
            })

            if (analyzeRes.ok) {
              const { analysis } = await analyzeRes.json()
              addAnalysis(analysis)
              analyses.push(analysis)
            }
          } catch (e) {
            console.warn(`Failed to analyze job ${job.id}:`, e)
          }
          updateProgress(60 + Math.floor((i / jobList.length) * 20))
        }
        updateProgress(80)

        // Stage 4: Generate cover letters for top jobs (score >= 70)
        updateStatus("generating")
        const topJobs = jobList.filter((job) => {
          const analysis = analyses.find((a) => a.jobId === job.id)
          return analysis && analysis.overallScore >= 70
        })

        const coverLettersMap: Record<string, CoverLetterDraft> = {}

        for (let i = 0; i < topJobs.length; i++) {
          const job = topJobs[i]
          const analysis = analyses.find((a) => a.jobId === job.id)

          try {
            const generateRes = await fetch("/api/generate-cover-letter", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                profile,
                job,
                analysis,
                template: session.coverLetterTemplate,
              }),
            })

            if (generateRes.ok) {
              const { coverLetter } = await generateRes.json()
              addCoverLetter(coverLetter)
              coverLettersMap[coverLetter.jobId] = coverLetter
            }
          } catch (e) {
            console.warn(`Failed to generate cover letter for ${job.id}:`, e)
          }
          updateProgress(80 + Math.floor((i / topJobs.length) * 15))
        }
        updateProgress(95)

        // Stage 5: Generate and save markdown report
        generateMarkdownReport(profile, jobList, analyses, coverLettersMap)
        updateProgress(100)

        // Complete
        updateStatus("completed")
        setTimeout(() => router.push("/search/results"), 1000)
      } catch (error) {
        console.error("Pipeline error:", error)
        setError(error instanceof Error ? error.message : "An error occurred")
      }
    }

    runPipeline()
  }, [isHydrated, session.status, session.searchConfig, session.coverLetterTemplate, resumeFile, updateStatus, updateProgress, setUserProfile, setError, addJob, addAnalysis, addCoverLetter, router])

  const handleCancel = () => {
    updateStatus("cancelled")
    setTimeout(() => router.push("/"), 500)
  }

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

  // Show loading while waiting for required data
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Searching for opportunities</CardTitle>
            {session.status !== "completed" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
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
              <p className="text-sm font-medium text-primary">Search complete! Redirecting to results...</p>
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

function generateMarkdownReport(
  profile: UserProfile,
  jobs: JobOpportunity[],
  analyses: FitAnalysis[],
  coverLetters: Record<string, CoverLetterDraft>
): void {
  const timestamp = new Date().toISOString().split("T")[0]
  let markdown = `# Job Search Results - ${timestamp}\n\n`

  markdown += `## Candidate Profile\n`
  markdown += `- **Experience**: ${profile.experienceYears} years\n`
  markdown += `- **Seniority**: ${profile.seniorityLevel}\n`
  markdown += `- **Skills**: ${profile.skills.slice(0, 10).join(", ")}\n`
  markdown += `- **Tech Stack**: ${profile.techStack.slice(0, 8).join(", ")}\n\n`

  markdown += `---\n\n`
  markdown += `## Jobs Found (${jobs.length})\n\n`

  // Sort by fit score
  const sortedJobs = [...jobs].sort((a, b) => {
    const scoreA = analyses.find((an) => an.jobId === a.id)?.overallScore ?? 0
    const scoreB = analyses.find((an) => an.jobId === b.id)?.overallScore ?? 0
    return scoreB - scoreA
  })

  for (const job of sortedJobs) {
    const analysis = analyses.find((a) => a.jobId === job.id)
    const coverLetter = coverLetters[job.id]

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

  // Save to localStorage - both markdown (for download) and structured data (for UI)
  localStorage.setItem("scouter:resultsMarkdown", markdown)

  // Save structured data for rich UI rendering
  const structuredResults = {
    timestamp,
    profile: {
      experienceYears: profile.experienceYears,
      seniorityLevel: profile.seniorityLevel,
      skills: profile.skills.slice(0, 10),
      techStack: profile.techStack.slice(0, 8),
    },
    jobs: sortedJobs.map((job) => ({
      ...job,
      analysis: analyses.find((a) => a.jobId === job.id) || null,
      coverLetter: coverLetters[job.id] || null,
    })),
  }
  localStorage.setItem("scouter:resultsData", JSON.stringify(structuredResults))
  localStorage.setItem("scouter:resultsTimestamp", new Date().toISOString())
}
