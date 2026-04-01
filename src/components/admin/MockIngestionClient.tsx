"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { TeamCrest } from "@/components/team/TeamCrest";
import type { Match, TorneoCategoryFilterId } from "@/domain";
import { TORNEOS_CATEGORY_CHIPS } from "@/mocks/services/torneos-browse.mock";
import {
  loadIngestionStorage,
  saveIngestionStorage,
} from "@/state/ingestion-storage";
import type { IngestedTournamentRecord, IngestionStorage } from "@/state/ingestion-types";
import { DEFAULT_INGESTION } from "@/state/ingestion-types";
import { cn } from "@/lib/utils";

const CATEGORY_OPTIONS = TORNEOS_CATEGORY_CHIPS.filter((c) => c.id !== "todos");

function newTournamentId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `ing-${crypto.randomUUID()}`;
  }
  return `ing-${Date.now().toString(36)}`;
}

function newMatchId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `ing-m-${crypto.randomUUID().slice(0, 12)}`;
  }
  return `ing-m-${Date.now().toString(36)}`;
}

function createEmptyTournament(): IngestedTournamentRecord {
  const id = newTournamentId();
  return {
    id,
    name: "Torneo mock",
    shortName: "Mock",
    subtitle: "Ingestión local (sin backend)",
    categoryId: "futsal",
    categoryLabel: "Futsal",
    region: "CABA",
    statusLabel: "En curso",
    phaseLabel: "Fecha 1",
    featured: false,
    teams: [],
    matches: [],
    results: {},
  };
}

