import { Badge } from "@/components/ui/badge"
import type { JobOpportunity } from "@/lib/types"

interface SourceBadgeProps {
  source: JobOpportunity["source"]
}

export function SourceBadge({ source }: SourceBadgeProps) {
  const labels: Record<JobOpportunity["source"], string> = {
    linkedin: "LinkedIn",
    indeed: "Indeed",
    wellfound: "Wellfound",
    company_site: "Company Site",
    ziprecruiter: "ZipRecruiter",
    glassdoor: "Glassdoor",
    monster: "Monster",
  }

  return (
    <Badge variant="secondary" className="text-xs">
      {labels[source]}
    </Badge>
  )
}
