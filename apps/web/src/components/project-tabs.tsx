"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Gamepad2 } from "lucide-react";

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/projects/${projectId}`, label: "Overview", icon: LayoutDashboard, exact: true },
    { href: `/projects/${projectId}/roster`, label: "Roster", icon: Users, exact: false },
    { href: `/projects/${projectId}/office`, label: "Office", icon: Gamepad2, exact: false },
  ];

  return (
    <nav className="flex items-center gap-1 border-b border-border">
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors",
              active
                ? "border-accent text-ink"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            <tab.icon className="h-4 w-4" strokeWidth={1.75} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
