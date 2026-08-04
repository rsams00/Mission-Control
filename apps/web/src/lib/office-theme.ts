// Tier B is a deliberately distinct palette from Tier A's charcoal/orange
// dashboard — scoped via CSS custom property overrides on .office-shell, so
// nothing outside the office view is affected. Shared by the global office
// page and the per-project one (kept alive alongside it, see README).
export const OFFICE_THEME: Record<string, string> = {
  "--color-bg": "#1a1024",
  "--color-surface": "#241833",
  "--color-surface-raised": "#2f1f42",
  "--color-ink": "#f3ead9",
  "--color-ink-muted": "#b9a7c9",
  "--color-border": "#3a2650",
  "--color-accent": "#e8a33d",
  "--color-accent-ink": "#241304",
};
