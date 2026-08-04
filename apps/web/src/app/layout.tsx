import type { ReactNode } from "react";
import Link from "next/link";
import { Satellite } from "lucide-react";
import "./globals.css";

export const metadata = {
  title: "Mission Control",
  description: "Run a team of specialized Claude agents through the full SDLC.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-8 py-5">
            <Link href="/" className="flex items-center gap-2.5">
              <Satellite className="h-5 w-5 text-accent" strokeWidth={1.75} />
              <span className="font-mono text-sm uppercase tracking-widest text-ink">
                Mission Control
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className="rounded-full px-3.5 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
              >
                Home
              </Link>
              <Link
                href="/projects"
                className="rounded-full px-3.5 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
              >
                Projects
              </Link>
              <Link
                href="/office"
                className="rounded-full px-3.5 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
              >
                Office
              </Link>
            </nav>
            <span className="ml-auto rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wide text-accent">
              mock mode
            </span>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-8 py-10">{children}</div>
      </body>
    </html>
  );
}
