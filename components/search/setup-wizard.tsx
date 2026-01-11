"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { WizardProgress } from "./wizard-progress"
import { WizardNavigation } from "./wizard-navigation"
import { ResumeUpload } from "./resume-upload"
import { TemplateInput } from "./template-input"
import { SearchConfigForm } from "./search-config"
import { useSearch } from "@/lib/context/search-context"
import type { SearchConfig } from "@/lib/types"

const TOTAL_STEPS = 3
const DEFAULT_CONFIG: SearchConfig = {
  targetRoles: [],
  locations: [],
  workPreferences: ["remote", "hybrid", "onsite"],
  salaryRange: null,
  excludeCompanies: [],
  radius: 10,
}

export function SetupWizard() {
  const router = useRouter()
  const {
    session,
    resumeFile: cachedResumeFile,
    isHydrated,
    setCoverLetterTemplate,
    setSearchConfig,
    setResumeFile: setContextResumeFile,
  } = useSearch()

  const [currentStep, setCurrentStep] = useState(1)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [template, setTemplate] = useState("")
  const [config, setConfig] = useState<SearchConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [usingDefaults, setUsingDefaults] = useState({ resume: false, template: false })
  const [usingCached, setUsingCached] = useState({ resume: false, template: false, config: false })

  // Load cached values from context, then check for default files
  useEffect(() => {
    if (!isHydrated) return

    async function initialize() {
      let hasResume = false
      let hasTemplate = false
      let skipToStep = 1

      // First, check for cached values from context
      if (cachedResumeFile) {
        setResumeFile(cachedResumeFile)
        setUsingCached(prev => ({ ...prev, resume: true }))
        hasResume = true
        skipToStep = 2
      }

      if (session.coverLetterTemplate) {
        setTemplate(session.coverLetterTemplate)
        setUsingCached(prev => ({ ...prev, template: true }))
        hasTemplate = true
        if (skipToStep === 2) skipToStep = 3
      }

      if (session.searchConfig) {
        setConfig(session.searchConfig)
        setUsingCached(prev => ({ ...prev, config: true }))
      }

      // Then, check for default files if no cached values
      try {
        const res = await fetch("/api/defaults")
        if (res.ok) {
          const data = await res.json()

          if (!hasResume && data.hasResume) {
            const resumeRes = await fetch("/api/defaults/resume")
            if (resumeRes.ok) {
              const blob = await resumeRes.blob()
              const file = new File([blob], "RESUME.pdf", { type: "application/pdf" })
              setResumeFile(file)
              setUsingDefaults(prev => ({ ...prev, resume: true }))
              hasResume = true
              skipToStep = 2
            }
          }

          if (!hasTemplate && data.hasTemplate && data.template) {
            setTemplate(data.template)
            setUsingDefaults(prev => ({ ...prev, template: true }))
            hasTemplate = true
            if (hasResume) skipToStep = 3
          }
        }
      } catch (error) {
        console.error("Failed to check defaults:", error)
      }

      setCurrentStep(skipToStep)
      setLoading(false)
    }

    initialize()
  }, [isHydrated, cachedResumeFile, session.coverLetterTemplate, session.searchConfig])

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return resumeFile !== null
      case 2:
        return template.length >= 50
      case 3:
        return config.targetRoles.length > 0
      default:
        return false
    }
  }

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    } else {
      // Save to context and navigate to progress
      await setContextResumeFile(resumeFile)
      setCoverLetterTemplate(template)
      setSearchConfig(config)
      router.push("/search/progress")
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Checking for default files...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasAnyCached = usingCached.resume || usingCached.template || usingCached.config
  const hasAnyDefaults = usingDefaults.resume || usingDefaults.template

  return (
    <div className="max-w-3xl mx-auto">
      {(hasAnyCached || hasAnyDefaults) && (
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm space-y-1">
          {hasAnyCached && (
            <div>
              <span className="font-medium">Restored from cache:</span>{" "}
              {usingCached.resume && <span className="text-primary">Resume</span>}
              {usingCached.resume && (usingCached.template || usingCached.config) && ", "}
              {usingCached.template && <span className="text-primary">Template</span>}
              {usingCached.template && usingCached.config && ", "}
              {usingCached.config && <span className="text-primary">Search Config</span>}
            </div>
          )}
          {hasAnyDefaults && (
            <div>
              <span className="font-medium">Using defaults:</span>{" "}
              {usingDefaults.resume && <span className="text-primary">RESUME.pdf</span>}
              {usingDefaults.resume && usingDefaults.template && ", "}
              {usingDefaults.template && <span className="text-primary">COVER_LETTER_TEMPLATE.md</span>}
            </div>
          )}
        </div>
      )}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <WizardProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 1 && <ResumeUpload onFileSelect={setResumeFile} selectedFile={resumeFile} />}

          {currentStep === 2 && <TemplateInput template={template} onTemplateChange={setTemplate} />}

          {currentStep === 3 && <SearchConfigForm config={config} onConfigChange={setConfig} />}

          <WizardNavigation
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            onBack={handleBack}
            onNext={handleNext}
            canGoNext={canGoNext()}
            isLastStep={currentStep === TOTAL_STEPS}
          />
        </CardContent>
      </Card>
    </div>
  )
}
