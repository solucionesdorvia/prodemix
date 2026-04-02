"use client";

import { Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { RankingEntry, RankingScope } from "@/domain";
import { useCatalogueRevision } from "@/components/app/CatalogueRefreshContext";
import {
  EmptyState,
  EmptyStateButtonLink,
} from "@/components/ui/EmptyState";
import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";
import {
  formatPublicPoolLabel,
  PRIMERA_PUBLIC_POOLS,
} from "@/mocks/catalog/primera-catalog";
import { getTournamentCatalogue } from "@/mocks/services/tournaments-catalogue.mock";
import { persistScopeRanks } from "@/state/ranking-snapshot";
import { buildRankingEntries } from "@/state/selectors";
import { useAppState } from "@/state/app-state";

const DEFAULT_RANKING_TAB: RankingScope =
  PRIMERA_PUBLIC_POOLS.some((p) => p.status !== "settled") ? "fecha" : "global";

const TABS: { id: RankingScope; label: string }[] = [
  { id: "fecha", label: "Fecha" },
  { id: "global", label: "Global" },
  { id: "tournament", label: "Torneo" },
  { id: "friends", label: "Amigos" },
];

type ApiRankingUserRow = {
  rank: number | null;
  points: number;
  plenos: number;
  signHits: number;
  user: {
    id: string;
    name: string | null;
    username: string | null;
  };
};

function mapGlobalApiToEntries(rows: ApiRankingUserRow[]): RankingEntry[] {
  return rows.map((r) => ({
    rank: r.rank ?? 0,
    playerId: r.user.id,
    displayName:
      r.user.username ?
        `@${r.user.username}`
      : r.user.name ?? "Usuario",
    points: r.points,
    exactScores: r.plenos,
    signHits: r.signHits,
    scope: "global",
  }));
}

function Top10Row({
  row,
  selfPlayerId,
}: {
  row: RankingEntry;
  selfPlayerId: string;
}) {
  const isSelf = row.playerId === selfPlayerId;
  return (
    <li
      className={cn(
        "grid grid-cols-[2rem_1fr_auto] items-center gap-2 border-b border-app-border-subtle px-2.5 py-2 text-[12px] last:border-b-0",
        isSelf && "bg-slate-50/90",
      )}
    >
      <span className="text-center tabular-nums text-app-muted">{row.rank}</span>
      <span
        className={cn(
          "min-w-0 truncate font-medium",
          isSelf ? "text-app-primary" : "text-app-text",
        )}
      >
        {row.displayName}
        {isSelf ? (
          <span className="ml-1 text-[10px] font-normal text-app-muted">(vos)</span>
        ) : null}
      </span>
      <div className="shrink-0 text-right">
        <p className="text-[14px] font-semibold tabular-nums leading-none text-app-text">
          {row.points}
        </p>
        <p className="mt-0.5 text-[9px] text-app-muted">
          {row.exactScores} pleno{row.exactScores === 1 ? "" : "s"}
        </p>
      </div>
    </li>
  );
}

export function RankingScreen() {
  const { user, state } = useAppState();
  const catRev = useCatalogueRevision();
  const [tab, setTab] = useState<RankingScope>(DEFAULT_RANKING_TAB);
  const catalogue = useMemo(() => {
    void catRev;
    return getTournamentCatalogue();
  }, [catRev]);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [publicPoolId, setPublicPoolId] = useState<string | null>(null);

  const [globalApiRows, setGlobalApiRows] = useState<RankingEntry[] | null>(
    null,
  );
  const [globalFetchState, setGlobalFetchState] = useState<
    "idle" | "loading" | "error" | "success"
  >("idle");

  const poolOptions = useMemo(
    () => PRIMERA_PUBLIC_POOLS.filter((p) => p.status !== "settled"),
    [],
  );

  const resolvedPoolId = useMemo(() => {
    if (tab !== "fecha" || poolOptions.length === 0) return null;
    if (publicPoolId && poolOptions.some((p) => p.id === publicPoolId)) {
      return publicPoolId;
    }
    return poolOptions[0]!.id;
  }, [tab, poolOptions, publicPoolId]);

  const resolvedTournamentId = useMemo(() => {
    if (tab !== "tournament" || catalogue.length === 0) return null;
    if (tournamentId && catalogue.some((t) => t.id === tournamentId)) {
      return tournamentId;
    }
    return catalogue[0].id;
  }, [tab, catalogue, tournamentId]);

  const rows = useMemo(() => {
    void catRev;
    if (tab === "global") {
      if (globalApiRows === null) return [];
      return globalApiRows;
    }
    if (tab === "fecha" && resolvedPoolId) {
      return buildRankingEntries(
        "fecha",
        user.id,
        user.displayName,
        state,
        { publicPoolId: resolvedPoolId },
      );
    }
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
  }, [
    tab,
    globalApiRows,
    resolvedTournamentId,
    resolvedPoolId,
    user.id,
    user.displayName,
    state,
    catRev,
  ]);

  useEffect(() => {
    if (tab !== "global") return;
    let cancelled = false;
    setGlobalApiRows(null);
    setGlobalFetchState("loading");
    fetch("/api/ranking", { credentials: "include" })
      .then(async (res) => {
        const data = (await res.json()) as {
          ranking?: ApiRankingUserRow[];
          error?: { message?: string };
        };
        if (!res.ok) {
          throw new Error(data.error?.message ?? "Error al cargar el ranking.");
        }
        return data.ranking ?? [];
      })
      .then((ranking) => {
        if (cancelled) return;
        setGlobalApiRows(mapGlobalApiToEntries(ranking));
        setGlobalFetchState("success");
      })
      .catch(() => {
        if (!cancelled) {
          setGlobalApiRows([]);
          setGlobalFetchState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tab, user.id]);

  const scopeKey = useMemo(() => {
    if (tab === "tournament" && resolvedTournamentId) {
      return `tournament:${resolvedTournamentId}`;
    }
    if (tab === "fecha" && resolvedPoolId) {
      return `pool:${resolvedPoolId}`;
    }
    return tab;
  }, [tab, resolvedTournamentId, resolvedPoolId]);

  const listRows = useMemo(() => rows.slice(0, 10), [rows]);

  const rankingHeading = useMemo(() => {
    if (tab === "fecha") {
      if (resolvedPoolId) {
        const p = poolOptions.find((x) => x.id === resolvedPoolId);
        return p ?
            `Clasificación · ${formatPublicPoolLabel(p)}`
          : "Clasificación del pool";
      }
      return "Clasificación por fecha";
    }
    if (tab === "global") {
      return "Clasificación general";
    }
    if (tab === "tournament" && resolvedTournamentId) {
      const t = catalogue.find((x) => x.id === resolvedTournamentId);
      return t ? `Clasificación · ${t.shortName}` : "Clasificación del torneo";
    }
    if (tab === "friends") {
      return "Clasificación entre amigos";
    }
    return "Clasificación";
  }, [
    tab,
    resolvedPoolId,
    resolvedTournamentId,
    poolOptions,
    catalogue,
  ]);

  const userRow = useMemo(
    () => rows.find((r) => r.playerId === user.id),
    [rows, user.id],
  );

  const userInList = useMemo(
    () => listRows.some((r) => r.playerId === user.id),
    [listRows, user.id],
  );

  useEffect(() => {
    if (rows.length === 0) return;
    persistScopeRanks(scopeKey, rows);
  }, [scopeKey, rows]);

  return (
    <div className="pb-2">
      <header className={pageHeader}>
        <p className={pageEyebrow}>ProdeMix</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Ranking</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-app-muted">
          Tabla por alcance. Puntuación: pleno 3 pts, acierto de signo 1 pt.
        </p>
      </header>

      <div
        className="mt-4 grid grid-cols-2 gap-1 rounded-lg border border-app-border bg-app-bg/50 p-1"
        role="tablist"
        aria-label="Alcance del ranking"
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
                "rounded-md px-2 py-2 text-center text-[12px] font-semibold transition",
                active
                  ? "bg-app-surface text-app-text shadow-sm ring-1 ring-app-border"
                  : "text-app-muted hover:text-app-text",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "fecha" && poolOptions.length > 0 && resolvedPoolId ? (
        <label className="mt-2 block">
          <span className="text-[10px] font-medium uppercase tracking-wide text-app-muted">
            Pool
          </span>
          <select
            value={resolvedPoolId}
            onChange={(e) => setPublicPoolId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-app-border bg-app-surface px-2.5 py-2 text-[13px] font-medium text-app-text outline-none focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
          >
            {poolOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {formatPublicPoolLabel(p)}
                {" · "}
                {p.type === "public_paid" ?
                  `Ingreso $${p.entryFeeArs.toLocaleString("es-AR")}`
                : "Sin ingreso"}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {tab === "tournament" && catalogue.length > 0 && resolvedTournamentId ? (
        <label className="mt-2 block">
          <span className="text-[10px] font-medium uppercase tracking-wide text-app-muted">
            Competición
          </span>
          <select
            value={resolvedTournamentId}
            onChange={(e) => setTournamentId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-app-border bg-app-surface px-2.5 py-2 text-[13px] font-medium text-app-text outline-none focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
          >
            {catalogue.map((t) => (
              <option key={t.id} value={t.id}>
                {t.shortName}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {tab === "global" && globalApiRows === null && globalFetchState !== "error" ?
        <p className="mt-3 text-[13px] text-app-muted">
          Cargando clasificación…
        </p>
      : tab === "global" && globalFetchState === "error" ?
        <p className="mt-3 text-[13px] text-red-700">
          No se pudo cargar el ranking global. Reintentá más tarde.
        </p>
      : rows.length === 0 ?
        <EmptyState
          className="mt-3"
          variant="soft"
          layout="horizontal"
          icon={Trophy}
          title="Sin datos en esta vista"
          description={
            tab === "global" ?
              "Cuando haya puntos registrados en prodes, aparecerán en esta tabla."
            : "Elegí un pool con partidos jugados y pronósticos cargados, o revisá el ranking global."
          }
        >
          <EmptyStateButtonLink href="/torneos">Torneos</EmptyStateButtonLink>
        </EmptyState>
      : (
        <>
          {listRows.length > 0 ? (
            <section className="mt-3">
              <h2 className="text-[13px] font-semibold leading-snug tracking-tight text-app-text">
                {rankingHeading}
              </h2>
              <p className="mt-0.5 text-[10px] leading-snug text-app-muted">
                {rows.length}{" "}
                {rows.length === 1 ? "jugador" : "jugadores"} en el ranking
                {rows.length > 10 ? " · primeras 10 posiciones" : null}
              </p>
              <ul className="mt-2 overflow-hidden rounded-lg border border-app-border bg-app-surface">
                {listRows.map((r) => (
                  <Top10Row
                    key={`${scopeKey}-${r.playerId}`}
                    row={r}
                    selfPlayerId={user.id}
                  />
                ))}
              </ul>
              {userRow && !userInList ?
                <p className="mt-2 rounded-lg border border-dashed border-app-border bg-app-bg/80 px-2.5 py-2 text-[11px] text-app-muted">
                  <span className="text-app-text">Tu posición:</span>{" "}
                  <span className="font-semibold tabular-nums text-app-text">
                    {userRow.rank}
                  </span>
                  <span className="text-app-border"> · </span>
                  <span className="tabular-nums">{userRow.points} pts</span>
                  <span className="block pt-0.5 text-[10px]">
                    {userRow.exactScores} plenos
                  </span>
                </p>
              : null}
            </section>
          ) : null}

          <p className="mt-3 text-[10px] leading-snug text-app-muted">
            {tab === "global" ?
              <>
                Clasificación global: suma de puntos de todos los prodes. Mismo
                criterio de desempate que en cada prode.
              </>
            : (
              <>
                En <span className="font-medium text-app-text">Fecha</span>{" "}
                entran solo partidos de ese pool con resultado. Desempate: más
                plenos, más aciertos de signo, pronóstico guardado antes.
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}
