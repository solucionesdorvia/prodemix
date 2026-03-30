import { cn } from "@/lib/utils";

/** Small caps label above page titles — consistent app-wide */
export const pageEyebrow =
  "text-[10px] font-semibold uppercase tracking-wider text-app-muted";

/** Primary screen title */
export const pageTitle =
  "text-[17px] font-semibold leading-tight tracking-tight text-app-text";

/** Standard header block under the shell */
export const pageHeader =
  "border-b border-app-border-subtle pb-2.5";

/** Section title row (use with SectionHeader or standalone) */
export const sectionTitle =
  "text-[13px] font-semibold leading-none tracking-tight text-app-text";

/**
 * Card shell: radius, border, surface, single-pixel lift shadow.
 * Pair with hover variants at call site when interactive.
 */
export const cardSurface =
  "rounded-[10px] border border-app-border bg-app-surface shadow-card";

/** Focus ring for primary interactive elements (buttons, key links) */
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg";

/** Primary full-width CTA (touch-friendly min height) */
export function btnPrimaryFull(className?: string) {
  return cn(
    "inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[10px] bg-app-primary px-4 text-[13px] font-semibold text-white shadow-sm transition",
    "hover:bg-blue-700 active:scale-[0.995] active:bg-blue-800",
    focusRing,
    "disabled:pointer-events-none disabled:opacity-40",
    className,
  );
}

/** Secondary / outline button */
export function btnSecondary(className?: string) {
  return cn(
    "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-app-border bg-app-surface px-3 text-[13px] font-semibold text-app-text shadow-sm transition",
    "hover:bg-app-bg active:scale-[0.995]",
    focusRing,
    className,
  );
}

/** Compact row button (cards, ~40px row height) */
export function btnCompact(className?: string) {
  return cn(
    "inline-flex h-10 min-h-[40px] min-w-0 items-center justify-center rounded-lg text-[12px] font-semibold transition active:scale-[0.99]",
    focusRing,
    className,
  );
}

/** Muted uppercase label inside stats / cells */
export const statLabel =
  "text-[10px] font-semibold uppercase leading-none tracking-wide text-app-muted";
