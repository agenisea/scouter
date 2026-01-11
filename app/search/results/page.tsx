"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Container } from "@/components/layout/container"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useSearch } from "@/lib/context/search-context"
import { Download, Copy, Check, ChevronDown, ExternalLink } from "lucide-react"
import ReactMarkdown from "react-markdown"
import type { JobOpportunity, FitAnalysis, CoverLetterDraft } from "@/lib/types"

interface JobWithDetails extends JobOpportunity {
  analysis: FitAnalysis | null
  coverLetter: CoverLetterDraft | null
}

interface StructuredResults {
  timestamp: string
  profile: {
    experienceYears: number
    seniorityLevel: string
    skills: string[]
    techStack: string[]
  }
  jobs: JobWithDetails[]
}

export default function ResultsPage() {
  const router = useRouter()
  const { session } = useSearch()
  const [markdown, setMarkdown] = useState<string>("")
  const [results, setResults] = useState<StructuredResults | null>(null)
  const [copied, setCopied] = useState(false)
  const [checked, setChecked] = useState(false)
  const [openCoverLetters, setOpenCoverLetters] = useState<Set<string>>(new Set())

  useEffect(() => {
    const storedMarkdown = localStorage.getItem("scouter:resultsMarkdown")
    const storedData = localStorage.getItem("scouter:resultsData")

    if (storedMarkdown) setMarkdown(storedMarkdown)
    if (storedData) {
      try {
        setResults(JSON.parse(storedData))
      } catch {
        console.warn("Failed to parse structured results")
      }
    }
    setChecked(true)
  }, [])

  useEffect(() => {
    if (!checked) return
    if (!markdown && !results && session.jobs.length === 0 && session.status !== "completed") {
      router.push("/search")
    }
  }, [checked, markdown, results, session.jobs.length, session.status, router])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `job-search-results-${new Date().toISOString().split("T")[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleCoverLetter = (jobId: string) => {
    setOpenCoverLetters((prev) => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }

  if (!checked || (!markdown && !results)) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading results...</p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Container className="py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              Search Results
              {results && <span className="text-muted-foreground font-normal text-base ml-2">({results.jobs.length} jobs)</span>}
            </h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={() => router.push("/search")}>
                New Search
              </Button>
            </div>
          </div>

          {/* Structured Results */}
          {results ? (
            <div className="space-y-3">
              {results.jobs.map((job) => (
                <div key={job.id} className="border border-border rounded-lg p-4 bg-card">
                  {/* Job Header Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        <h2 className="font-semibold text-lg truncate">{job.title}</h2>
                      </a>
                      <p className="text-muted-foreground text-sm">{job.company} • {job.location}</p>
                    </div>
                    {job.analysis && (
                      <div className="flex-shrink-0 text-right">
                        <span className={`text-xl font-bold ${job.analysis.overallScore >= 80 ? "text-green-500" : job.analysis.overallScore >= 70 ? "text-yellow-500" : "text-muted-foreground"}`}>
                          {job.analysis.overallScore}
                        </span>
                        <span className="text-muted-foreground text-sm">/100</span>
                      </div>
                    )}
                  </div>

                  {/* Meta Row */}
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="px-2 py-0.5 bg-secondary rounded text-xs">{job.remoteStatus}</span>
                    {job.salaryRange && <span>{job.salaryRange}</span>}
                    <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 ml-auto">
                      Apply <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* Analysis */}
                  {job.analysis && (
                    <p className="mt-3 text-sm text-muted-foreground">{job.analysis.summary}</p>
                  )}

                  {/* Cover Letter */}
                  {job.coverLetter && (
                    <Collapsible open={openCoverLetters.has(job.id)} onOpenChange={() => toggleCoverLetter(job.id)} className="mt-3">
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <ChevronDown className={`h-4 w-4 transition-transform ${openCoverLetters.has(job.id) ? "rotate-180" : ""}`} />
                        {openCoverLetters.has(job.id) ? "Hide" : "View"} Cover Letter
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 p-3 bg-secondary/30 rounded text-sm whitespace-pre-wrap">
                          {job.coverLetter.content}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7 text-xs"
                          onClick={() => navigator.clipboard.writeText(job.coverLetter!.content)}
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy Letter
                        </Button>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Markdown Fallback */
            <Card>
              <CardContent className="pt-6 prose">
                <ReactMarkdown>{markdown}</ReactMarkdown>
              </CardContent>
            </Card>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  )
}
