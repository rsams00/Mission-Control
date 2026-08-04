"use client";

import { useState } from "react";
import { Lightbulb, FileText, Compass, Hammer, FlaskConical, BookText, Sofa } from "lucide-react";
import { RoomShell } from "@/components/room-shell";
import { AgentMarkerVisual } from "@/components/agent-marker-visual";
import { AgentProfilePanel } from "@/components/agent-profile-panel";
import type { AgentRole } from "@mission-control/shared";

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

export interface OfficeAgentView {
  id: string;
  role: AgentRole;
  name: string;
  spriteUrl: string | null;
  projectName: string | null;
  stageStatus: string | null;
}

export interface OfficeRoomView {
  key: string;
  label: string;
  iconKey: RoomIconKey;
  active: boolean;
  deskCount: number;
  variant: "desks" | "lounge";
  occupants: OfficeAgentView[];
}

export function OfficeFloor({ rooms }: { rooms: OfficeRoomView[] }) {
  const [selected, setSelected] = useState<OfficeAgentView | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <RoomShell
            key={room.key}
            label={room.label}
            Icon={ROOM_ICON[room.iconKey]}
            active={room.active}
            deskCount={room.deskCount}
            variant={room.variant}
          >
            {room.occupants.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
                —
              </p>
            ) : (
              room.occupants.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className="flex flex-col items-center gap-1 rounded-lg p-1 transition-transform hover:scale-105"
                >
                  <AgentMarkerVisual role={o.role} spriteUrl={o.spriteUrl} size={48} />
                  <span className="max-w-[68px] truncate text-center text-[0.68rem]" style={{ color: "var(--color-ink)" }}>
                    {o.name}
                  </span>
                  {o.projectName && (
                    <span className="max-w-[68px] truncate text-center text-[0.6rem]" style={{ color: "var(--color-ink-muted)" }}>
                      {o.projectName}
                    </span>
                  )}
                </button>
              ))
            )}
          </RoomShell>
        ))}
      </div>

      {selected && (
        <AgentProfilePanel agentId={selected.id} spriteUrl={selected.spriteUrl} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
