"use client";

import { Star } from "lucide-react";
import Link from "next/link";

import { EmptyState, EmptyStateButtonLink } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

type HomeFollowedStripProps = {
  items: { id: string; shortName: string }[];
  className?: string;
};

export function HomeFollowedStrip({ items, className }: HomeFollowedStripProps) {
  return (
    <section className={cn("space-y-1.5", className)}>
      <SectionHeader
        title="Torneos que seguís"
        action={
          <Link href="/torneos" className="font-semibold hover:underline">
            Ver todos
          </Link>
        }
      />
      {items.length === 0 ? (
        <EmptyState
          variant="soft"
          layout="stack"
          icon={Star}
          title="Todavía no seguís torneos"
          description="Marcá los que te interesan y los vas a ver acá y en el inicio."
        >
          <EmptyStateButtonLink href="/torneos">Explorar torneos</EmptyStateButtonLink>
        </EmptyState>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((t) => (
            <Link
              key={t.id}
              href={`/torneos/${encodeURIComponent(t.id)}`}
              className="inline-flex max-w-full truncate rounded-full border border-app-border bg-app-surface px-2.5 py-1 text-[11px] font-semibold text-app-text shadow-[0_1px_0_rgba(15,23,42,0.03)] transition hover:border-app-primary/40 hover:bg-blue-50/50 active:scale-[0.99]"
            >
              {t.shortName}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
