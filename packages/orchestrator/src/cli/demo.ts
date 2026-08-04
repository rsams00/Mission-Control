// Phase 1 demo: walks one project through the entire pipeline in mock mode
// (zero API cost) to prove the state machine and approval gates actually
// work — including a rejection/re-queue — before any UI exists.
import { eq } from "drizzle-orm";
import { db, deliverable } from "@mission-control/db";
import { seedRoster } from "../roster";
import { createProject, approveStage, rejectStage, getProjectStages } from "../state-machine";
import { isMockMode } from "../session-runner";

async function latestStage(projectId: string) {
  const stages = await getProjectStages(projectId);
  const row = stages[0];
  if (!row) throw new Error("project has no stages");
  return row;
}

async function latestDeliverable(stageId: string) {
  const rows = await db.select().from(deliverable).where(eq(deliverable.stageId, stageId));
  const row = rows[rows.length - 1];
  if (!row) throw new Error(`stage ${stageId} has no deliverable yet`);
  return row;
}

async function main() {
  if (!isMockMode()) {
    throw new Error("refusing to run the demo outside mock mode — this script must never spend real API credit");
  }

  console.log("[demo] mock mode confirmed — no API calls will be made\n");

  await seedRoster();
  console.log("[demo] roster seeded\n");

  const proj = await createProject({
    name: "Demo: Todo List",
    oneLineIdea: "A single-page todo list app",
  });
  console.log(`[demo] project created: ${proj.id} (${proj.name})`);

  let current = await latestStage(proj.id);
  console.log(`[demo] stage '${current.type}' auto-started, status=${current.status}\n`);

  // Demonstrate the rejection/re-queue flow once, on the first stage.
  console.log("[demo] rejecting the Idea/Spec deliverable to prove the revision loop...");
  await rejectStage(current.id, "Mock feedback: needs a P1 requirement around offline support.");
  current = await latestStage(proj.id);
  console.log(`[demo] stage '${current.type}' re-queued, status=${current.status}\n`);

  // Walk the rest of the pipeline to Shipped via approvals.
  let shipped = false;
  let guard = 0;
  while (!shipped) {
    guard += 1;
    if (guard > 10) throw new Error("demo guard tripped — possible infinite loop");

    const del = await latestDeliverable(current.id);
    const result = await approveStage(current.id, del.id);
    console.log(`[demo] approved '${current.type}'`);

    if (result.shipped) {
      shipped = true;
      console.log("\n[demo] project reached Shipped — pipeline verified end to end in mock mode, $0 spent.");
      break;
    }

    current = await latestStage(proj.id);
    console.log(`[demo] stage '${current.type}' started, status=${current.status}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("[demo] failed:", err);
  process.exit(1);
});
