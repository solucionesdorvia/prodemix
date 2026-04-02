import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminTableProps = {
  children: ReactNode;
  className?: string;
};

export function AdminTable({ children, className }: AdminTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className={cn("w-full min-w-[480px] border-collapse text-left text-[13px]", className)}>
        {children}
      </table>
    </div>
  );
}

export function AdminTh({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "border-b border-neutral-200 bg-neutral-50 px-3 py-2 font-semibold text-neutral-800",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function AdminTd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("border-b border-neutral-100 px-3 py-2 text-neutral-800", className)}>
      {children}
    </td>
  );
}
