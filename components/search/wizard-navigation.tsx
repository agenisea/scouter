"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface WizardNavigationProps {
  currentStep: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
  canGoNext: boolean
  isLastStep: boolean
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  canGoNext,
  isLastStep,
}: WizardNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-border">
      <Button variant="outline" onClick={onBack} disabled={currentStep === 1} className="gap-2 bg-transparent">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="text-sm text-muted-foreground">
        Step {currentStep} of {totalSteps}
      </div>

      <Button onClick={onNext} disabled={!canGoNext} className="gap-2">
        {isLastStep ? "Start Search" : "Next"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
