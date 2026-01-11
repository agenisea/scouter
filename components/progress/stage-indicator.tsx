import { Check, Loader2 } from "lucide-react"
import { PIPELINE_STAGES } from "@/lib/utils/constants"
import type { PipelineStage } from "@/lib/types"

interface StageIndicatorProps {
  currentStage: PipelineStage
}

const stages: PipelineStage[] = ["parsing", "searching", "analyzing", "generating"]

export function StageIndicator({ currentStage }: StageIndicatorProps) {
  const currentIndex = stages.indexOf(currentStage)

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        const isComplete = index < currentIndex
        const isActive = stage === currentStage
        const isPending = index > currentIndex

        return (
          <div key={stage} className="flex items-center gap-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isComplete
                  ? "bg-primary text-primary-foreground"
                  : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {isComplete ? (
                <Check className="h-4 w-4" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${isComplete || isActive ? "text-foreground" : "text-muted-foreground"}`}
              >
                {PIPELINE_STAGES[stage]}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
