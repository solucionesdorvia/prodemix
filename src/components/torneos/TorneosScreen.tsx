"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useIngestionTick } from "@/hooks/useIngestionTick";
import { getPublicPoolForMatchday } from "@/mocks/catalog/primera-catalog";
import { getTournamentCatalogue } from "@/mocks/services/tournaments-catalogue.mock";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPoolCloseLabel } from "@/lib/datetime";
import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import {
  collectPoolExploreEntries,
  isPoolPaid,
  sortPoolsByClosePriority,
} from "@/lib/torneos-explore";
import { cn } from "@/lib/utils";
import { CalendarRange, Trophy } from "lucide-react";

import { TorneosExplorePoolCard } from "./TorneosExplorePoolCard";

type ViewTab = "fecha" | "torneo";
type PayFilter = "todos" | "gratis" | "pago";

const VIEW_TABS: { id: ViewTab; label: string }[] = [
  { id: "fecha", label: "Por fecha" },
  { id: "torneo", label: "Por torneo" },
];

const PAY_FILTERS: { id: PayFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "gratis", label: "Gratis" },
  { id: "pago", label: "De pago" },
];

const PAID_PLACEHOLDER =
  "Próximamente vas a poder jugar prodes con entrada y competir por premios más grandes.";

export function TorneosScreen() {
  const ingestionTick = useIngestionTick();
  const [viewTab, setViewTab] = useState<ViewTab>("fecha");
  const [payFilter, setPayFilter] = useState<PayFilter>("todos");

  const catalogue = useMemo(() => {
    void ingestionTick;
    return getTournamentCatalogue();
  }, [ingestionTick]);

  const dateViewEntries = useMemo(() => {
    if (payFilter === "pago") return [];
    let list = collectPoolExploreEntries(catalogue).filter(
      (e) => e.pool.status === "open",
    );
    if (payFilter === "gratis") {
      list = list.filter((e) => !isPoolPaid(e.pool));
    }
    return sortPoolsByClosePriority(list);
  }, [catalogue, payFilter]);

  const tournamentGroups = useMemo(() => {
    if (payFilter === "pago") return [];
    return catalogue
      .map((t) => {
        const rows = t.matchdays
          .map((md) => {
            const pool = getPublicPoolForMatchday(t.id, md.id);
            if (!pool || pool.status !== "open") return null;
            if (payFilter === "gratis" && isPoolPaid(pool)) return null;
            return {
              matchdayId: md.id,
              matchdayName: md.name,
              href: `/torneos/${encodeURIComponent(t.id)}/fechas/${encodeURIComponent(md.id)}`,
              closesLabel: formatPoolCloseLabel(pool.closesAt),
            };
          })
          .filter(Boolean) as {
          matchdayId: string;
          matchdayName: string;
          href: string;
          closesLabel: string;
        }[];
        if (rows.length === 0) return null;
        return { id: t.id, shortName: t.shortName, rows };
      })
      .filter(Boolean) as {
      id: string;
      shortName: string;
      rows: {
        matchdayId: string;
        matchdayName: string;
        href: string;
        closesLabel: string;
      }[];
    }[];
  }, [catalogue, payFilter]);

  const showPaidPlaceholder = payFilter === "pago";

  return (
    <div className="pb-2">
      <header className={pageHeader}>
        <p className={pageEyebrow}>ProdeMix</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Torneos</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-app-muted">
          Elegí cómo explorar las fechas y jugá el prode que te convenga.
        </p>
      </header>

      <div
        className="mt-4 grid grid-cols-2 gap-1 rounded-lg border border-app-border bg-app-bg/60 p-0.5"
        role="tablist"
        aria-label="Forma de explorar"
      >
        {VIEW_TABS.map((tab) => {
          const active = viewTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setViewTab(tab.id)}
              className={cn(
                "rounded-md py-2 text-[12px] font-semibold transition active:scale-[0.98]",
                active
                  ? "bg-app-surface text-app-primary shadow-sm ring-1 ring-app-primary/25"
                  : "text-app-muted hover:text-app-text",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        className="mt-3 grid grid-cols-3 gap-1 rounded-lg border border-app-border bg-app-bg/60 p-0.5"
        role="group"
        aria-label="Tipo de entrada"
      >
        {PAY_FILTERS.map((f) => {
          const active = payFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setPayFilter(f.id)}
              className={cn(
                "rounded-md py-1.5 text-[11px] font-semibold transition active:scale-[0.98]",
                active
                  ? "bg-app-surface text-app-primary shadow-sm ring-1 ring-app-primary/25"
                  : "text-app-muted hover:text-app-text",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {showPaidPlaceholder ?
        <section
          className="mt-6 rounded-[10px] border border-app-border bg-app-surface px-4 py-6 text-center shadow-card"
          aria-live="polite"
        >
          <p className="text-[13px] leading-relaxed text-app-text">{PAID_PLACEHOLDER}</p>
        </section>
      : viewTab === "fecha" ?
        <section className="mt-5 space-y-2">
          {dateViewEntries.length === 0 ?
            <EmptyState
              variant="soft"
              layout="horizontal"
              icon={CalendarRange}
              title="No hay prodes abiertos"
              description="Cuando haya fechas disponibles, las vas a ver acá ordenadas por cuándo cierran."
            />
          : (
            <ul className="space-y-2">
              {dateViewEntries.map((entry) => (
                <li key={`${entry.tournamentId}-${entry.matchdayId}`}>
                  <TorneosExplorePoolCard entry={entry} />
                </li>
              ))}
            </ul>
          )}
        </section>
      : (
        <section className="mt-5 space-y-2">
          {tournamentGroups.length === 0 ?
            <EmptyState
              variant="soft"
              layout="horizontal"
              icon={Trophy}
              title="No hay fechas abiertas"
              description="Probá otro filtro o volvé más tarde."
            />
          : (
            <div className="space-y-2">
              {tournamentGroups.map((g) => (
                <details
                  key={g.id}
                  className="group rounded-[10px] border border-app-border bg-app-surface shadow-card"
                >
                  <summary className="cursor-pointer list-none px-3 py-2.5 [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-app-text">
                        {g.shortName}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-app-muted">
                        {g.rows.length} fecha{g.rows.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-app-muted">
                      <Link
                        href={`/torneos/${encodeURIComponent(g.id)}`}
                        className="font-medium text-app-primary underline-offset-2 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver torneo
                      </Link>
                    </p>
                  </summary>
                  <ul className="border-t border-app-border px-2 pb-2 pt-1">
                    {g.rows.map((row) => (
                      <li key={row.matchdayId}>
                        <Link
                          href={row.href}
                          className="flex flex-col gap-0.5 rounded-lg px-2 py-2 transition hover:bg-app-bg"
                        >
                          <span className="text-[12px] font-semibold text-app-text">
                            {row.matchdayName}
                          </span>
                          <span className="text-[11px] text-app-muted">
                            {row.closesLabel}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
