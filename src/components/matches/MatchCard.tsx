"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { Match, ScorePrediction } from "@/domain";
import { formatGoalsInput, parseGoalsInput } from "@/lib/score-input";
import { inferOutcome, outcomeLabelEs, type MatchOutcome } from "@/lib/scoring";
import { TeamCrest } from "@/components/team/TeamCrest";
import { formatMatchKickoffSplit } from "@/lib/datetime";
import { cardSurface, statLabel } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

type MatchCardProps = {
  match: Match;
  initialScore?: ScorePrediction | null;
  className?: string;
  /** Mock final score — when set, shows result + points. */
  finalResult?: { home: number; away: number } | null;
  pointsEarned?: 0 | 1 | 3 | null;
  /** Called when both goals are valid (persists prediction in MVP). */
  onPredictionCommit?: (score: { home: number; away: number }) => void;
  /** When true, score cannot be edited (e.g. match finalized). */
  predictionLocked?: boolean;
  /** Hide top tournament label row (e.g. on fecha pool screen where context is obvious). */
  hideTournamentLabel?: boolean;
  /** Slightly tighter padding for dense lists. */
  compact?: boolean;
  /** `outcome`: 1X2 (local / empate / visita), mapea a marcador mínimo compatible con el scoring. */
  predictionMode?: "score" | "outcome";
};

const STEP_MAX = 20;

function outcomePillClass(outcome: MatchOutcome): string {
  switch (outcome) {
    case "home":
      return "border-emerald-200/90 bg-emerald-50 text-emerald-950";
    case "away":
      return "border-sky-200/90 bg-sky-50 text-sky-950";
    default:
      return "border-slate-200/90 bg-slate-100 text-slate-900";
  }
}

const stepperBtn =
  "inline-flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-app-border bg-app-surface text-app-text shadow-card transition active:scale-[0.96]";

const stepperBtnCompact =
  "inline-flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-app-border bg-app-surface text-app-text shadow-card transition active:scale-[0.96]";

const scoreInputClass =
  "h-10 w-11 shrink-0 rounded-lg border border-app-border bg-app-surface text-center text-[15px] font-bold tabular-nums text-app-text shadow-card outline-none transition placeholder:text-app-muted/35 focus:border-app-primary focus:ring-2 focus:ring-app-primary/20";

const scoreInputClassCompact =
  "h-9 w-10 shrink-0 rounded-lg border border-app-border bg-app-surface text-center text-[14px] font-bold tabular-nums text-app-text shadow-card outline-none transition placeholder:text-app-muted/35 focus:border-app-primary focus:ring-2 focus:ring-app-primary/20";

