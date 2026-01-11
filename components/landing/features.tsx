import { Card, CardContent } from "@/components/ui/card"
import { Brain, Target, FileText, Shield } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "Resume Analysis",
    description: "Extract your skills and experience automatically with AI-powered parsing",
  },
  {
    icon: Target,
    title: "Smart Matching",
    description: "Score jobs against your background with transparent, evidence-based ratings",
  },
  {
    icon: FileText,
    title: "Cover Letters",
    description: "Customized drafts for each role that highlight your relevant experience",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your resume stays on your device. We never store your personal data.",
  },
]

export function Features() {
  return (
    <section className="py-20 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Job search that works for you</h2>
          <p className="text-lg text-muted-foreground">Powerful AI tools to help you find the perfect role</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="mb-4 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
