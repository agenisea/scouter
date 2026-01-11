export function formatTimeAgo(date: string | null): string {
  if (!date) return "Unknown"

  const now = new Date()
  const posted = new Date(date)
  const diffMs = now.getTime() - posted.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

export function getFitScoreColor(score: number): "emerald" | "amber" | "red" {
  if (score >= 80) return "emerald"
  if (score >= 60) return "amber"
  return "red"
}
