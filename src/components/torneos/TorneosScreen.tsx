"use client";

import { ChevronUp, FilterX, Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { TorneoCategoryFilterId } from "@/domain";
import { useIngestionTick } from "@/hooks/useIngestionTick";
import {
  collectDistinctRegions,
  filterTorneoBrowseItems,
  type TorneoStatusFilter,
} from "@/lib/torneos-browse-filter";
import { getTournamentCatalogue } from "@/mocks/services/tournaments-catalogue.mock";
import {
  getTorneoBrowseItems,
  TORNEOS_CATEGORY_CHIPS,
} from "@/mocks/services/torneos-browse.mock";
import { EmptyState } from "@/components/ui/EmptyState";
import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import { useAppState } from "@/state/app-state";
import { cn } from "@/lib/utils";

import { TorneoCard } from "./TorneoCard";

const STATUS_SEGMENTS: { id: TorneoStatusFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activos" },
  { id: "completed", label: "Finalizados" },
];

export function TorneosScreen() {
  const { state, toggleFollowTournament } = useAppState();
  const followed = useMemo(
    () => new Set(state.followedTournamentIds),
    [state.followedTournamentIds],
  );

  const ingestionTick = useIngestionTick();
  const allTorneos = useMemo(() => {
    void ingestionTick;
    return getTorneoBrowseItems();
  }, [ingestionTick]);

  const playFechaHrefByTournamentId = useMemo(() => {
    void ingestionTick;
    const out: Record<string, string> = {};
    for (const t of getTournamentCatalogue()) {
      const md =
        t.matchdays.find((m) => m.status === "open") ?? t.matchdays[0];
      if (md) {
        out[t.id] = `/torneos/${encodeURIComponent(t.id)}/fechas/${encodeURIComponent(md.id)}`;
      }
    }
    return out;
  }, [ingestionTick]);

  const regions = useMemo(
    () => collectDistinctRegions(allTorneos),
    [allTorneos],
  );

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TorneoCategoryFilterId>("todos");
  const [status, setStatus] = useState<TorneoStatusFilter>("all");
  const [region, setRegion] = useState<string>("all");
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [followedOnly, setFollowedOnly] = useState(false);

  const toggleFollow = (id: string) => {
    toggleFollowTournament(id);
  };

  const filtered = useMemo(() => {
    return filterTorneoBrowseItems(allTorneos, {
      category,
      query,
      region,
      status,
      upcomingOnly,
      followedOnly,
      followedIds: followed,
    });
  }, [
    allTorneos,
    category,
    query,
    region,
    status,
    upcomingOnly,
    followedOnly,
    followed,
  ]);

  const { featuredList, mainList } = useMemo(() => {
    const feat = filtered.filter((t) => t.featured);
    const main =
      feat.length === 0
        ? filtered
        : filtered.filter((t) => !t.featured);
    return { featuredList: feat, mainList: main };
  }, [filtered]);

  return (
    <div className="pb-2">
      <header className={pageHeader}>
        <p className={pageEyebrow}>ProdeMix</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Torneos</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-app-muted">
          Solo Primera. Elegí un torneo, abrí la fecha y entrá al pool público de
          esa jornada.
        </p>
      </header>

      <div className="relative mt-4">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted"
          strokeWidth={2}
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, zona o barrio…"
          className="h-10 w-full rounded-lg border border-app-border bg-app-surface py-2 pl-9 pr-3 text-[13px] font-medium text-app-text shadow-[0_1px_0_rgba(15,23,42,0.04)] outline-none placeholder:text-app-muted/70 focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>

      <div
        className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Categorías"
      >
        {TORNEOS_CATEGORY_CHIPS.map((c) => {
          const active = category === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(c.id)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition active:scale-[0.98]",
                active
                  ? "border-app-primary bg-app-primary text-white shadow-sm"
                  : "border-app-border bg-app-surface text-app-text shadow-[0_1px_0_rgba(15,23,42,0.04)]",
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div
        className="mt-2 grid grid-cols-3 gap-1 rounded-lg border border-app-border bg-app-bg/60 p-0.5"
        role="group"
        aria-label="Estado del torneo"
      >
        {STATUS_SEGMENTS.map((s) => {
          const active = status === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatus(s.id)}
              className={cn(
                "rounded-md py-1.5 text-[11px] font-semibold transition active:scale-[0.98]",
                active
                  ? "bg-app-surface text-app-primary shadow-sm ring-1 ring-app-primary/25"
                  : "text-app-muted hover:text-app-text",
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setUpcomingOnly((v) => !v)}
          title="Solo torneos con al menos un partido próximo sin resultado"
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold transition active:scale-[0.98]",
            upcomingOnly
              ? "border-app-primary bg-blue-50 text-app-primary"
              : "border-app-border bg-app-surface text-app-text",
          )}
        >
          Próximos
        </button>
        <button
          type="button"
          onClick={() => setFollowedOnly((v) => !v)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold transition active:scale-[0.98]",
            followedOnly
              ? "border-app-primary bg-blue-50 text-app-primary"
              : "border-app-border bg-app-surface text-app-text",
          )}
        >
          Seguidos
        </button>
        <label className="ml-auto flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-app-muted">
          <span className="shrink-0">Zona</span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="max-w-[10rem] min-w-0 flex-1 truncate rounded-md border border-app-border bg-app-surface py-1 pl-1.5 pr-6 text-[10px] font-semibold text-app-text shadow-sm outline-none focus:border-app-primary focus:ring-1 focus:ring-app-primary/25"
          >
            <option value="all">Todas</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      {featuredList.length > 0 ? (
        <section className="mt-5 space-y-2">
          <h2 className="text-[13px] font-semibold tracking-tight text-app-text">
            Destacados · Primera
          </h2>
          <div className="-mx-0.5 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pl-0.5 pr-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featuredList.map((t) => (
              <div
                key={t.id}
                className="w-[min(100%,18rem)] shrink-0 snap-start"
              >
                <TorneoCard
                  torneo={t}
                  following={followed.has(t.id)}
                  onToggleFollow={() => toggleFollow(t.id)}
                  variant="featured"
                  playFechaHref={playFechaHrefByTournamentId[t.id] ?? null}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-5 space-y-2">
        <h2 className="flex flex-wrap items-baseline gap-x-1 text-[13px] font-semibold tracking-tight text-app-text">
          <span>
            {featuredList.length > 0 ? "Más competiciones" : "Explorar"}
          </span>
          <span className="font-normal text-[11px] text-app-muted">
            ({filtered.length})
          </span>
        </h2>

        {filtered.length === 0 ? (
          <EmptyState
            variant="soft"
            layout="horizontal"
            icon={FilterX}
            title="Nada que coincida con esos filtros"
            description="Probá otra categoría, zona, estado o limpiá la búsqueda. También podés sacar “Próximos” o “Seguidos” si los tenés activos."
          />
        ) : mainList.length === 0 ? (
          <EmptyState
            variant="minimal"
            layout="horizontal"
            icon={ChevronUp}
            title="Todo lo que encontramos está en Destacados"
            description="Deslizá arriba: los torneos destacados ya cubren tu búsqueda."
          />
        ) : (
          <ul className="space-y-2">
            {mainList.map((t) => (
              <li key={t.id}>
                <TorneoCard
                  torneo={t}
                  following={followed.has(t.id)}
                  onToggleFollow={() => toggleFollow(t.id)}
                  playFechaHref={playFechaHrefByTournamentId[t.id] ?? null}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
