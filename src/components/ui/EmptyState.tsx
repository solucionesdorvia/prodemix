import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { focusRing } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Extra actions (buttons, links) */
  children?: ReactNode;
  className?: string;
  /** `card` — full panel; `soft` — dashed + light gradient; `minimal` — border only, tight padding */
  variant?: "card" | "soft" | "minimal";
  /** `horizontal` — icon left; `stack` — icon on top (narrow columns) */
  layout?: "horizontal" | "stack";
};

export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
  className,
  variant = "card",
  layout = "horizontal",
}: EmptyStateProps) {
  const shell = cn(
    "overflow-hidden rounded-[10px] border border-app-border shadow-card",
    variant === "card" && "bg-app-surface",
    variant === "soft" &&
      "border-dashed border-app-border/90 bg-gradient-to-b from-slate-50/60 via-app-surface to-app-surface",
    variant === "minimal" &&
      "border-app-border-subtle bg-app-bg/50 shadow-none",
    className,
  );

  const body = (
    <>
      {Icon ? (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl border border-app-border/80 bg-gradient-to-br from-blue-50/95 to-slate-50/70 text-app-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
            layout === "stack" ? "mx-auto h-10 w-10" : "h-11 w-11",
          )}
          aria-hidden
        >
          <Icon className={layout === "stack" ? "h-4 w-4" : "h-5 w-5"} strokeWidth={2} />
        </div>
      ) : null}
      <div
        className={cn(
          "min-w-0 flex-1",
          layout === "stack" && "text-center",
        )}
      >
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-app-muted">
            {eyebrow}
          </p>
        ) : null}
        <h3
          className={cn(
            "text-[13px] font-semibold leading-snug tracking-tight text-app-text",
            eyebrow && "mt-0.5",
            !eyebrow && Icon && layout === "stack" && "mt-2",
          )}
        >
          {title}
        </h3>
        {description ? (
          <div
            className={cn(
              "mt-1.5 text-[11px] leading-relaxed text-app-muted",
              "[&_a]:font-semibold [&_a]:text-app-primary [&_a]:underline-offset-2 [&_a]:hover:underline",
            )}
          >
            {description}
          </div>
        ) : null}
        {children ? (
          <div
            className={cn(
              "mt-3 flex flex-wrap gap-2",
              layout === "stack" && "justify-center",
            )}
          >
            {children}
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <div className={shell}>
      <div
        className={cn(
          "p-3.5",
          variant === "minimal" && "px-3 py-2.5",
          layout === "horizontal" && "flex gap-3 sm:gap-3.5",
          layout === "stack" && "flex flex-col items-center gap-2 px-3 py-4 text-center",
        )}
      >
        {body}
      </div>
    </div>
  );
}

export function EmptyStateButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-[40px] items-center justify-center rounded-lg px-4 text-[12px] font-semibold transition active:scale-[0.99]",
        focusRing,
        variant === "primary" &&
          "bg-app-primary text-white shadow-sm hover:bg-blue-700",
        variant === "secondary" &&
          "border border-app-border bg-app-surface text-app-text shadow-card hover:bg-app-bg",
      )}
    >
      {children}
    </Link>
  );
}
