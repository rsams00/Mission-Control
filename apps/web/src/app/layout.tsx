import type { ReactNode } from "react";

export const metadata = {
  title: "Mission Control",
  description: "Run a team of specialized Claude agents through the full SDLC.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