function MatchCardScore({
  match,
  initialScore = null,
  className,
  finalResult = null,
  pointsEarned = null,
  onPredictionCommit,
  predictionLocked = false,
  hideTournamentLabel = false,
  compact = false,
}: MatchCardProps) {
  const baseId = useId();
  const homeFieldId = `${baseId}-home`;
  const awayFieldId = `${baseId}-away`;
  const lastCommitSig = useRef<string | null>(null);
  const onCommitRef = useRef(onPredictionCommit);

  useLayoutEffect(() => {
    onCommitRef.current = onPredictionCommit;
  }, [onPredictionCommit]);

  const [homeStr, setHomeStr] = useState(() =>
    initialScore ? formatGoalsInput(initialScore.home) : "",
  );
  const [awayStr, setAwayStr] = useState(() =>
    initialScore ? formatGoalsInput(initialScore.away) : "",
  );

  useEffect(() => {
    queueMicrotask(() => {
      if (initialScore) {
        setHomeStr(formatGoalsInput(initialScore.home));
        setAwayStr(formatGoalsInput(initialScore.away));
      } else {
        setHomeStr("");
        setAwayStr("");
      }
      lastCommitSig.current = null;
    });
  }, [initialScore, match.id]);

  const homeGoals = useMemo(() => parseGoalsInput(homeStr), [homeStr]);
  const awayGoals = useMemo(() => parseGoalsInput(awayStr), [awayStr]);

  useEffect(() => {
    if (predictionLocked) return;
    if (!onCommitRef.current) return;
    if (homeGoals === null || awayGoals === null) return;
    const sig = `${homeGoals}-${awayGoals}`;
    if (lastCommitSig.current === sig) return;
    lastCommitSig.current = sig;
    onCommitRef.current({ home: homeGoals, away: awayGoals });
  }, [homeGoals, awayGoals, predictionLocked]);

  const complete = homeGoals !== null && awayGoals !== null;

  const outcome = useMemo(() => {
    if (!complete || homeGoals === null || awayGoals === null) return null;
    return inferOutcome(homeGoals, awayGoals);
  }, [awayGoals, complete, homeGoals]);

  const outcomeLabel = outcome ? outcomeLabelEs(outcome) : null;

  const emptyHint = useMemo(() => {
    if (predictionLocked) return "Partido cerrado · marcador fijado";
    if (homeStr === "" && awayStr === "") return "Elegí goles o usá + / −";
    return "Completá ambos equipos";
  }, [awayStr, homeStr, predictionLocked]);

  const { date, time } = formatMatchKickoffSplit(match.startsAt);

  const bump = (side: "home" | "away", delta: number) => {
    if (predictionLocked) return;
    const raw = side === "home" ? homeStr : awayStr;
    const empty = raw.trim() === "";

    /** Sin valor aún: el primer + debe mostrar 0 (no 1). El − no cambia nada. */
    if (empty) {
      if (delta > 0) {
        const s = formatGoalsInput(0);
        if (side === "home") setHomeStr(s);
        else setAwayStr(s);
      }
      return;
    }

    const cur = parseGoalsInput(raw) ?? 0;
    const next = Math.min(STEP_MAX, Math.max(0, cur + delta));
    const s = formatGoalsInput(next);
    if (side === "home") setHomeStr(s);
    else setAwayStr(s);
  };

  const onHomeChange = (v: string) => {
    if (predictionLocked) return;
    setHomeStr(v.replace(/\D/g, "").slice(0, 2));
  };

  const onAwayChange = (v: string) => {
    if (predictionLocked) return;
    setAwayStr(v.replace(/\D/g, "").slice(0, 2));
  };

  const homeInvalid = homeStr !== "" && homeGoals === null;
  const awayInvalid = awayStr !== "" && awayGoals === null;

  return (
    <article
      className={cn(
        cardSurface,
        "transition-colors",
        complete
          ? "border-app-primary/35 ring-1 ring-app-primary/15"
          : "border-app-border",
        className,
      )}
    >
      <div
        className={cn(
          "border-b border-app-border-subtle bg-app-bg/60 px-2.5 py-1.5",
          hideTournamentLabel && "py-1.5",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {hideTournamentLabel ? null : (
              <p className={cn(statLabel, "leading-snug")}>
                {match.tournamentLabel ?? "—"}
              </p>
            )}
            {finalResult ? (
              <p
                className={cn(
                  "text-[10px] font-medium leading-snug text-app-sport",
                  !hideTournamentLabel && "mt-1",
                )}
              >
                Final: {finalResult.home}-{finalResult.away}
                {pointsEarned !== null && pointsEarned !== undefined ? (
                  <span className="ml-1 font-bold text-app-text">
                    · +{pointsEarned} pts
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right leading-none">
            <p className="text-[10px] font-medium capitalize text-app-muted">
              {date}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-app-text">
              {time}
            </p>
          </div>
        </div>
      </div>

      <div className={cn("px-2.5 pb-2 pt-2", compact && "px-2 pb-1.5 pt-1.5")}>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0">
          <div className="flex min-w-0 items-start gap-2">
            <TeamCrest teamName={match.homeTeam} size={compact ? 26 : 30} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-left text-[12px] font-semibold leading-tight text-app-text">
                {match.homeTeam}
              </p>
              <p className="mt-0.5 text-left text-[10px] font-semibold text-app-muted">
                Local
              </p>
            </div>
          </div>
          <div className="flex min-w-0 items-start justify-end gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-right text-[12px] font-semibold leading-tight text-app-text">
                {match.awayTeam}
              </p>
              <p className="mt-0.5 text-right text-[10px] font-semibold text-app-muted">
                Visita
              </p>
            </div>
            <TeamCrest teamName={match.awayTeam} size={compact ? 26 : 30} />
          </div>
        </div>

        <div
          className={cn(
            "mt-2 grid grid-cols-2 gap-x-2",
            compact && "mt-1.5",
            predictionLocked && "pointer-events-none opacity-60",
          )}
          role="group"
          aria-label="Marcador predicho"
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={compact ? stepperBtnCompact : stepperBtn}
              aria-label="Restar gol local"
              disabled={predictionLocked}
              onClick={() => bump("home", -1)}
            >
              <Minus className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
            <label htmlFor={homeFieldId} className="sr-only">
              Goles de {match.homeTeam}
            </label>
            <input
              id={homeFieldId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              name={`score-home-${match.id}`}
              placeholder="0"
              value={homeStr}
              readOnly={predictionLocked}
              onChange={(e) => onHomeChange(e.target.value)}
              className={cn(
                compact ? scoreInputClassCompact : scoreInputClass,
                homeInvalid && "border-red-300",
              )}
              maxLength={2}
              aria-invalid={homeInvalid}
            />
            <button
              type="button"
              className={compact ? stepperBtnCompact : stepperBtn}
              aria-label="Sumar gol local"
              disabled={predictionLocked}
              onClick={() => bump("home", 1)}
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
          </div>
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              className={compact ? stepperBtnCompact : stepperBtn}
              aria-label="Restar gol visitante"
              disabled={predictionLocked}
              onClick={() => bump("away", -1)}
            >
              <Minus className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
            <label htmlFor={awayFieldId} className="sr-only">
              Goles de {match.awayTeam}
            </label>
            <input
              id={awayFieldId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              name={`score-away-${match.id}`}
              placeholder="0"
              value={awayStr}
              readOnly={predictionLocked}
              onChange={(e) => onAwayChange(e.target.value)}
              className={cn(
                compact ? scoreInputClassCompact : scoreInputClass,
                awayInvalid && "border-red-300",
              )}
              maxLength={2}
              aria-invalid={awayInvalid}
            />
            <button
              type="button"
              className={compact ? stepperBtnCompact : stepperBtn}
              aria-label="Sumar gol visitante"
              disabled={predictionLocked}
              onClick={() => bump("away", 1)}
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-2 flex justify-center">
          {complete && outcome !== null && outcomeLabel ? (
            <div
              className={cn(
                "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-tight",
                outcomePillClass(outcome),
              )}
            >
              <span className="tabular-nums">
                {homeGoals}-{awayGoals}
              </span>
              <span className="opacity-50" aria-hidden>
                ·
              </span>
              <span>{outcomeLabel}</span>
            </div>
          ) : (
            <p className="text-center text-[11px] font-medium leading-snug text-app-muted">
              {emptyHint}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function outcomeToCanonicalScore(
  o: MatchOutcome,
): { home: number; away: number } {
  if (o === "home") return { home: 1, away: 0 };
  if (o === "away") return { home: 0, away: 1 };
  return { home: 0, away: 0 };
}

function MatchCardOutcome({
  match,
  initialScore = null,
  className,
  finalResult = null,
  pointsEarned = null,
  onPredictionCommit,
  predictionLocked = false,
  hideTournamentLabel = false,
  compact = false,
}: MatchCardProps) {
  const selected = useMemo((): MatchOutcome | null => {
    if (!initialScore) return null;
    return inferOutcome(initialScore.home, initialScore.away);
  }, [initialScore]);

  const { date, time } = formatMatchKickoffSplit(match.startsAt);

  const onPick = (o: MatchOutcome) => {
    if (predictionLocked) return;
    onPredictionCommit?.(outcomeToCanonicalScore(o));
  };

  return (
    <article
      className={cn(
        cardSurface,
        "transition-colors",
        selected !== null
          ? "border-app-primary/35 ring-1 ring-app-primary/15"
          : "border-app-border",
        className,
      )}
    >
      <div
        className={cn(
          "border-b border-app-border-subtle bg-app-bg/60 px-2.5 py-1.5",
          hideTournamentLabel && "py-1.5",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {hideTournamentLabel ? null : (
              <p className={cn(statLabel, "leading-snug")}>
                {match.tournamentLabel ?? "—"}
              </p>
            )}
            {finalResult ? (
              <p
                className={cn(
                  "text-[10px] font-medium leading-snug text-app-sport",
                  !hideTournamentLabel && "mt-1",
                )}
              >
                Final: {finalResult.home}-{finalResult.away}
                {pointsEarned !== null && pointsEarned !== undefined ? (
                  <span className="ml-1 font-bold text-app-text">
                    · +{pointsEarned} pts
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right leading-none">
            <p className="text-[10px] font-medium capitalize text-app-muted">
              {date}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-app-text">
              {time}
            </p>
          </div>
        </div>
      </div>

      <div className={cn("px-2.5 pb-2 pt-2", compact && "px-2 pb-1.5 pt-1.5")}>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0">
          <div className="flex min-w-0 items-start gap-2">
            <TeamCrest teamName={match.homeTeam} size={compact ? 26 : 30} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-left text-[12px] font-semibold leading-tight text-app-text">
                {match.homeTeam}
              </p>
              <p className="mt-0.5 text-left text-[10px] font-semibold text-app-muted">
                Local
              </p>
            </div>
          </div>
          <div className="flex min-w-0 items-start justify-end gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-right text-[12px] font-semibold leading-tight text-app-text">
                {match.awayTeam}
              </p>
              <p className="mt-0.5 text-right text-[10px] font-semibold text-app-muted">
                Visita
              </p>
            </div>
            <TeamCrest teamName={match.awayTeam} size={compact ? 26 : 30} />
          </div>
        </div>

        <div
          className={cn(
            "mt-2 grid grid-cols-3 gap-1.5",
            compact && "mt-1.5 gap-1",
            predictionLocked && "pointer-events-none opacity-60",
          )}
          role="group"
          aria-label="Resultado 1X2"
        >
          {(
            [
              ["home", "Local"] as const,
              ["draw", "Empate"] as const,
              ["away", "Visita"] as const,
            ] as const
          ).map(([key, label]) => {
            const active = selected === key;
            return (
              <button
                key={key}
                type="button"
                disabled={predictionLocked}
                onClick={() => onPick(key)}
                className={cn(
                  "min-h-[40px] rounded-lg border px-1 text-[11px] font-bold leading-tight transition active:scale-[0.98]",
                  active
                    ? "border-app-primary bg-blue-50 text-app-primary shadow-[inset_0_0_0_1px_rgba(37,99,235,0.12)]"
                    : "border-app-border bg-app-surface text-app-text hover:bg-app-bg",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {selected !== null && !predictionLocked ? (
          <p className="mt-2 text-center text-[10px] font-semibold text-app-sport">
            {outcomeLabelEs(selected)}
          </p>
        ) : predictionLocked ? (
          <p className="mt-2 text-center text-[10px] text-app-muted">
            Pronóstico cerrado
          </p>
        ) : (
          <p className="mt-2 text-center text-[10px] text-app-muted">
            Elegí local, empate o visita
          </p>
        )}
      </div>
    </article>
  );
}

export function MatchCard(props: MatchCardProps) {
  if (props.predictionMode === "outcome") {
    return <MatchCardOutcome {...props} />;
  }
  return <MatchCardScore {...props} />;
}
