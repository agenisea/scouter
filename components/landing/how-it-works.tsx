import { Card, CardContent } from "@/components/ui/card"
import { Upload, Search, Sparkles, Download } from "lucide-react"

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Upload Resume",
    description: "Drop in your resume and cover letter template. We parse your skills and experience.",
  },
  {
    icon: Search,
    number: "02",
    title: "Search Jobs",
    description: "We search top job boards for AI roles and more matching your preferences.",
  },
  {
    icon: Sparkles,
    number: "03",
    title: "Get Scored Matches",
    description: "Each job gets a transparent fit score with evidence-based analysis.",
  },
  {
    icon: Download,
    number: "04",
    title: "Download & Apply",
    description: "Get custom cover letters for each role. Export everything as Markdown.",
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
          <p className="text-lg text-muted-foreground">Four simple steps to find your next role</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="relative">
                <Card className="bg-card border-border h-full">
                  <CardContent className="pt-6">
                    <div className="mb-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-4xl font-bold text-primary/20">{step.number}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 right-0 w-6 h-0.5 bg-border translate-x-full -translate-y-1/2" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
