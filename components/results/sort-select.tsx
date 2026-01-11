"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown } from "lucide-react"

interface SortSelectProps {
  value: string
  onChange: (value: string) => void
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="score-desc">Fit Score (High to Low)</SelectItem>
          <SelectItem value="score-asc">Fit Score (Low to High)</SelectItem>
          <SelectItem value="date-desc">Most Recent</SelectItem>
          <SelectItem value="company-asc">Company (A-Z)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
