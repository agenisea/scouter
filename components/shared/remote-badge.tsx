import { Badge } from "@/components/ui/badge"
import type { JobOpportunity } from "@/lib/types"

interface RemoteBadgeProps {
  status: JobOpportunity["remoteStatus"]
}

export function RemoteBadge({ status }: RemoteBadgeProps) {
  const config = {
    remote: { label: "Remote", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    hybrid: { label: "Hybrid", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    onsite: { label: "On-site", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    unknown: { label: "Unknown", className: "bg-muted text-muted-foreground border-border" },
  }

  const { label, className } = config[status]

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}
