import { Badge } from "@/components/ui/badge"
import { getFitScoreColor } from "@/lib/utils/format"

interface FitScoreBadgeProps {
  score: number
  showLabel?: boolean
}

export function FitScoreBadge({ score, showLabel = false }: FitScoreBadgeProps) {
  const color = getFitScoreColor(score)

  const colorClasses = {
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    red: "bg-red-500/10 text-red-500 border-red-500/20",
  }

  return (
    <Badge variant="outline" className={colorClasses[color]}>
      {score}%{showLabel && ` ${color === "emerald" ? "High" : color === "amber" ? "Medium" : "Low"} Fit`}
    </Badge>
  )
}
