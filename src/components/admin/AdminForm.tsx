import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminFormProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
};

export function AdminForm({ title, children, className, onSubmit }: AdminFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn("space-y-3 rounded-lg border border-neutral-200 bg-white p-4", className)}
    >
      {title ?
        <h2 className="text-[13px] font-semibold text-neutral-900">{title}</h2>
      : null}
      {children}
    </form>
  );
}

export function AdminField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-[12px] font-medium text-neutral-700">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
