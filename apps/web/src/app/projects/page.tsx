import Link from "next/link";
import { listProjects } from "@/lib/data";
import { createProjectAction } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CurrentStageBadge } from "@/components/stage-badge";
import { Plus } from "lucide-react";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">Projects</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Mission Control</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New project</CardTitle>
          <CardDescription>
            One line is enough — Product Strategist starts the Idea stage immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProjectAction} className="flex flex-col gap-3">
            <input
              name="name"
              placeholder="Project name"
              required
              className="h-9 rounded-md border border-border bg-surface-raised px-3 text-sm text-ink placeholder:text-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            />
            <Textarea name="oneLineIdea" placeholder="One-line idea" required rows={2} />
            <div>
              <Button type="submit">
                <Plus className="h-4 w-4" />
                Create project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-ink-muted">
          {projects.length} project{projects.length === 1 ? "" : "s"}
        </p>
        {projects.length === 0 ? (
          <p className="text-sm text-ink-muted">No projects yet — create one above.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="h-full transition-colors hover:border-accent/50">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="truncate">{p.name}</CardTitle>
                      <CurrentStageBadge stage={p.currentStage} />
                    </div>
                    <CardDescription className="line-clamp-2">{p.oneLineIdea}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
