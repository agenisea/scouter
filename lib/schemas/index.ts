import { z } from "zod"

export const searchConfigSchema = z.object({
  targetRoles: z.array(z.string()).min(1, "At least one target role is required"),
  locations: z.array(z.string()),
  workPreferences: z.array(z.enum(["remote", "hybrid", "onsite"])),
  salaryRange: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
    })
    .nullable(),
  excludeCompanies: z.array(z.string()),
})

export const resumeUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "Resume must be less than 5MB")
    .refine(
      (file) => ["application/pdf", "text/markdown", "text/plain"].includes(file.type),
      "Resume must be PDF or Markdown",
    ),
})

export const coverLetterTemplateSchema = z.object({
  template: z.string().min(50, "Template must be at least 50 characters"),
})
