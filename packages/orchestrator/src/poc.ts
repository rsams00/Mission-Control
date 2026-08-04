// Phase 0 acceptance criterion: a single hardcoded prompt produces a
// visible, streamed response from an Agent SDK session. This script proves
// the orchestrator process can spin up a session and pipe its output live —
// nothing here is wired to the database or state machine yet (Phase 1).
import { query } from "@anthropic-ai/claude-agent-sdk";

const PROMPT =
  "In one short paragraph, explain what a git worktree is and why a tool " +
  "running two coding agents at once would want one worktree per agent.";

async function main() {
  console.log(`[orchestrator] prompt: ${PROMPT}\n`);

  const session = query({
    prompt: PROMPT,
    options: {
      model: "claude-sonnet-5",
      permissionMode: "default",
      includePartialMessages: true,
      allowedTools: [],
    },
  });

  for await (const message of session) {
    if (message.type === "stream_event" && message.event.type === "content_block_delta") {
      const delta = message.event.delta;
      if (delta.type === "text_delta") {
        process.stdout.write(delta.text);
      }
    }

    if (message.type === "result") {
      console.log("\n\n[orchestrator] session complete");
      console.log(`[orchestrator] subtype=${message.subtype} turns=${message.num_turns} cost_usd=${message.total_cost_usd}`);
    }
  }
}

main().catch((err) => {
  console.error("[orchestrator] poc failed:", err);
  process.exitCode = 1;
});
