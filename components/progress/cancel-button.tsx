"use client"

import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"

interface CancelButtonProps {
  onCancel: () => void
  disabled?: boolean
}

export function CancelButton({ onCancel, disabled }: CancelButtonProps) {
  return (
    <Button variant="outline" onClick={onCancel} disabled={disabled} className="gap-2 bg-transparent">
      <XCircle className="h-4 w-4" />
      Cancel Search
    </Button>
  )
}
