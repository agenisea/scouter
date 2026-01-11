"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FiltersProps {
  scoreFilter: string
  locationFilter: string
  remoteFilter: string
  onScoreChange: (value: string) => void
  onLocationChange: (value: string) => void
  onRemoteChange: (value: string) => void
  availableLocations: string[]
}

export function Filters({
  scoreFilter,
  locationFilter,
  remoteFilter,
  onScoreChange,
  onLocationChange,
  onRemoteChange,
  availableLocations,
}: FiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={scoreFilter} onValueChange={onScoreChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Scores" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Scores</SelectItem>
          <SelectItem value="high">High Fit (80+)</SelectItem>
          <SelectItem value="medium">Medium Fit (60-79)</SelectItem>
          <SelectItem value="low">Low Fit (&lt;60)</SelectItem>
        </SelectContent>
      </Select>

      <Select value={locationFilter} onValueChange={onLocationChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Locations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          {availableLocations.map((location) => (
            <SelectItem key={location} value={location}>
              {location}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={remoteFilter} onValueChange={onRemoteChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="remote">Remote</SelectItem>
          <SelectItem value="hybrid">Hybrid</SelectItem>
          <SelectItem value="onsite">On-site</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
