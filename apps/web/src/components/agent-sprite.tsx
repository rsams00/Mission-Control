import fs from "node:fs";
import path from "node:path";
import type { AgentRole } from "@mission-control/shared";
import { AGENT_IDENTITY } from "@/lib/agent-identity";
import { cn } from "@/lib/utils";

/**
 * Server-rendered: checks the filesystem directly rather than reacting to a
 * client-side <img onError>, which races against hydration in a Server
 * Component tree (the browser starts — and fails — the request before
 * React attaches the error listener). A plain fs.existsSync check avoids
 * that entirely and re-evaluates on every request, so dropping a PNG into
 * apps/web/public/sprites (see the README there) shows up on next reload,
 * no code changes or client JS needed.
 */
function spriteExists(role: AgentRole): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", "sprites", `${role}.png`));
  } catch {
    return false;
  }
}

/**
 * Server-only lookup returning a plain URL string (or null) instead of
 * JSX — for pages that need to pass sprite availability into a Client
 * Component tree (e.g. the global Office view's marker list), where
 * AgentSprite itself can't be rendered because it touches `fs`.
 */
export function spriteUrlFor(role: AgentRole): string | null {
  return spriteExists(role) ? `/sprites/${role}.png` : null;
}

export function AgentSprite({
  role,
  size = 56,
  className,
}: {
  role: AgentRole;
  size?: number;
  className?: string;
}) {
  const identity = AGENT_IDENTITY[role];

  if (!spriteExists(role)) {
    return (
      <span
        className={cn("flex items-center justify-center rounded-md", className)}
        style={{
          width: size,
          height: size,
          backgroundColor: `color-mix(in srgb, var(${identity.color}) 22%, transparent)`,
          border: `1px solid var(${identity.color})`,
        }}
      >
        <identity.Icon
          style={{ width: size * 0.5, height: size * 0.5, color: `var(${identity.color})` }}
          strokeWidth={1.75}
        />
      </span>
    );
  }

  return (
    // Plain <img>, not next/image: pixel art at a fixed small size doesn't
    // need Next's image optimization pipeline.
    <img
      src={`/sprites/${role}.png`}
      alt={identity.label}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: "pixelated", width: size, height: size, objectFit: "contain" }}
    />
  );
}
