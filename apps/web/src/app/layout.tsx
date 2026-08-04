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
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-4">
            <Link href="/projects" className="flex items-center gap-2">
              <Satellite className="h-5 w-5 text-accent" strokeWidth={1.75} />
              <span className="font-mono text-sm uppercase tracking-widest text-ink">
                Mission Control
              </span>
            </Link>
            <span className="ml-2 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wide text-accent">
              mock mode
            </span>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </body>
    </html>
  );
}
