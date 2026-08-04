import type { AgentRole, DeliverableRenderType, StageType } from "@mission-control/shared";

export interface MockDeliverable {
  renderType: DeliverableRenderType;
  content: unknown;
}

/**
 * Canned per-stage output used by mock mode, so the full pipeline is
 * testable without a single real Agent SDK call. Content is illustrative,
 * not meant to be a good PRD/design/etc — it exists to exercise the state
 * machine and UI, not to demonstrate agent quality.
 */
export function mockDeliverableFor(
  stageType: StageType,
  role: AgentRole,
  oneLineIdea: string,
): MockDeliverable {
  switch (stageType) {
    case "idea":
    case "spec":
      return {
        renderType: "markdown",
        content:
          `# PRD (mock)\n\n**Idea:** ${oneLineIdea}\n\n` +
          "## Goals\n- Mock goal 1\n- Mock goal 2\n\n" +
          "## Non-goals\n- Mock non-goal\n\n" +
          "## P0 requirements\n- Mock requirement\n\n" +
          "## Acceptance criteria\n- [ ] Mock criterion",
      };
    case "architecture":
      return {
        renderType: "markdown",
        content:
          "# Architecture (mock)\n\n" +
          "## Stack\nMock stack decision.\n\n" +
          "## Data model\nMock schema outline.\n\n" +
          "## API contracts\nMock endpoint list.",
      };
    case "build":
      return {
        renderType: "diff",
        content: {
          agent: role,
          diff: `--- a/mock/${role}.txt\n+++ b/mock/${role}.txt\n@@ -0,0 +1 @@\n+mock ${role} change\n`,
        },
      };
    case "test":
      return {
        renderType: "table",
        content: {
          columns: ["test", "status"],
          rows: [
            ["mock test 1", "pass"],
            ["mock test 2", "pass"],
          ],
        },
      };
    case "docs":
      return {
        renderType: "markdown",
        content: `# README (mock)\n\n${oneLineIdea}\n\n## Usage\nMock usage instructions.`,
      };
  }
}

export function mockChatReplyFor(role: AgentRole, userMessage: string): string {
  return `(mock ${role} reply) Acknowledged: "${userMessage}"`;
}
