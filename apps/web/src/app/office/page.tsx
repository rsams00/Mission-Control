import { STAGE_TYPES, type StageType } from "@mission-control/shared";
import { getGlobalOfficeState, getPortfolioActivity } from "@/lib/data";
import { spriteUrlFor } from "@/components/agent-sprite";
import { OfficeFloor, type OfficeRoomView, type RoomIconKey } from "@/components/office-floor";
import { OFFICE_THEME } from "@/lib/office-theme";

const ROOM_META: Record<StageType, { label: string; iconKey: RoomIconKey }> = {
  idea: { label: "Briefing Room — Idea", iconKey: "idea" },
  spec: { label: "Briefing Room — Spec", iconKey: "spec" },
  architecture: { label: "Command Center — Architecture", iconKey: "architecture" },
  build: { label: "Workspace — Build", iconKey: "build" },
  test: { label: "Workspace — Test", iconKey: "test" },
  docs: { label: "Studio — Docs", iconKey: "docs" },
};

export default async function GlobalOfficePage() {
  const [officeState, activity] = await Promise.all([getGlobalOfficeState(), getPortfolioActivity(15)]);

  const rooms: OfficeRoomView[] = STAGE_TYPES.map((type) => {
    const meta = ROOM_META[type];
    const occupants = officeState
      .filter((row) => row.assignment?.stageType === type)
      .map((row) => ({
        id: row.agent.id,
        role: row.agent.role,
        name: row.agent.name,
        spriteUrl: spriteUrlFor(row.agent.role),
        projectName: row.assignment!.projectName,
        presence: row.assignment!.presence,
      }));

    return {
      key: type,
      label: meta.label,
      iconKey: meta.iconKey,
      active: occupants.length > 0,
      variant: "desks" as const,
      occupants,
    };
  });

  const lounge = officeState
    .filter((row) => row.assignment === null)
    .map((row) => ({
      id: row.agent.id,
      role: row.agent.role,
      name: row.agent.name,
      spriteUrl: spriteUrlFor(row.agent.role),
      projectName: null,
      presence: "idle" as const,
    }));

  rooms.push({
    key: "lounge",
    label: "Lounge — idle",
    iconKey: "lounge",
    active: false,
    variant: "lounge",
    occupants: lounge,
  });

  return (
    <div
      className="office-shell flex flex-col gap-6 rounded-2xl border p-6"
      style={{ ...OFFICE_THEME, borderColor: "var(--color-border)", background: "var(--color-bg)", color: "var(--color-ink)" }}
    >
      <div>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--color-ink-muted)" }}>
          Agent Office
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Everyone, everywhere they're working</h1>
        <p className="mt-1 max-w-2xl text-sm" style={{ color: "var(--color-ink-muted)" }}>
          Every agent, across every project — idle agents sit in the Lounge, working agents show up in the room
          matching what they're doing right now.
        </p>
      </div>

      <OfficeFloor rooms={rooms} />

      <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <p className="mb-3 font-mono text-[0.68rem] uppercase tracking-widest" style={{ color: "var(--color-ink-muted)" }}>
          Activity log — all projects
        </p>
        {activity.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
            No sessions have run yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5 font-mono text-xs">
            {activity.map(({ session, stage, project, agent }) => (
              <li key={session.id} style={{ color: "var(--color-ink-muted)" }}>
                <span style={{ color: "var(--color-ink)" }}>{agent.name}</span> ran the{" "}
                <span style={{ color: "var(--color-accent)" }}>{stage.type}</span> stage on{" "}
                <span style={{ color: "var(--color-ink)" }}>{project.name}</span> — {session.status}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
