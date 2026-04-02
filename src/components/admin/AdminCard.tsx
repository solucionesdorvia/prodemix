import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminCardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export function AdminCard({ title, children, className }: AdminCardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-neutral-200 bg-white p-4 shadow-sm",
        className,
      )}
    >
      {title ?
        <h2 className="mb-3 text-[13px] font-semibold text-neutral-900">{title}</h2>
      : null}
      {children}
    </section>
  );
}
