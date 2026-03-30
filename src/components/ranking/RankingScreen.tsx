"use client";

import { Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { RankingEntry, RankingScope } from "@/domain";
import {
  EmptyState,
  EmptyStateButtonLink,
} from "@/components/ui/EmptyState";
import { initialsFromDisplayName } from "@/lib/user-display";
import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";
import { getTournamentCatalogue } from "@/mocks/services/tournaments-catalogue.mock";
import { persistScopeRanks } from "@/state/ranking-snapshot";
import { buildRankingEntries } from "@/state/selectors";
import { useAppState } from "@/state/app-state";

import { RankingDeltaBadge } from "./RankingDeltaBadge";
import { RankingStatsLine } from "./RankingStatsLine";

const TABS: {
  id: RankingScope;
  label: string;
  hint: string;
}[] = [
  { id: "global", label: "Global", hint: "Todos los partidos" },
  { id: "friends", label: "Amigos", hint: "Tu círculo" },
  { id: "liga", label: "Liga", hint: "Liga mix" },
  { id: "tournament", label: "Torneo", hint: "Por competición" },
];

function Podium({
  rows,
  selfPlayerId,
}: {
  rows: RankingEntry[];
  selfPlayerId: string;
}) {
  const top = rows.slice(0, 3);
  if (top.length === 0) return null;

  if (top.length === 1) {
    return (
      <div className="flex justify-center px-1">
        <PodiumCard
          row={top[0]}
          place={1}
          emphasis
          selfPlayerId={selfPlayerId}
        />
      </div>
    );
  }

  if (top.length === 2) {
    return (
      <div className="flex items-end justify-center gap-2 px-1">
        <PodiumCard row={top[1]} place={2} selfPlayerId={selfPlayerId} />
        <PodiumCard
          row={top[0]}
          place={1}
          emphasis
          selfPlayerId={selfPlayerId}
        />
      </div>
    );
  }

  return (
    <div className="flex items-end justify-center gap-1.5 px-0.5">
      <PodiumCard row={top[1]} place={2} selfPlayerId={selfPlayerId} />
      <PodiumCard
        row={top[0]}
        place={1}
        emphasis
        selfPlayerId={selfPlayerId}
      />
      <PodiumCard row={top[2]} place={3} selfPlayerId={selfPlayerId} />
    </div>
  );
}

function PodiumCard({
  row,
  place,
  emphasis,
  selfPlayerId,
}: {
  row: RankingEntry;
  place: 1 | 2 | 3;
  emphasis?: boolean;
  selfPlayerId: string;
}) {
  const isSelf = row.playerId === selfPlayerId;
  const ring =
    place === 1
      ? "border-amber-200 bg-gradient-to-b from-amber-50 to-amber-100/90"
      : place === 2
        ? "border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/80"
        : "border-orange-200 bg-gradient-to-b from-orange-50 to-orange-100/80";
  const pron = row.predictionsOnScored ?? 0;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center rounded-xl border px-1.5 pb-2 pt-2.5 text-center shadow-sm",
        ring,
        emphasis && "z-[1] min-h-[7.75rem] scale-[1.02] shadow-md",
        !emphasis && "min-h-[6.5rem]",
        isSelf && "ring-2 ring-app-primary/35",
      )}
    >
      <span
        className={cn(
          "text-[10px] font-bold tabular-nums text-app-muted",
          emphasis && "text-app-text",
        )}
      >
        {place}°
      </span>
      <div
        className={cn(
          "mt-1 flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold text-white",
          place === 1 && "bg-amber-500",
          place === 2 && "bg-slate-400",
          place === 3 && "bg-orange-400",
        )}
      >
        {initialsFromDisplayName(row.displayName)}
      </div>
      <p
        className={cn(
          "mt-1 w-full truncate px-0.5 text-[11px] font-semibold leading-tight text-app-text",
          isSelf && "text-app-primary",
        )}
      >
        {row.displayName}
        {isSelf ? (
          <span className="block text-[9px] font-normal text-app-muted">
            vos
          </span>
        ) : null}
      </p>
      <p className="mt-0.5 text-[16px] font-bold tabular-nums leading-none text-app-text">
        {row.points}
      </p>
      <p className="mt-0.5 text-[9px] font-medium text-app-muted">pts</p>
      <p className="mt-1 text-[8px] leading-tight text-app-muted">
        {pron} pron. · {row.exactScores} pleno
        {row.exactScores === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function RestRow({
  row,
  selfPlayerId,
}: {
  row: RankingEntry;
  selfPlayerId: string;
}) {
  const isSelf = row.playerId === selfPlayerId;

  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-2 py-2 shadow-[0_1px_0_rgba(15,23,42,0.03)]",
          isSelf &&
            "border-app-primary/40 bg-blue-50/90 ring-1 ring-app-primary/20",
        )}
      >
        <span className="w-5 shrink-0 text-center text-[12px] font-bold tabular-nums text-app-muted">
          {row.rank}
        </span>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
            isSelf ? "bg-app-primary" : "bg-app-text/85",
          )}
        >
          {initialsFromDisplayName(row.displayName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "truncate text-[12px] font-semibold leading-tight",
                isSelf ? "text-app-primary" : "text-app-text",
              )}
            >
              {row.displayName}
              {isSelf ? (
                <span className="ml-1 text-[10px] font-normal text-app-muted">
                  (vos)
                </span>
              ) : null}
            </span>
            <RankingDeltaBadge row={row} />
          </div>
          <RankingStatsLine row={row} />
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[17px] font-bold tabular-nums leading-none text-app-text">
            {row.points}
          </p>
          <p className="mt-0.5 text-[9px] font-medium text-app-muted">pts</p>
        </div>
      </div>
    </li>
  );
}

