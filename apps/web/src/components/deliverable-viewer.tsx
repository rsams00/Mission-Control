import type { DeliverableRenderType } from "@mission-control/shared";

interface DeliverableLike {
  renderType: DeliverableRenderType;
  content: unknown;
}

export function DeliverableViewer({ deliverable }: { deliverable: DeliverableLike }) {
  switch (deliverable.renderType) {
    case "markdown":
      return (
        <pre className="whitespace-pre-wrap rounded-lg border border-border bg-surface-raised p-4 font-sans text-sm leading-relaxed text-ink">
          {String(deliverable.content)}
        </pre>
      );
    case "diff": {
      const value = deliverable.content as { agent?: string; diff?: string };
      return (
        <pre className="overflow-x-auto rounded-lg border border-border bg-surface-raised p-4 font-mono text-xs leading-relaxed text-ink">
          {value.diff ?? JSON.stringify(deliverable.content, null, 2)}
        </pre>
      );
    }
    case "table": {
      const value = deliverable.content as { columns?: string[]; rows?: string[][] };
      if (!value.columns || !value.rows) {
        return <FallbackViewer content={deliverable.content} />;
      }
      return (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-raised font-mono text-[0.68rem] uppercase tracking-wide text-ink-muted">
              <tr>
                {value.columns.map((col) => (
                  <th key={col} className="px-3 py-2 text-left">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.rows.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-ink">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "file_list": {
      const value = deliverable.content as { files?: string[] };
      if (!value.files) return <FallbackViewer content={deliverable.content} />;
      return (
        <ul className="rounded-lg border border-border bg-surface-raised p-4 font-mono text-xs text-ink">
          {value.files.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      );
    }
    default:
      return <FallbackViewer content={deliverable.content} />;
  }
}

// Content that doesn't parse into its declared render_type falls back to raw
// text rather than failing the whole page (section 14 error-handling policy).
function FallbackViewer({ content }: { content: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-surface-raised p-4 font-mono text-xs text-ink-muted">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}
