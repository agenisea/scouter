"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileText, Copy, Check } from "lucide-react"
import type { CoverLetterDraft } from "@/lib/types"

interface CoverLetterEditorProps {
  coverLetter: CoverLetterDraft
}

export function CoverLetterEditor({ coverLetter }: CoverLetterEditorProps) {
  const [content, setContent] = useState(coverLetter.content)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Cover Letter Draft
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 bg-transparent">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[400px] font-sans text-sm leading-relaxed"
          placeholder="Your cover letter will appear here..."
        />

        {coverLetter.highlightedExperiences.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="text-sm font-medium mb-2">Highlighted Experiences</h4>
            <ul className="space-y-1">
              {coverLetter.highlightedExperiences.map((exp, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {exp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {coverLetter.customizations.length > 0 && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <h4 className="text-sm font-medium mb-2 text-primary">AI Customizations</h4>
            <ul className="space-y-1">
              {coverLetter.customizations.map((custom, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {custom}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
