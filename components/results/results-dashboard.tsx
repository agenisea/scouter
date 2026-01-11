"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Filters } from "./filters"
import { SortSelect } from "./sort-select"
import { DownloadActions } from "./download-actions"
import { JobList } from "./job-list"
import { useSearch } from "@/lib/context/search-context"

export function ResultsDashboard() {
  const { session } = useSearch()
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [scoreFilter, setScoreFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [remoteFilter, setRemoteFilter] = useState("all")
  const [sortBy, setSortBy] = useState("score-desc")

  // Get unique locations
  const availableLocations = useMemo(() => {
    const locations = new Set<string>()
    session.jobs.forEach((job) => {
      if (job.location) locations.add(job.location)
    })
    return Array.from(locations).sort()
  }, [session.jobs])

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    let filtered = session.jobs

    // Apply score filter
    if (scoreFilter !== "all") {
      filtered = filtered.filter((job) => {
        const analysis = session.analyses[job.id]
        if (!analysis) return false

        const score = analysis.overallScore
        if (scoreFilter === "high") return score >= 80
        if (scoreFilter === "medium") return score >= 60 && score < 80
        if (scoreFilter === "low") return score < 60
        return true
      })
    }

    // Apply location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter((job) => job.location === locationFilter)
    }

    // Apply remote filter
    if (remoteFilter !== "all") {
      filtered = filtered.filter((job) => job.remoteStatus === remoteFilter)
    }

    // Sort
    const sorted = [...filtered]
    switch (sortBy) {
      case "score-desc":
        sorted.sort((a, b) => {
          const scoreA = session.analyses[a.id]?.overallScore ?? 0
          const scoreB = session.analyses[b.id]?.overallScore ?? 0
          return scoreB - scoreA
        })
        break
      case "score-asc":
        sorted.sort((a, b) => {
          const scoreA = session.analyses[a.id]?.overallScore ?? 0
          const scoreB = session.analyses[b.id]?.overallScore ?? 0
          return scoreA - scoreB
        })
        break
      case "date-desc":
        sorted.sort((a, b) => {
          const dateA = a.postedDate ? new Date(a.postedDate).getTime() : 0
          const dateB = b.postedDate ? new Date(b.postedDate).getTime() : 0
          return dateB - dateA
        })
        break
      case "company-asc":
        sorted.sort((a, b) => a.company.localeCompare(b.company))
        break
    }

    return sorted
  }, [session.jobs, session.analyses, scoreFilter, locationFilter, remoteFilter, sortBy])

  const highFitCount = useMemo(() => {
    return session.jobs.filter((job) => {
      const analysis = session.analyses[job.id]
      return analysis && analysis.overallScore >= 80
    }).length
  }, [session.jobs, session.analyses])

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs((prev) => {
      const next = new Set(prev)
      if (next.has(jobId)) {
        next.delete(jobId)
      } else {
        next.add(jobId)
      }
      return next
    })
  }

  const handleDownloadAll = () => {
    console.log("[v0] Download all jobs")
    // TODO: Implement download functionality
  }

  const handleDownloadSelected = () => {
    console.log("[v0] Download selected jobs:", Array.from(selectedJobs))
    // TODO: Implement download functionality
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-2xl">
            Search Complete: {session.jobs.length} jobs found, {highFitCount} high-fit matches
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <Filters
              scoreFilter={scoreFilter}
              locationFilter={locationFilter}
              remoteFilter={remoteFilter}
              onScoreChange={setScoreFilter}
              onLocationChange={setLocationFilter}
              onRemoteChange={setRemoteFilter}
              availableLocations={availableLocations}
            />
            <SortSelect value={sortBy} onChange={setSortBy} />
          </div>

          <DownloadActions
            selectedCount={selectedJobs.size}
            onDownloadAll={handleDownloadAll}
            onDownloadSelected={handleDownloadSelected}
          />
        </CardContent>
      </Card>

      <JobList
        jobs={filteredAndSortedJobs}
        analyses={session.analyses}
        selectedJobs={selectedJobs}
        onToggleSelect={toggleJobSelection}
      />
    </div>
  )
}