function createMatch(tournamentId: string): Match {
  return {
    id: newMatchId(),
    tournamentId,
    homeTeam: "Local",
    awayTeam: "Visitante",
    startsAt: new Date().toISOString(),
  };
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(s: string): string {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

const inputClass =
  "w-full rounded-lg border border-app-border bg-app-surface px-2.5 py-1.5 text-[13px] text-app-text shadow-[0_1px_0_rgba(15,23,42,0.04)] outline-none placeholder:text-app-muted/60 focus:border-app-primary focus:ring-2 focus:ring-app-primary/20";

export function MockIngestionClient() {
  const [storage, setStorage] = useState<IngestionStorage>(DEFAULT_INGESTION);
  /** User-picked row; falls back to first tournament when invalid. */
  const [preferredSelectedId, setPreferredSelectedId] = useState<string | null>(
    null,
  );
  const [teamDraft, setTeamDraft] = useState("");
  const [saveHint, setSaveHint] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setStorage(loadIngestionStorage());
    });
  }, []);

  const selectedId = useMemo(() => {
    const list = storage.tournaments;
    if (list.length === 0) return null;
    if (
      preferredSelectedId &&
      list.some((t) => t.id === preferredSelectedId)
    ) {
      return preferredSelectedId;
    }
    return list[0].id;
  }, [storage.tournaments, preferredSelectedId]);

  const selected = useMemo(
    () => storage.tournaments.find((t) => t.id === selectedId) ?? null,
    [storage.tournaments, selectedId],
  );

  const updateTournament = useCallback(
    (id: string, fn: (t: IngestedTournamentRecord) => IngestedTournamentRecord) => {
      setStorage((prev) => ({
        tournaments: prev.tournaments.map((t) =>
          t.id === id ? fn(t) : t,
        ),
      }));
      setSaveHint(null);
    },
    [],
  );

  const persist = useCallback(() => {
    saveIngestionStorage(storage);
    setSaveHint("Guardado en localStorage.");
    window.setTimeout(() => setSaveHint(null), 2500);
  }, [storage]);

  const addTournament = useCallback(() => {
    const t = createEmptyTournament();
    setStorage((prev) => ({ tournaments: [t, ...prev.tournaments] }));
    setPreferredSelectedId(t.id);
    setSaveHint(null);
  }, []);

  const removeSelected = useCallback(() => {
    if (!selectedId) return;
    setStorage((prev) => ({
      tournaments: prev.tournaments.filter((x) => x.id !== selectedId),
    }));
    setPreferredSelectedId(null);
    setSaveHint(null);
  }, [selectedId]);

  const clearAll = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Borrar todos los torneos mock del almacenamiento local?")
    ) {
      return;
    }
    const empty: IngestionStorage = { tournaments: [] };
    setStorage(empty);
    saveIngestionStorage(empty);
    setPreferredSelectedId(null);
    setSaveHint("Lista vaciada.");
  }, []);

  const addTeam = useCallback(() => {
    if (!selected) return;
    const name = teamDraft.trim();
    if (!name) return;
    updateTournament(selected.id, (t) => ({
      ...t,
      teams: t.teams.includes(name) ? t.teams : [...t.teams, name],
    }));
    setTeamDraft("");
  }, [selected, teamDraft, updateTournament]);

  const removeTeam = useCallback(
    (name: string) => {
      if (!selected) return;
      updateTournament(selected.id, (t) => ({
        ...t,
        teams: t.teams.filter((x) => x !== name),
      }));
    },
    [selected, updateTournament],
  );

  const addMatch = useCallback(() => {
    if (!selected) return;
    updateTournament(selected.id, (t) => ({
      ...t,
      matches: [...t.matches, createMatch(t.id)],
    }));
  }, [selected, updateTournament]);

  const updateMatch = useCallback(
    (matchId: string, patch: Partial<Match>) => {
      if (!selected) return;
      updateTournament(selected.id, (t) => ({
        ...t,
        matches: t.matches.map((m) =>
          m.id === matchId ? { ...m, ...patch } : m,
        ),
      }));
    },
    [selected, updateTournament],
  );

  const removeMatch = useCallback(
    (matchId: string) => {
      if (!selected) return;
      updateTournament(selected.id, (t) => {
        const nextResults = { ...t.results };
        delete nextResults[matchId];
        return {
          ...t,
          matches: t.matches.filter((m) => m.id !== matchId),
          results: nextResults,
        };
      });
    },
    [selected, updateTournament],
  );

  const setResult = useCallback(
    (matchId: string, homeStr: string, awayStr: string) => {
      if (!selected) return;
      const ht = homeStr.trim();
      const at = awayStr.trim();
      updateTournament(selected.id, (t) => {
        const next = { ...t.results };
        if (ht === "" || at === "") {
          delete next[matchId];
          return { ...t, results: next };
        }
        const home = parseInt(ht, 10);
        const away = parseInt(at, 10);
        if (Number.isNaN(home) || Number.isNaN(away)) {
          delete next[matchId];
        } else {
          next[matchId] = { home, away };
        }
        return { ...t, results: next };
      });
    },
    [selected, updateTournament],
  );

  return (
    <div className="pb-8">
      <header className="border-b border-app-border-subtle pb-3">
        <Link
          href="/torneos"
          className="text-[12px] font-semibold text-app-primary hover:underline"
        >
          ← Torneos
        </Link>
        <h1 className="mt-2 text-[18px] font-bold tracking-tight text-app-text">
          Mock · ingesta de torneos
        </h1>
        <p className="mt-1 max-w-xl text-[12px] leading-snug text-app-muted">
          Herramienta interna: creá torneos de prueba y persistí en{" "}
          <code className="rounded bg-app-bg px-1 py-0.5 text-[11px]">
            localStorage
          </code>
          . Los datos se mezclan con los mocks del resto de la app.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addTournament}
            className="rounded-lg border border-app-border bg-app-surface px-3 py-1.5 text-[12px] font-semibold text-app-text shadow-[0_1px_0_rgba(15,23,42,0.04)] active:scale-[0.99]"
          >
            + Torneo mock
          </button>
          <button
            type="button"
            onClick={persist}
            className="rounded-lg border border-app-primary/40 bg-blue-50/90 px-3 py-1.5 text-[12px] font-semibold text-app-primary active:scale-[0.99]"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg border border-app-border bg-app-bg px-3 py-1.5 text-[12px] font-semibold text-app-muted active:scale-[0.99]"
          >
            Vaciar todo
          </button>
          {saveHint ? (
            <span className="text-[11px] text-emerald-700">{saveHint}</span>
          ) : null}
        </div>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-app-border bg-app-surface p-2 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
          <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-app-muted">
            Torneos ({storage.tournaments.length})
          </p>
          <ul className="max-h-[40vh] space-y-1 overflow-y-auto lg:max-h-none">
            {storage.tournaments.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setPreferredSelectedId(t.id)}
                  className={cn(
                    "w-full rounded-md px-2 py-1.5 text-left text-[12px] font-medium transition",
                    t.id === selectedId
                      ? "bg-blue-50 text-app-primary ring-1 ring-app-primary/25"
                      : "text-app-text hover:bg-app-bg",
                  )}
                >
                  <span className="block truncate">{t.name}</span>
                  <span className="block truncate text-[10px] font-normal text-app-muted">
                    {t.id}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {selected ? (
            <button
              type="button"
              onClick={removeSelected}
              className="mt-2 w-full rounded-md border border-red-200 bg-red-50/80 py-1.5 text-[11px] font-semibold text-red-900 active:scale-[0.99]"
            >
              Eliminar seleccionado
            </button>
          ) : null}
        </aside>

        <main className="min-w-0 space-y-4">
          {!selected ? (
            <p className="rounded-lg border border-dashed border-app-border bg-app-surface px-3 py-4 text-[13px] text-app-muted">
              No hay torneos mock. Creá uno con &quot;Torneo mock&quot; y
              guardá.
            </p>
          ) : (
            <>
              <section className="rounded-lg border border-app-border bg-app-surface p-3 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                <h2 className="text-[12px] font-bold uppercase tracking-wide text-app-muted">
                  Metadatos
                </h2>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="block text-[11px] font-medium text-app-text">
                    Nombre
                    <input
                      className={cn(inputClass, "mt-0.5")}
                      value={selected.name}
                      onChange={(e) =>
                        updateTournament(selected.id, (t) => ({
                          ...t,
                          name: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="block text-[11px] font-medium text-app-text">
                    Nombre corto
                    <input
                      className={cn(inputClass, "mt-0.5")}
                      value={selected.shortName}
                      onChange={(e) =>
                        updateTournament(selected.id, (t) => ({
                          ...t,
                          shortName: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="col-span-full block text-[11px] font-medium text-app-text">
                    Subtítulo
                    <input
                      className={cn(inputClass, "mt-0.5")}
                      value={selected.subtitle}
                      onChange={(e) =>
                        updateTournament(selected.id, (t) => ({
                          ...t,
                          subtitle: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="block text-[11px] font-medium text-app-text">
                    Categoría
                    <select
                      className={cn(inputClass, "mt-0.5")}
                      value={selected.categoryId}
                      onChange={(e) => {
                        const id = e.target
                          .value as Exclude<TorneoCategoryFilterId, "todos">;
                        const label =
                          CATEGORY_OPTIONS.find((c) => c.id === id)?.label ??
                          selected.categoryLabel;
                        updateTournament(selected.id, (t) => ({
                          ...t,
                          categoryId: id,
                          categoryLabel: label,
                        }));
                      }}
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-[11px] font-medium text-app-text">
                    Región / zona
                    <input
                      className={cn(inputClass, "mt-0.5")}
                      value={selected.region}
                      onChange={(e) =>
                        updateTournament(selected.id, (t) => ({
                          ...t,
                          region: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="block text-[11px] font-medium text-app-text">
                    Estado (etiqueta)
                    <input
                      className={cn(inputClass, "mt-0.5")}
                      value={selected.statusLabel}
                      onChange={(e) =>
                        updateTournament(selected.id, (t) => ({
                          ...t,
                          statusLabel: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="block text-[11px] font-medium text-app-text">
                    Fase (etiqueta)
                    <input
                      className={cn(inputClass, "mt-0.5")}
                      value={selected.phaseLabel}
                      onChange={(e) =>
                        updateTournament(selected.id, (t) => ({
                          ...t,
                          phaseLabel: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="flex items-center gap-2 text-[12px] font-medium text-app-text sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={selected.featured}
                      onChange={(e) =>
                        updateTournament(selected.id, (t) => ({
                          ...t,
                          featured: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-app-border"
                    />
                    Destacado en listados
                  </label>
                  <label className="col-span-full block text-[10px] text-app-muted">
                    ID fijo (solo lectura)
                    <input
                      className={cn(inputClass, "mt-0.5 opacity-70")}
                      readOnly
                      value={selected.id}
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-lg border border-app-border bg-app-surface p-3 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                <h2 className="text-[12px] font-bold uppercase tracking-wide text-app-muted">
                  Equipos (semilla)
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    className={cn(inputClass, "min-w-[160px] flex-1")}
                    placeholder="Nombre del equipo"
                    value={teamDraft}
                    onChange={(e) => setTeamDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTeam();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addTeam}
                    className="rounded-lg border border-app-border bg-app-bg px-3 py-1.5 text-[12px] font-semibold text-app-text"
                  >
                    Agregar
                  </button>
                </div>
                {selected.teams.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {selected.teams.map((name) => (
                      <li
                        key={name}
                        className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-bg px-2 py-0.5 text-[11px] font-semibold text-app-text"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => removeTeam(name)}
                          className="text-app-muted hover:text-red-700"
                          aria-label={`Quitar ${name}`}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[11px] text-app-muted">
                    Opcional: lista para referencia; los partidos pueden usar
                    otros nombres.
                  </p>
                )}
              </section>

              <section className="rounded-lg border border-app-border bg-app-surface p-3 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-[12px] font-bold uppercase tracking-wide text-app-muted">
                    Partidos
                  </h2>
                  <button
                    type="button"
                    onClick={addMatch}
                    className="rounded-lg border border-app-border bg-app-bg px-2.5 py-1 text-[11px] font-semibold text-app-text"
                  >
                    + Partido
                  </button>
                </div>
                {selected.matches.length === 0 ? (
                  <p className="mt-2 text-[11px] text-app-muted">
                    Sin partidos. Agregá al menos uno para usar el torneo en
                    prodes.
                  </p>
                ) : (
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b border-app-border-subtle text-left text-app-muted">
                          <th className="py-1 pr-2 font-semibold">ID</th>
                          <th className="py-1 pr-2 font-semibold">Local</th>
                          <th className="py-1 pr-2 font-semibold">Visitante</th>
                          <th className="py-1 pr-2 font-semibold">Inicio</th>
                          <th className="py-1 font-semibold" />
                        </tr>
                      </thead>
                      <tbody>
                        {selected.matches.map((m) => (
                          <tr
                            key={m.id}
                            className="border-b border-app-border-subtle/80"
                          >
                            <td className="py-1 pr-2 font-mono text-[10px] text-app-muted">
                              {m.id}
                            </td>
                            <td className="py-1 pr-2">
                              <input
                                className={inputClass}
                                value={m.homeTeam}
                                onChange={(e) =>
                                  updateMatch(m.id, {
                                    homeTeam: e.target.value,
                                  })
                                }
                              />
                            </td>
                            <td className="py-1 pr-2">
                              <input
                                className={inputClass}
                                value={m.awayTeam}
                                onChange={(e) =>
                                  updateMatch(m.id, {
                                    awayTeam: e.target.value,
                                  })
                                }
                              />
                            </td>
                            <td className="py-1 pr-2">
                              <input
                                type="datetime-local"
                                className={inputClass}
                                value={toDatetimeLocalValue(m.startsAt)}
                                onChange={(e) =>
                                  updateMatch(m.id, {
                                    startsAt: fromDatetimeLocalValue(
                                      e.target.value,
                                    ),
                                  })
                                }
                              />
                            </td>
                            <td className="py-1 text-right">
                              <button
                                type="button"
                                onClick={() => removeMatch(m.id)}
                                className="text-[11px] font-semibold text-red-800 hover:underline"
                              >
                                Quitar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-app-border bg-app-surface p-3 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                <h2 className="text-[12px] font-bold uppercase tracking-wide text-app-muted">
                  Resultados (marcadores finales)
                </h2>
                <p className="mt-1 text-[11px] text-app-muted">
                  Dejá vacío si el partido aún no tiene resultado. Esto alimenta
                  el overlay de mocks y el scoring.
                </p>
                {selected.matches.length === 0 ? null : (
                  <ul className="mt-2 space-y-2">
                    {selected.matches.map((m) => {
                      const r = selected.results[m.id];
                      return (
                        <li
                          key={m.id}
                          className="flex flex-wrap items-center gap-2 rounded-md border border-app-border-subtle bg-app-bg/60 px-2 py-1.5"
                        >
                          <span className="flex min-w-[120px] flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-medium text-app-text">
                            <span className="inline-flex items-center gap-1">
                              <TeamCrest teamName={m.homeTeam} size={22} />
                              {m.homeTeam}
                            </span>
                            <span className="text-app-muted">vs</span>
                            <span className="inline-flex items-center gap-1">
                              {m.awayTeam}
                              <TeamCrest teamName={m.awayTeam} size={22} />
                            </span>
                          </span>
                          <span className="font-mono text-[10px] text-app-muted">
                            {m.id}
                          </span>
                          <label className="flex items-center gap-1 text-[11px]">
                            L
                            <input
                              type="number"
                              min={0}
                              className={cn(inputClass, "w-14 py-1")}
                              value={r ? String(r.home) : ""}
                              onChange={(e) =>
                                setResult(m.id, e.target.value, String(r?.away ?? ""))
                              }
                            />
                          </label>
                          <label className="flex items-center gap-1 text-[11px]">
                            V
                            <input
                              type="number"
                              min={0}
                              className={cn(inputClass, "w-14 py-1")}
                              value={r ? String(r.away) : ""}
                              onChange={(e) =>
                                setResult(m.id, String(r?.home ?? ""), e.target.value)
                              }
                            />
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <p className="text-[11px] text-app-muted">
                Vista pública:{" "}
                <Link
                  href={`/torneos/${selected.id}`}
                  className="font-semibold text-app-primary hover:underline"
                >
                  /torneos/{selected.id}
                </Link>
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
