import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Check, X, AlertCircle, Sparkles } from "lucide-react"
import type { FitAnalysis } from "@/lib/types"

interface FitAnalysisProps {
  analysis: FitAnalysis
}

export function FitAnalysisSection({ analysis }: FitAnalysisProps) {
  const matchSections = [
    { title: "Skills Match", data: analysis.skillsMatch, icon: Sparkles },
    { title: "Experience Match", data: analysis.experienceMatch, icon: Check },
    { title: "Tech Stack Match", data: analysis.techStackMatch, icon: Check },
    { title: "Seniority Fit", data: analysis.seniorityFit, icon: Check },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          Fit Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {matchSections.map((section) => {
            const Icon = section.icon
            return (
              <div key={section.title} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{section.title}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{section.data.score}%</span>
                </div>
                <Progress value={section.data.score} className="h-2" />

                {section.data.matched.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {section.data.matched.map((item) => (
                      <Badge key={item} variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        <Check className="h-3 w-3 mr-1" />
                        {item}
                      </Badge>
                    ))}
                  </div>
                )}

                {section.data.missing.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {section.data.missing.map((item) => (
                      <Badge key={item} variant="outline" className="bg-muted text-muted-foreground">
                        <X className="h-3 w-3 mr-1" />
                        {item}
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-sm text-muted-foreground mt-2">{section.data.rationale}</p>
              </div>
            )
          })}
        </div>

        <div className="pt-4 border-t border-border space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Summary</h4>
            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
          </div>

          {analysis.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-primary">Your Strengths</h4>
              <ul className="space-y-1">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.concerns.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-amber-500">Potential Concerns</h4>
              <ul className="space-y-1">
                {analysis.concerns.map((concern, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
