import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Container } from "@/components/layout/container"
import { SetupWizard } from "@/components/search/setup-wizard"

export default function SearchPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Container className="py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Start Your Job Search</h1>
            <p className="text-muted-foreground">Complete these steps to find AI roles and more that match your background</p>
          </div>
          <SetupWizard />
        </Container>
      </main>
      <Footer />
    </div>
  )
}
