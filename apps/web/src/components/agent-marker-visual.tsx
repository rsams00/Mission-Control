import { AGENT_IDENTITY } from "@/lib/agent-identity";
import type { AgentRole } from "@mission-control/shared";

/**
 * Client-safe twin of AgentSprite's rendering logic — takes a precomputed
 * `spriteUrl` (resolved server-side via spriteUrlFor, since AgentSprite
 * itself touches `fs` and can't be imported into a Client Component tree)
 * instead of checking the filesystem itself.
 */
export function AgentMarkerVisual({
  role,
  spriteUrl,
  size = 48,
}: {
  role: AgentRole;
  spriteUrl: string | null;
  size?: number;
}) {
  const identity = AGENT_IDENTITY[role];

  if (!spriteUrl) {
    return (
      <span
        className="flex items-center justify-center rounded-md"
        style={{
          width: size,
          height: size,
          backgroundColor: `color-mix(in srgb, var(${identity.color}) 22%, transparent)`,
          border: `1px solid var(${identity.color})`,
        }}
      >
        <identity.Icon style={{ width: size * 0.5, height: size * 0.5, color: `var(${identity.color})` }} strokeWidth={1.75} />
      </span>
    );
  }

  return (
    <img
      src={spriteUrl}
      alt={identity.label}
      width={size}
      height={size}
      style={{ imageRendering: "pixelated", width: size, height: size, objectFit: "contain" }}
    />
  );
}
