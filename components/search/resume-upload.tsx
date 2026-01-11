"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ResumeUploadProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
}

export function ResumeUpload({ onFileSelect, selectedFile }: ResumeUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
    },
    [onFileSelect],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/markdown": [".md"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Upload Your Resume</h3>
        <p className="text-sm text-muted-foreground">Upload your resume so we can analyze your skills and experience</p>
      </div>

      {!selectedFile ? (
        <Card
          {...getRootProps()}
          className={`border-2 border-dashed cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className={`h-12 w-12 mb-4 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
            <input {...getInputProps()} />
            <p className="text-center text-sm mb-2">
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">PDF, Markdown, or TXT (max 5MB)</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onFileSelect(null as any)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Privacy Note:</strong> Your resume is processed locally and never stored
          on our servers. All data stays in your browser session.
        </p>
      </div>
    </div>
  )
}
