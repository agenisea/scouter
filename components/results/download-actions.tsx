"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface DownloadActionsProps {
  selectedCount: number
  onDownloadAll: () => void
  onDownloadSelected: () => void
}

export function DownloadActions({ selectedCount, onDownloadAll, onDownloadSelected }: DownloadActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={onDownloadAll} className="gap-2 bg-transparent">
        <Download className="h-4 w-4" />
        Download All
      </Button>
      {selectedCount > 0 && (
        <Button onClick={onDownloadSelected} className="gap-2">
          <Download className="h-4 w-4" />
          Download Selected ({selectedCount})
        </Button>
      )}
    </div>
  )
}
