"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  FilterX,
  LogIn,
  Plus,
  UserMinus,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { TeamCrest } from "@/components/team/TeamCrest";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Match, TorneoCategoryFilterId, TournamentCatalogueEntry } from "@/domain";
import { useIngestionTick } from "@/hooks/useIngestionTick";
import { getBrowseCategoryForTournament } from "@/lib/torneos-browse-filter";
import {
  getTorneoBrowseItems,
  TORNEOS_CATEGORY_CHIPS,
} from "@/mocks/services/torneos-browse.mock";
import {
  getTournamentCatalogue,
  getTournamentCatalogueEntryById,
} from "@/mocks/services/tournaments-catalogue.mock";
import { findProdeByInviteCode } from "@/state/invite-code";
import { useAppState } from "@/state/app-state";
import { formatMatchKickoffFull } from "@/lib/datetime";
import {
  type MatchDatePreset,
  matchPassesDatePreset,
  matchPassesTeamQuery,
} from "@/lib/match-filters";
import { normalizeSearchKey } from "@/lib/string-normalize";
import {
  btnPrimaryFull,
  cardSurface,
  pageEyebrow,
  pageHeader,
  pageTitle,
} from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

function uniqueTeamsFromMatches(matches: Match[]): string[] {
  const s = new Set<string>();
  for (const m of matches) {
    s.add(m.homeTeam);
    s.add(m.awayTeam);
  }
  return [...s].sort((a, b) => a.localeCompare(b, "es"));
}

type Visibility = "public" | "private";

