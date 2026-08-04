import { notFound } from "next/navigation";
import { STAGE_TYPES, type StageType } from "@mission-control/shared";
import { STAGE_ROLES } from "@mission-control/orchestrator";
import { getProject, getProjectRoster, getActiveStage, getRecentActivity } from "@/lib/data";
import { OfficeRoom } from "@/components/office-room";

const ROOM_LABEL: Record<StageType, string> = {
  idea: "Briefing Room — Idea",
  spec: "Briefing Room — Spec",
  architecture: "Command Center — Architecture",
  build: "Workspace — Build",
  test: "Workspace — Test",
  docs: "Briefing Room — Docs",
};

// Tier B is a deliberately distinct palette from Tier A's navy/cyan
// dashboard — scoped to this page only via CSS custom property overrides,
// so nothing outside .office-shell is affected.
const officeTheme: Record<string, string> = {
  "--color-bg": "#1a1024",
  "--color-surface": "#241833",
  "--color-surface-raised": "#2f1f42",
  "--color-ink": "#f3ead9",
  "--color-ink-muted": "#b9a7c9",
  "--color-border": "#3a2650",
  "--color-accent": "#e8a33d",
  "--color-accent-ink": "#241304",
};

export default async function OfficePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [roster, activeStage, activity] = await Promise.all([
    getProjectRoster(id),
    getActiveStage(id),
    getRecentActivity(id),
  ]);

  const coreTeam = roster.filter((r) => r.projectAgent.active).map((r) => r.agent);
  const activeRoles = activeStage ? new Set(STAGE_ROLES[activeStage.type]) : new Set<string>();

  const lounge = coreTeam.filter((a) => !activeRoles.has(a.role));

  return (
    <div
      className="office-shell flex flex-col gap-6 rounded-2xl border p-6"
      style={{ ...officeTheme, borderColor: "var(--color-border)", background: "var(--color-bg)", color: "var(--color-ink)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--color-ink-muted)" }}>
            Agent Office
          </p>
          <h2 className="mt-1 text-lg font-semibold">{project.name}</h2>
        </div>
        <span
          className="rounded-full border px-3 py-1 font-mono text-[0.68rem] uppercase tracking-wide"
          style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}
        >
          {activeStage ? `${activeStage.type} in session` : "idle"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAGE_TYPES.map((type) => (
          <OfficeRoom
            key={type}
            label={ROOM_LABEL[type]}
            active={activeStage?.type === type}
            occupants={
              activeStage?.type === type
                ? coreTeam.filter((a) => activeRoles.has(a.role))
                : []
            }
          />
        ))}
        <OfficeRoom label="Lounge — idle" active={false} occupants={lounge} />
      </div>

      <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <p className="mb-3 font-mono text-[0.68rem] uppercase tracking-widest" style={{ color: "var(--color-ink-muted)" }}>
          Activity log
        </p>
        {activity.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
            No sessions have run yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5 font-mono text-xs">
            {activity.map(({ session, stage, agent }) => (
              <li key={session.id} style={{ color: "var(--color-ink-muted)" }}>
                <span style={{ color: "var(--color-ink)" }}>{agent.name}</span> ran the{" "}
                <span style={{ color: "var(--color-accent)" }}>{stage.type}</span> stage —{" "}
                {session.status}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
