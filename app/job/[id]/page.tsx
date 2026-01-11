"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Container } from "@/components/layout/container"
import { JobDetailView } from "@/components/job-detail/job-detail-view"
import { useSearch } from "@/lib/context/search-context"

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { session, addCoverLetter } = useSearch()

  const job = session.jobs.find((j) => j.id === resolvedParams.id)
  const analysis = session.analyses[resolvedParams.id]
  const coverLetter = session.coverLetters[resolvedParams.id]

  // Generate mock cover letter if not exists
  useEffect(() => {
    if (job && !coverLetter) {
      addCoverLetter({
        jobId: job.id,
        content: `Dear Hiring Manager at ${job.company},

I am writing to express my strong interest in the ${job.title} position. With my background in machine learning and AI, I am confident I would be an excellent fit for your team.

My experience includes working with ${job.techStack.slice(0, 3).join(", ")}, which aligns perfectly with your technical requirements. In my previous roles, I have successfully delivered ML solutions that improved system performance and user experience.

I am particularly drawn to ${job.company}'s innovative approach to AI technology. I would be excited to contribute my skills to your mission and continue growing in this dynamic field.

Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute to your team's success.

Best regards,
[Your Name]`,
        highlightedExperiences: [
          "6 years of ML engineering experience",
          "Led team of 4 engineers on production ML systems",
          "Published research on neural architecture search",
        ],
        customizations: [
          `Emphasized experience with ${job.techStack[0]}`,
          `Mentioned interest in ${job.company}'s AI mission`,
          "Highlighted relevant past projects",
        ],
      })
    }
  }, [job, coverLetter, addCoverLetter])

  // Redirect if job not found
  useEffect(() => {
    if (!job) {
      router.push("/search/results")
    }
  }, [job, router])

  if (!job) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Container className="py-12">
          <JobDetailView job={job} analysis={analysis} coverLetter={coverLetter} />
        </Container>
      </main>
      <Footer />
    </div>
  )
}