export function RankingScreen() {
  const { user, state, recordActivity } = useAppState();
  const [tab, setTab] = useState<RankingScope>("global");
  const catalogue = useMemo(() => getTournamentCatalogue(), []);
  const [tournamentId, setTournamentId] = useState<string | null>(null);

  const resolvedTournamentId = useMemo(() => {
    if (tab !== "tournament" || catalogue.length === 0) return null;
    if (tournamentId && catalogue.some((t) => t.id === tournamentId)) {
      return tournamentId;
    }
    return catalogue[0].id;
  }, [tab, catalogue, tournamentId]);

  const rows = useMemo(() => {
    if (tab === "tournament") {
      const tid = resolvedTournamentId;
      if (!tid) return [];
      return buildRankingEntries(
        "tournament",
        user.id,
        user.displayName,
        state,
        { tournamentId: tid },
      );
    }
    return buildRankingEntries(tab, user.id, user.displayName, state);
  }, [tab, resolvedTournamentId, user.id, user.displayName, state]);

  const scopeKey = useMemo(() => {
    if (tab === "tournament" && resolvedTournamentId) {
      return `tournament:${resolvedTournamentId}`;
    }
    return tab;
  }, [tab, resolvedTournamentId]);

  const rankingScopeLabel = useMemo(() => {
    if (tab === "tournament" && resolvedTournamentId) {
      return (
        catalogue.find((t) => t.id === resolvedTournamentId)?.shortName ??
        "Torneo"
      );
    }
    if (tab === "global") return "Global";
    if (tab === "friends") return "Amigos";
    return "Liga";
  }, [tab, resolvedTournamentId, catalogue]);

  useEffect(() => {
    if (rows.length === 0) return;
    persistScopeRanks(scopeKey, rows);
  }, [scopeKey, rows]);

  useEffect(() => {
    const me = rows.find((r) => r.playerId === user.id);
    if (!me?.rankDelta || me.rankDelta <= 0) return;
    recordActivity({
      title: "Subiste en el ranking",
      detail: `+${me.rankDelta} posición${me.rankDelta === 1 ? "" : "es"} · ${rankingScopeLabel}`,
      kind: "ranking",
      dedupeKey: `rank:${scopeKey}:${user.id}:r${me.rank}`,
    });
  }, [
    rows,
    user.id,
    scopeKey,
    rankingScopeLabel,
    recordActivity,
  ]);

  const rest = rows.slice(3);

  return (
    <div className="pb-2">
      <header className={pageHeader}>
        <p className={pageEyebrow}>ProdeMix</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Ranking</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-app-muted">
          3 pts pleno · 1 pt resultado correcto · 0 si fallás el veredicto
        </p>
      </header>

      <div
        className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-app-border bg-app-bg/60 p-1 shadow-inner"
        role="tablist"
        aria-label="Vista de ranking"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-lg px-1 py-2 text-center transition active:scale-[0.99]",
                active
                  ? "bg-app-surface text-app-text shadow-sm ring-1 ring-app-border"
                  : "text-app-muted hover:text-app-text",
              )}
            >
              <span className="block text-[12px] font-bold leading-none">
                {t.label}
              </span>
              <span className="mt-0.5 block text-[9px] font-medium leading-tight text-app-muted">
                {t.hint}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "tournament" && catalogue.length > 0 && resolvedTournamentId ? (
        <label className="mt-2 block">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-app-muted">
            Competición
          </span>
          <select
            value={resolvedTournamentId}
            onChange={(e) => setTournamentId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-app-border bg-app-surface px-2.5 py-2 text-[13px] font-semibold text-app-text shadow-[0_1px_0_rgba(15,23,42,0.04)] outline-none focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
          >
            {catalogue.map((t) => (
              <option key={t.id} value={t.id}>
                {t.shortName} · {t.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          className="mt-3"
          variant="soft"
          layout="horizontal"
          icon={Trophy}
          title="Todavía no hay tabla en esta vista"
          description="Necesitamos partidos con resultado para ordenar puntos. Sumate a un prode, cargá pronósticos y volvé cuando haya marcadores cerrados."
        >
          <EmptyStateButtonLink href="/torneos">Explorar torneos</EmptyStateButtonLink>
          <EmptyStateButtonLink href="/crear" variant="secondary">
            Crear prode
          </EmptyStateButtonLink>
        </EmptyState>
      ) : (
        <>
          <section className="mt-3 space-y-1.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
              Top 3
            </h2>
            <Podium rows={rows} selfPlayerId={user.id} />
          </section>

          {rest.length > 0 ? (
            <section className="mt-3 space-y-1.5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                Tabla
              </h2>
              <ul className="space-y-1.5">
                {rest.map((r) => (
                  <RestRow
                    key={`${scopeKey}-${r.playerId}`}
                    row={r}
                    selfPlayerId={user.id}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          <p className="mt-3 rounded-lg border border-dashed border-app-border bg-app-bg/80 px-2.5 py-2 text-[10px] leading-snug text-app-muted">
            Solo cuentan partidos con resultado cargado. Las flechas comparan tu
            posición con la última vez que abriste esta vista (demo local).
          </p>
        </>
      )}
    </div>
  );
}