export function CrearProdeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createProde, state } = useAppState();
  const ingestionTick = useIngestionTick();
  const catalogue = useMemo(() => {
    void ingestionTick;
    return getTournamentCatalogue();
  }, [ingestionTick]);
  const browseItems = useMemo(() => {
    void ingestionTick;
    return getTorneoBrowseItems();
  }, [ingestionTick]);
  const preselectTorneo = searchParams.get("torneo");
  const inviteFromQuery =
    searchParams.get("code") ?? searchParams.get("invite") ?? "";
  const didPreselect = useRef(false);
  const didPrefillInvite = useRef(false);

  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  const [tournamentIds, setTournamentIds] = useState<string[]>([]);
  const [matchIds, setMatchIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerCategory, setPickerCategory] =
    useState<TorneoCategoryFilterId>("todos");
  /** Torneo id → mostrar lista de partidos para editar */
  const [editOpen, setEditOpen] = useState<Record<string, boolean>>({});
  /** Torneo id → mostrar quitar por equipo */
  const [teamsOpen, setTeamsOpen] = useState<Record<string, boolean>>({});

  const availableToAdd = useMemo(
    () => catalogue.filter((t) => !tournamentIds.includes(t.id)),
    [catalogue, tournamentIds],
  );

  const availableToAddFiltered = useMemo(() => {
    return availableToAdd.filter((t) => {
      const cat = getBrowseCategoryForTournament(t.id, browseItems);
      if (pickerCategory !== "todos") {
        if (cat === null || cat !== pickerCategory) return false;
      }
      const q = pickerQuery.trim();
      if (!q) return true;
      const n = normalizeSearchKey(q);
      return (
        normalizeSearchKey(t.shortName).includes(n) ||
        normalizeSearchKey(t.name).includes(n)
      );
    });
  }, [availableToAdd, browseItems, pickerCategory, pickerQuery]);

  const selectedGroups = useMemo(() => {
    void ingestionTick;
    return tournamentIds
      .map((id) => getTournamentCatalogueEntryById(id))
      .filter(Boolean)
      .map((t) => ({
        tournament: t!,
        matches: t!.matches,
      }));
  }, [tournamentIds, ingestionTick]);

  const selectedCount = matchIds.length;
  const tournamentCount = tournamentIds.length;

  const canSubmit = name.trim().length >= 2 && selectedCount >= 1;

  useEffect(() => {
    if (didPrefillInvite.current || !inviteFromQuery.trim()) return;
    didPrefillInvite.current = true;
    queueMicrotask(() => setJoinCode(inviteFromQuery.trim()));
  }, [inviteFromQuery]);

  useEffect(() => {
    if (didPreselect.current || !preselectTorneo) return;
    const t = getTournamentCatalogueEntryById(preselectTorneo);
    if (!t) return;
    didPreselect.current = true;
    queueMicrotask(() => {
      setTournamentIds((prev) => {
        if (prev.includes(preselectTorneo)) return prev;
        return [...prev, preselectTorneo];
      });
      setMatchIds((prev) => {
        const next = new Set(prev);
        for (const m of t.matches) next.add(m.id);
        return [...next];
      });
    });
  }, [preselectTorneo]);

  const addTournament = (id: string) => {
    const t = getTournamentCatalogueEntryById(id);
    if (!t) return;
    setTournamentIds((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
    setMatchIds((prev) => {
      const next = new Set(prev);
      for (const m of t.matches) next.add(m.id);
      return [...next];
    });
    setPickerOpen(false);
    setPickerQuery("");
    setPickerCategory("todos");
  };

  const removeTournament = (id: string) => {
    const t = getTournamentCatalogueEntryById(id);
    const drop = new Set(t?.matches.map((m) => m.id) ?? []);
    setTournamentIds((prev) => prev.filter((x) => x !== id));
    setMatchIds((prev) => prev.filter((mid) => !drop.has(mid)));
    setEditOpen((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setTeamsOpen((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const toggleMatch = (id: string) => {
    setMatchIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const removeMatchesByTeam = useCallback(
    (tournamentId: string, teamName: string) => {
      const t = getTournamentCatalogueEntryById(tournamentId);
      if (!t) return;
      const drop = new Set(
        t.matches
          .filter(
            (m) => m.homeTeam === teamName || m.awayTeam === teamName,
          )
          .map((m) => m.id),
      );
      setMatchIds((prev) => prev.filter((mid) => !drop.has(mid)));
    },
    [],
  );

  const restoreAllMatchesInTournament = (tournamentId: string) => {
    const t = getTournamentCatalogueEntryById(tournamentId);
    if (!t) return;
    setMatchIds((prev) => {
      const next = new Set(prev);
      for (const m of t.matches) next.add(m.id);
      return [...next];
    });
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const id = createProde({
      name: name.trim(),
      visibility,
      tournamentIds,
      matchIds,
    });
    router.push(`/prodes/${id}`);
  };

  const handleJoinByCode = () => {
    setJoinError(null);
    const found = findProdeByInviteCode(state.prodes, joinCode);
    if (!found) {
      setJoinError(
        "No encontramos ese código. Tiene que ser PMX- y 6 caracteres (demo: solo prodes en este dispositivo).",
      );
      return;
    }
    router.push(`/prodes/${encodeURIComponent(found.id)}`);
  };

  const toggleEdit = (tid: string) => {
    setEditOpen((prev) => ({ ...prev, [tid]: !prev[tid] }));
  };

  const toggleTeams = (tid: string) => {
    setTeamsOpen((prev) => ({ ...prev, [tid]: !prev[tid] }));
  };

  return (
    <div className="pb-2">
      <header className={pageHeader}>
        <p className={pageEyebrow}>ProdeMix</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Prode propio</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-app-muted">
          Combiná torneos y partidos para tu grupo. El foco principal de la app
          son los{" "}
          <Link href="/torneos" className="font-semibold text-app-primary hover:underline">
            pools públicos por fecha
          </Link>
          .
        </p>
      </header>

      <div className="mt-3 rounded-lg border border-app-border bg-app-bg/80 px-3 py-2.5">
        <p className="text-[11px] leading-snug text-app-muted">
          <span className="font-semibold text-app-text">
            Buscás pozo y ranking:
          </span>{" "}
          en Torneos abrís una fecha y un pool público. Esto es{" "}
          <span className="font-medium text-app-text">opcional</span> para
          grupos privados.
        </p>
      </div>

      <section className={cn("mt-4 px-2.5 py-2.5", cardSurface)}>
        <p className="text-[10px] font-bold uppercase tracking-wide text-app-muted">
          Unirte con código
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-app-muted">
          Si te pasaron un código, entrá al mismo prode (datos locales en este
          navegador).
        </p>
        <div className="mt-2 flex gap-1.5">
          <input
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="PMX-XXXXXX"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value);
              setJoinError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleJoinByCode();
              }
            }}
            className="min-w-0 flex-1 rounded-lg border border-app-border bg-app-bg px-2.5 py-2 font-mono text-[13px] font-semibold tracking-wide text-app-text shadow-[0_1px_0_rgba(15,23,42,0.04)] outline-none placeholder:font-sans placeholder:text-[12px] placeholder:font-normal placeholder:tracking-normal placeholder:text-app-muted/70 focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
          />
          <button
            type="button"
            onClick={handleJoinByCode}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-app-primary/35 bg-blue-50/90 px-3 py-2 text-[12px] font-semibold text-app-primary shadow-[0_1px_0_rgba(15,23,42,0.04)] active:scale-[0.99]"
          >
            <LogIn className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Unirte
          </button>
        </div>
        {joinError ? (
          <p className="mt-1.5 text-[11px] leading-snug text-red-800">
            {joinError}
          </p>
        ) : null}
      </section>

      <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-wide text-app-muted">
        o creá uno nuevo
      </p>

      <form onSubmit={handleCreate} className="mt-3 space-y-4">
          <section className="space-y-1.5">
            <SectionHeader title="Torneos en el prode" />
            {tournamentIds.length === 0 ? (
              <p className="rounded-lg border border-dashed border-app-border bg-app-surface px-3 py-3 text-[11px] leading-snug text-app-muted">
                Agregá un torneo: se incluyen{" "}
                <span className="font-semibold text-app-text">
                  todos los partidos
                </span>{" "}
                automáticamente. Después podés editar o quitar por equipo.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tournamentIds.map((id) => {
                  const t = getTournamentCatalogueEntryById(id);
                  if (!t) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex max-w-full items-center gap-1 rounded-full border border-app-primary/35 bg-blue-50/90 py-1 pl-2.5 pr-1 text-[11px] font-semibold text-app-primary"
                    >
                      <span className="truncate">{t.shortName}</span>
                      <button
                        type="button"
                        onClick={() => removeTournament(id)}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-app-primary transition hover:bg-blue-100/80 active:scale-[0.95]"
                        aria-label={`Quitar ${t.shortName}`}
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() => setPickerOpen((o) => !o)}
                disabled={availableToAdd.length === 0}
                className={cn(
                  "flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-app-border bg-app-surface text-[13px] font-semibold text-app-text shadow-[0_1px_0_rgba(15,23,42,0.04)] transition active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-45",
                  pickerOpen && "border-app-primary/40 bg-blue-50/50",
                )}
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                Agregar torneo
                {pickerOpen ? (
                  <ChevronUp className="h-4 w-4" strokeWidth={2} />
                ) : (
                  <ChevronDown className="h-4 w-4" strokeWidth={2} />
                )}
              </button>

              {pickerOpen && availableToAdd.length > 0 ? (
                <div className="mt-1.5 space-y-1.5">
                  <div className="rounded-lg border border-app-border bg-app-bg/50 px-2 py-2 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
                    <input
                      type="search"
                      value={pickerQuery}
                      onChange={(e) => setPickerQuery(e.target.value)}
                      placeholder="Buscar torneo…"
                      autoComplete="off"
                      enterKeyHint="search"
                      className="h-9 w-full rounded-md border border-app-border bg-app-surface px-2.5 text-[12px] font-medium text-app-text outline-none placeholder:text-app-muted/70 focus:border-app-primary focus:ring-1 focus:ring-app-primary/20"
                    />
                    <div
                      className="mt-1.5 flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      role="tablist"
                      aria-label="Categoría del torneo"
                    >
                      {TORNEOS_CATEGORY_CHIPS.map((c) => {
                        const active = pickerCategory === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setPickerCategory(c.id)}
                            className={cn(
                              "shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold transition active:scale-[0.98]",
                              active
                                ? "border-app-primary bg-app-primary text-white"
                                : "border-app-border bg-app-surface text-app-text",
                            )}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {availableToAddFiltered.length === 0 ? (
                    <EmptyState
                      variant="minimal"
                      layout="horizontal"
                      icon={FilterX}
                      title="Ningún torneo con esos criterios"
                      description="Cambiá la categoría o limpiá la búsqueda para ver el listado completo."
                    />
                  ) : (
                    <ul
                      className="overflow-hidden rounded-lg border border-app-border bg-app-surface shadow-[0_1px_0_rgba(15,23,42,0.04)]"
                      role="listbox"
                    >
                      {availableToAddFiltered.map((t) => (
                        <li
                          key={t.id}
                          className="border-b border-app-border-subtle last:border-b-0"
                        >
                          <button
                            type="button"
                            onClick={() => addTournament(t.id)}
                            className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition hover:bg-app-bg active:bg-app-border-subtle"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block text-[13px] font-semibold text-app-text">
                                {t.shortName}
                              </span>
                              <span className="mt-0.5 block text-[10px] leading-snug text-app-muted">
                                {t.name} · {t.matches.length}{" "}
                                {t.matches.length === 1
                                  ? "partido"
                                  : "partidos"}
                              </span>
                            </span>
                            <Plus
                              className="mt-0.5 h-4 w-4 shrink-0 text-app-primary"
                              strokeWidth={2}
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              {availableToAdd.length === 0 && tournamentIds.length > 0 ? (
                <p className="mt-1.5 text-[10px] text-app-muted">
                  Ya incluiste todos los torneos disponibles en esta demo.
                </p>
              ) : null}
            </div>
          </section>

          <section className="space-y-1.5">
            <SectionHeader
              title={
                <>
                  Partidos
                  {selectedCount > 0 ? (
                    <span className="ml-1 font-normal text-[11px] text-app-muted">
                      ({selectedCount})
                    </span>
                  ) : null}
                </>
              }
            />

            {selectedGroups.length === 0 ? (
              <p className="rounded-lg border border-app-border bg-app-bg/50 px-3 py-3 text-[11px] text-app-muted">
                Cuando agregues un torneo, vas a ver acá el detalle y las
                opciones para editar partidos o quitar por equipo.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedGroups.map(({ tournament, matches }) => (
                  <TournamentMatchesBlock
                    key={tournament.id}
                    tournament={tournament}
                    matches={matches}
                    matchIds={matchIds}
                    editOpen={!!editOpen[tournament.id]}
                    teamsOpen={!!teamsOpen[tournament.id]}
                    onToggleEdit={() => toggleEdit(tournament.id)}
                    onToggleTeams={() => toggleTeams(tournament.id)}
                    onToggleMatch={toggleMatch}
                    onRemoveByTeam={(team) =>
                      removeMatchesByTeam(tournament.id, team)
                    }
                    onRestoreAll={() =>
                      restoreAllMatchesInTournament(tournament.id)
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <div className="rounded-[10px] border border-app-border bg-app-surface px-2.5 py-2 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <p className="text-center text-[11px] font-medium text-app-text">
              <span className="font-bold tabular-nums text-app-primary">
                {selectedCount}
              </span>{" "}
              {selectedCount === 1 ? "partido" : "partidos"}
              {tournamentCount > 0 ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-bold tabular-nums">
                    {tournamentCount}
                  </span>{" "}
                  {tournamentCount === 1 ? "torneo" : "torneos"}
                </>
              ) : null}
            </p>
          </div>

          <section className="space-y-2">
            <label className="block">
              <span className="text-[13px] font-semibold text-app-text">
                Nombre del prode
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Mix fin de semana"
                maxLength={48}
                className="mt-1.5 h-11 w-full rounded-lg border border-app-border bg-app-surface px-3 text-[14px] font-medium text-app-text shadow-[0_1px_0_rgba(15,23,42,0.04)] outline-none placeholder:text-app-muted/60 focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
                autoComplete="off"
              />
            </label>

            <div>
              <span className="text-[13px] font-semibold text-app-text">
                Visibilidad
              </span>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setVisibility("public")}
                  className={cn(
                    "h-10 rounded-lg border text-[13px] font-semibold transition active:scale-[0.99]",
                    visibility === "public"
                      ? "border-app-primary bg-app-primary text-white shadow-sm"
                      : "border-app-border bg-app-surface text-app-text shadow-[0_1px_0_rgba(15,23,42,0.04)]",
                  )}
                >
                  Público
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("private")}
                  className={cn(
                    "h-10 rounded-lg border text-[13px] font-semibold transition active:scale-[0.99]",
                    visibility === "private"
                      ? "border-app-primary bg-app-primary text-white shadow-sm"
                      : "border-app-border bg-app-surface text-app-text shadow-[0_1px_0_rgba(15,23,42,0.04)]",
                  )}
                >
                  Privado
                </button>
              </div>
              <p className="mt-1.5 text-[10px] leading-snug text-app-muted">
                Público: cualquiera puede unirse con el link. Privado: solo
                invitación.
              </p>
            </div>
          </section>

          <button
            type="submit"
            disabled={!canSubmit}
            className={btnPrimaryFull()}
          >
            Crear prode
          </button>

          {!canSubmit ? (
            <p className="text-center text-[10px] leading-snug text-app-muted">
              Nombre de 2+ letras y al menos un partido para crear.
            </p>
          ) : null}
        </form>
    </div>
  );
}

function TournamentMatchesBlock({
  tournament,
  matches,
  matchIds,
  editOpen,
  teamsOpen,
  onToggleEdit,
  onToggleTeams,
  onToggleMatch,
  onRemoveByTeam,
  onRestoreAll,
}: {
  tournament: TournamentCatalogueEntry;
  matches: Match[];
  matchIds: string[];
  editOpen: boolean;
  teamsOpen: boolean;
  onToggleEdit: () => void;
  onToggleTeams: () => void;
  onToggleMatch: (id: string) => void;
  onRemoveByTeam: (team: string) => void;
  onRestoreAll: () => void;
}) {
  const [teamQuery, setTeamQuery] = useState("");
  const [datePreset, setDatePreset] = useState<MatchDatePreset>("all");

  const includedCount = useMemo(
    () => matches.filter((m) => matchIds.includes(m.id)).length,
    [matches, matchIds],
  );
  const total = matches.length;
  const allIn = includedCount === total && total > 0;
  const noneIn = includedCount === 0 && total > 0;
  const teams = useMemo(() => uniqueTeamsFromMatches(matches), [matches]);

  const visibleMatches = useMemo(() => {
    return matches.filter(
      (m) =>
        matchPassesTeamQuery(m, teamQuery) &&
        matchPassesDatePreset(m, datePreset),
    );
  }, [matches, teamQuery, datePreset]);

  const teamsFiltered = useMemo(() => {
    if (!teamQuery.trim()) return teams;
    const n = normalizeSearchKey(teamQuery);
    return teams.filter((team) => normalizeSearchKey(team).includes(n));
  }, [teams, teamQuery]);

  const filtersActive =
    editOpen || teamsOpen ? (
      <div className="mt-2 space-y-1.5">
        <input
          type="search"
          value={teamQuery}
          onChange={(e) => setTeamQuery(e.target.value)}
          placeholder="Buscar equipo…"
          autoComplete="off"
          className="h-9 w-full rounded-lg border border-app-border bg-app-bg px-2.5 text-[11px] font-medium text-app-text outline-none placeholder:text-app-muted/70 focus:border-app-primary focus:ring-1 focus:ring-app-primary/20"
        />
        {editOpen ? (
          <div
            className="flex flex-wrap gap-1"
            role="group"
            aria-label="Fecha del partido"
          >
            {(
              [
                { id: "all" as const, label: "Todos" },
                { id: "today" as const, label: "Hoy" },
                { id: "week" as const, label: "7 días" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setDatePreset(id)}
                className={cn(
                  "rounded-full border px-2 py-1 text-[10px] font-semibold transition active:scale-[0.98]",
                  datePreset === id
                    ? "border-app-primary bg-blue-50 text-app-primary"
                    : "border-app-border bg-app-surface text-app-text",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    ) : null;

  return (
    <div className="rounded-[10px] border border-app-border bg-app-surface p-2 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold leading-tight text-app-text">
            {tournament.shortName}
          </p>
          <p className="mt-0.5 text-[10px] leading-snug text-app-muted">
            {allIn ? (
              <>
                Todos los partidos del torneo ·{" "}
                <span className="font-semibold tabular-nums text-app-text">
                  {total}
                </span>
              </>
            ) : noneIn ? (
              <span className="text-amber-800">
                Ningún partido de este torneo en el prode.
              </span>
            ) : (
              <>
                <span className="font-semibold tabular-nums text-app-text">
                  {includedCount}
                </span>
                {" de "}
                <span className="tabular-nums">{total}</span> partidos
                incluidos
              </>
            )}
          </p>
        </div>
      </div>

      {noneIn ? (
        <button
          type="button"
          onClick={onRestoreAll}
          className="mt-2 w-full rounded-lg border border-app-primary/35 bg-blue-50/80 py-2 text-[11px] font-semibold text-app-primary transition hover:bg-blue-50 active:scale-[0.99]"
        >
          Incluir de nuevo todos los partidos del torneo
        </button>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={onToggleEdit}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-[11px] font-semibold transition active:scale-[0.99] sm:flex-none sm:px-3",
            editOpen
              ? "border-app-primary/45 bg-blue-50 text-app-primary"
              : "border-app-border bg-app-bg text-app-text",
          )}
        >
          Editar partidos
          {editOpen ? (
            <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
          )}
        </button>
        <button
          type="button"
          onClick={onToggleTeams}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-[11px] font-semibold transition active:scale-[0.99] sm:flex-none sm:px-3",
            teamsOpen
              ? "border-app-primary/45 bg-blue-50 text-app-primary"
              : "border-app-border bg-app-bg text-app-text",
          )}
        >
          <UserMinus className="h-3.5 w-3.5" strokeWidth={2} />
          Quitar por equipo
          {teamsOpen ? (
            <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
          )}
        </button>
      </div>

      {filtersActive}

      {teamsOpen ? (
        <div className="mt-2 rounded-lg border border-app-border-subtle bg-app-bg/70 px-2 py-2">
          <p className="text-[10px] font-medium leading-snug text-app-muted">
            Sacá del prode todos los partidos donde juegue el equipo (local o
            visitante).
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {teamsFiltered.length === 0 ? (
              <p className="text-[10px] text-app-muted">
                Ningún equipo coincide con la búsqueda.
              </p>
            ) : (
              teamsFiltered.map((team) => (
                <button
                  key={team}
                  type="button"
                  onClick={() => onRemoveByTeam(team)}
                  className="max-w-full truncate rounded-full border border-app-border bg-app-surface px-2 py-1 text-[10px] font-semibold text-app-text shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-900 active:scale-[0.98]"
                >
                  Quitar {team}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      {editOpen ? (
        <div className="mt-2 border-t border-app-border-subtle pt-2">
          {visibleMatches.length === 0 ? (
            <p className="rounded-lg border border-dashed border-app-border bg-app-bg/50 px-2 py-3 text-center text-[11px] text-app-muted">
              Ningún partido con estos filtros. Probá otra fecha o limpiá la
              búsqueda.
            </p>
          ) : (
            <>
              {teamQuery.trim() || datePreset !== "all" ? (
                <p className="mb-1.5 text-[10px] text-app-muted">
                  Mostrando{" "}
                  <span className="font-semibold tabular-nums text-app-text">
                    {visibleMatches.length}
                  </span>{" "}
                  de {total}
                </p>
              ) : null}
              <ul className="space-y-1">
                {visibleMatches.map((m) => (
                  <MatchPickRow
                    key={m.id}
                    m={m}
                    selected={matchIds.includes(m.id)}
                    onToggle={() => onToggleMatch(m.id)}
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function MatchPickRow({
  m,
  selected,
  onToggle,
}: {
  m: Match;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left transition active:scale-[0.99]",
          selected
            ? "border-app-primary/50 bg-blue-50/70 ring-1 ring-app-primary/15"
            : "border-app-border bg-app-surface shadow-[0_1px_0_rgba(15,23,42,0.03)]",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
            selected
              ? "border-app-primary bg-app-primary text-white"
              : "border-app-border bg-app-surface",
          )}
        >
          {selected ? (
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] font-semibold leading-tight text-app-text">
            <span className="inline-flex min-w-0 items-center gap-1">
              <TeamCrest teamName={m.homeTeam} size={24} />
              <span className="truncate">{m.homeTeam}</span>
            </span>
            <span className="font-normal text-app-muted">vs</span>
            <span className="inline-flex min-w-0 items-center gap-1">
              <span className="truncate">{m.awayTeam}</span>
              <TeamCrest teamName={m.awayTeam} size={24} />
            </span>
          </span>
          <span className="mt-0.5 block text-[10px] tabular-nums text-app-muted">
            {formatMatchKickoffFull(m.startsAt)}
          </span>
        </span>
      </button>
    </li>
  );
}
