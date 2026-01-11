import Link from "next/link"
import Image from "next/image"

export function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/icon.svg" alt="Scouter" width={24} height={24} />
          <span className="text-xl font-bold">Scouter</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Search
          </Link>
        </nav>
      </div>
    </header>
  )
}
