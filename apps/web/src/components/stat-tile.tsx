import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StatTile({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <p className="font-mono text-[0.68rem] uppercase tracking-widest text-ink-muted">{label}</p>
        <Icon className={accent ? "h-4 w-4 text-accent" : "h-4 w-4 text-ink-muted"} strokeWidth={1.75} />
      </div>
      <p className="stat-number mt-3 text-4xl font-semibold text-ink">{value}</p>
    </Card>
  );
}
