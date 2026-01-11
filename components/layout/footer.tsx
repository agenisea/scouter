import Link from 'next/link'
import Image from 'next/image'
import { GitHubIcon } from '@/components/ui/icons'

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto pb-safe">
      <div className="mx-auto max-w-6xl px-4 py-12 pb-16 sm:px-6 sm:pb-12 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-foreground hover:opacity-80 transition-opacity">
            <Image
              src="/icon.svg"
              alt="Scouter"
              width={24}
              height={24}
            />
            Scouter
          </Link>
          <p className="text-sm text-muted-foreground max-w-md">
            AI-powered job search assistant. Your resume stays on your device. We never store your personal data.
          </p>

        </div>

        {/* Bottom section */}
        <div className="mt-8 border-t border-border pt-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="text-sm text-muted-foreground">
              Released under the{' '}
              <a
                href="https://opensource.org/licenses/MIT"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                MIT License
              </a>
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a
                href="https://github.com/agenisea/scouter"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="GitHub"
              >
                <GitHubIcon className="h-5 w-5" />
              </a>
              <span>
                Built by{' '}
                <a
                  href="https://agenisea.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 hover:underline"
                >
                  Agenisea™
                </a>
              </span>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Patrick Peña / Agenisea™.
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> </span>
            All text and original written content is protected by copyright.
          </p>
        </div>
      </div>
    </footer>
  )
}
