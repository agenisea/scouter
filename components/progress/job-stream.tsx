"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Building2, MapPin } from "lucide-react"
import type { JobOpportunity } from "@/lib/types"

interface JobStreamProps {
  jobs: JobOpportunity[]
}

export function JobStream({ jobs }: JobStreamProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No jobs discovered yet...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
      {jobs.map((job, index) => (
        <Card key={job.id} className="bg-card/50 border-border animate-in fade-in slide-in-from-bottom-2">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate mb-1">{job.title}</h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">{job.company}</span>
                  </div>
                  {job.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{job.location}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">just now</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
