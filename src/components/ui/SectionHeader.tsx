import type { ReactNode } from "react";

import { sectionTitle } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[1.25rem] items-center justify-between gap-2",
        className,
      )}
    >
      <h2
        className={cn(
          "flex min-w-0 flex-wrap items-baseline gap-x-1",
          sectionTitle,
        )}
      >
        {title}
      </h2>
      {action ? (
        <div className="shrink-0 text-[12px] font-semibold leading-none text-app-primary [&_a]:transition-colors [&_a]:hover:text-blue-700">
          {action}
        </div>
      ) : null}
    </div>
  );
}
