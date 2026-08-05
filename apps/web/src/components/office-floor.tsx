"use client";

import { useState } from "react";
import { Lightbulb, FileText, Compass, Hammer, FlaskConical, BookText, Sofa } from "lucide-react";
import { RoomShell } from "@/components/room-shell";
import { OfficeAgentCard, type OfficeCardData } from "@/components/office-agent-card";
import { AgentProfilePanel } from "@/components/agent-profile-panel";

// Icon components aren't serializable across the Server -> Client boundary,
// so the page passes a key string and this map resolves it client-side.
export const ROOM_ICON = {
  idea: Lightbulb,
  spec: FileText,
  architecture: Compass,
  build: Hammer,
  test: FlaskConical,
  docs: BookText,
  lounge: Sofa,
} as const;
export type RoomIconKey = keyof typeof ROOM_ICON;

export interface OfficeRoomView {
  key: string;
  label: string;
  iconKey: RoomIconKey;
  active: boolean;
  variant: "desks" | "lounge";
  occupants: OfficeCardData[];
}

export function OfficeFloor({ rooms }: { rooms: OfficeRoomView[] }) {
  const [selected, setSelected] = useState<OfficeCardData | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          // Lounge can hold far more occupants than any stage room (every
          // idle role at once, up to 8+) — give it the full grid width so
          // it has room to wrap without needing an unusually tall card.
          <div key={room.key} className={room.variant === "lounge" ? "sm:col-span-2 lg:col-span-3" : undefined}>
            <RoomShell label={room.label} Icon={ROOM_ICON[room.iconKey]} active={room.active}>
              {room.occupants.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
                  —
                </p>
              ) : (
                <div className="relative flex w-full flex-wrap items-start gap-3">
                  {/* Collaboration cue: a thin glowing connector between two
                      agents sharing a room right now — reads as "working
                      together," not just "coincidentally in the same room." */}
                  {room.occupants.length === 2 && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute left-[104px] top-7 h-px w-3"
                      style={{
                        background: "linear-gradient(90deg, var(--viz-2), var(--viz-3))",
                        boxShadow: "0 0 6px color-mix(in srgb, var(--viz-3) 60%, transparent)",
                      }}
                    />
                  )}
                  {room.occupants.map((o) => (
                    <OfficeAgentCard
                      key={o.id}
                      data={o}
                      onSelect={setSelected}
                      variant={room.variant === "lounge" ? "couch" : "desk"}
                    />
                  ))}
                </div>
              )}
            </RoomShell>
          </div>
        ))}
      </div>

      {selected && (
        <AgentProfilePanel agentId={selected.id} spriteUrl={selected.spriteUrl} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
