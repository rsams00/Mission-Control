import type { AgentRole } from "@mission-control/shared";
import {
  Compass,
  Lightbulb,
  Blocks,
  Server,
  Layout,
  FlaskConical,
  BookText,
  Search,
  Palette,
  Cloud,
  ShieldCheck,
  TrendingUp,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";

export interface AgentIdentity {
  role: AgentRole;
  label: string;
  color: string; // CSS var name, e.g. "--role-backend"
  Icon: LucideIcon;
}

export const AGENT_IDENTITY: Record<AgentRole, AgentIdentity> = {
  orchestrator: { role: "orchestrator", label: "Orchestrator", color: "--role-orchestrator", Icon: Compass },
  product: { role: "product", label: "Product Strategist", color: "--role-product", Icon: Lightbulb },
  architect: { role: "architect", label: "Architect", color: "--role-architect", Icon: Blocks },
  backend: { role: "backend", label: "Backend Engineer", color: "--role-backend", Icon: Server },
  frontend: { role: "frontend", label: "Frontend Engineer", color: "--role-frontend", Icon: Layout },
  qa: { role: "qa", label: "QA / Test Engineer", color: "--role-qa", Icon: FlaskConical },
  docs: { role: "docs", label: "Docs Writer", color: "--role-docs", Icon: BookText },
  researcher: { role: "researcher", label: "Researcher", color: "--role-researcher", Icon: Search },
  designer: { role: "designer", label: "UX/Product Designer", color: "--role-designer", Icon: Palette },
  devops: { role: "devops", label: "DevOps/Infra", color: "--role-devops", Icon: Cloud },
  security: { role: "security", label: "Security Reviewer", color: "--role-security", Icon: ShieldCheck },
  growth: { role: "growth", label: "Growth/Analytics", color: "--role-growth", Icon: TrendingUp },
  support: { role: "support", label: "Support/Triage", color: "--role-support", Icon: LifeBuoy },
};
