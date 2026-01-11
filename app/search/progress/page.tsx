import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Container } from "@/components/layout/container"
import { SearchProgress } from "@/components/progress/search-progress"

export default function ProgressPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Container className="py-12">
          <SearchProgress />
        </Container>
      </main>
      <Footer />
    </div>
  )
}
