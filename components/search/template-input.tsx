"use client"

import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { COVER_LETTER_PLACEHOLDERS } from "@/lib/utils/constants"

interface TemplateInputProps {
  template: string
  onTemplateChange: (template: string) => void
}

export function TemplateInput({ template, onTemplateChange }: TemplateInputProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Cover Letter Template</h3>
        <p className="text-sm text-muted-foreground">
          Paste your cover letter template below. Use placeholders that we'll customize for each job.
        </p>
      </div>

      <Textarea
        value={template}
        onChange={(e) => onTemplateChange(e.target.value)}
        placeholder="Dear Hiring Manager,

{{OPENING_HOOK}}

{{EXPERIENCE_HIGHLIGHT_1}}

{{SKILLS_BRIDGE}}

{{CLOSING}}

Best regards,
{{CANDIDATE_NAME}}"
        className="min-h-[300px] font-mono text-sm"
      />

      <div className="rounded-lg bg-muted/50 p-4 space-y-3">
        <p className="text-sm font-medium">Available Placeholders:</p>
        <div className="flex flex-wrap gap-2">
          {COVER_LETTER_PLACEHOLDERS.map((placeholder) => (
            <Badge key={placeholder} variant="secondary" className="font-mono text-xs">
              {`{{${placeholder}}}`}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          We'll replace these with customized content for each job based on your resume and the job description.
        </p>
      </div>
    </div>
  )
}
