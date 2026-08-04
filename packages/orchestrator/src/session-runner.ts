import type { AgentRole, StageType } from "@mission-control/shared";
import { mockDeliverableFor, type MockDeliverable } from "./mock-fixtures.js";

export interface SessionRunParams {
  role: AgentRole;
  stageType: StageType;
  oneLineIdea: string;
  /** Present on a rejection re-run; injected into the real prompt as context. */
  feedback?: string;
}

export interface SessionRunResult {
  deliverable: MockDeliverable;
  tokenUsage: Record<string, unknown>;
  mock: boolean;
}

/**
 * Mock mode is the default and is what every build/dev/demo run in this
 * repo uses today — no ANTHROPIC_API_KEY is configured for real runs yet,
 * and none should be spent until the user explicitly asks for a real test.
 * Set MISSION_CONTROL_MOCK=false only once a key is in place and a real
 * run has been explicitly requested.
 */
export function isMockMode(): boolean {
  return process.env.MISSION_CONTROL_MOCK !== "false";
}

const MOCK_SESSION_DELAY_MS = 150;

async function runMockSession(params: SessionRunParams): Promise<SessionRunResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_SESSION_DELAY_MS));
  return {
    deliverable: mockDeliverableFor(params.stageType, params.role, params.oneLineIdea),
    tokenUsage: { input_tokens: 0, output_tokens: 0, cost_usd: 0, mock: true },
    mock: true,
  };
}

/**
 * Real path — deliberately never called by anything in this repo yet.
 * Wired up for Phase 1's shape so Phase 2+ doesn't need a rewrite, but
 * exercising it requires MISSION_CONTROL_MOCK=false and a real
 * ANTHROPIC_API_KEY, and should only happen when the user explicitly asks
 * for a real test run.
 */
async function runRealSession(_params: SessionRunParams): Promise<SessionRunResult> {
  throw new Error(
    "Real Agent SDK sessions are not wired up yet in this repo. " +
      "This is intentional — do not implement or call this until the user has " +
      "provided an API key and explicitly asked for a real (paid) test run.",
  );
}

export async function runSession(params: SessionRunParams): Promise<SessionRunResult> {
  return isMockMode() ? runMockSession(params) : runRealSession(params);
}
