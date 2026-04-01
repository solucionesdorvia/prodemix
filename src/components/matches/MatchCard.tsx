"use client";

import { Check, Minus, Plus } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import type { Match, ScorePrediction } from "@/domain";
import { TeamCrest } from "@/components/team/TeamCrest";
import { formatMatchKickoffSplit } from "@/lib/datetime";
import { cardSurface, statLabel } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

type MatchCardProps = {
  match: Match;
  initialScore?: ScorePrediction | null;
  className?: string;
  finalResult?: { home: number; away: number } | null;
  pointsEarned?: 0 | 1 | 3 | null;
  onPredictionCommit?: (score: ScorePrediction) => void;
  predictionLocked?: boolean;
  hideTournamentLabel?: boolean;
  compact?: boolean;
};

const STEP_MAX = 20;

/** Bump goals; only call onInteraction when value actually changes. */
function clampGoals(n: number): number {
  return Math.min(STEP_MAX, Math.max(0, n));
}

type ScoreRailProps = {
  value: number;
  onDelta: (d: number) => void;
  disabled: boolean;
  compact: boolean;
  labelMinus: string;
  labelPlus: string;
  /** Pulse key for micro-feedback when value changes */
  bumpKey: number;
  /** Softer color before the user has interacted (0-0 preview). */
  muted: boolean;
};

function ScoreRail({
  value,
  onDelta,
  disabled,
  compact,
  labelMinus,
  labelPlus,
  bumpKey,
  muted,
}: ScoreRailProps) {
  const atMin = value <= 0;
  const atMax = value >= STEP_MAX;

  const btn =
    "touch-manipulation select-none rounded-2xl border font-semibold transition will-change-transform active:scale-[0.94] active:transition-none disabled:pointer-events-none disabled:opacity-35";
  const btnSize = compact ? "h-12 w-12 min-h-[48px] min-w-[48px]" : "h-[52px] w-[52px] min-h-[52px] min-w-[52px]";
  const minusCls = cn(
    btn,
    btnSize,
    "border-slate-200/95 bg-gradient-to-b from-white to-slate-50/90 text-slate-700 shadow-[0_2px_0_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.06)]",
    !disabled && !atMin && "hover:border-slate-300 active:from-slate-50 active:to-slate-100",
  );
  const plusCls = cn(
    btn,
    btnSize,
    "border-blue-200/90 bg-gradient-to-b from-blue-50 to-white text-app-primary shadow-[0_2px_0_rgba(37,99,235,0.12),0_1px_2px_rgba(37,99,235,0.08)]",
    !disabled && !atMax && "hover:border-blue-300 active:from-blue-100/80 active:to-blue-50",
  );

  const digit = compact ? "text-[28px] leading-none" : "text-[32px] leading-none";

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
      <button
        type="button"
        className={minusCls}
        aria-label={labelMinus}
        disabled={disabled || atMin}
        onClick={() => onDelta(-1)}
      >
        <Minus className="mx-auto h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden />
      </button>

      <div
        className={cn(
          "flex min-h-[52px] min-w-[56px] items-center justify-center rounded-2xl border border-app-border/80 bg-white px-3 shadow-[inset_0_2px_6px_rgba(15,23,42,0.05),0_1px_0_rgba(255,255,255,0.9)]",
          compact && "min-h-[48px] min-w-[52px] px-2.5",
        )}
      >
        <span
          key={bumpKey}
          className={cn(
            digit,
            "match-score-digit-pop tabular-nums tracking-tight transition-colors duration-150",
            muted ? "text-app-muted" : "text-app-text",
          )}
          aria-live="polite"
        >
          {value}
        </span>
      </div>

      <button
        type="button"
        className={plusCls}
        aria-label={labelPlus}
        disabled={disabled || atMax}
        onClick={() => onDelta(1)}
      >
        <Plus className="mx-auto h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}

export function MatchCard({
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
  const groupId = useId();
  const lastCommitSig = useRef<string | null>(
    initialScore ?
      `${initialScore.predictedHomeScore}-${initialScore.predictedAwayScore}`
    : null,
  );
  const onCommitRef = useRef(onPredictionCommit);

  useLayoutEffect(() => {
    onCommitRef.current = onPredictionCommit;
  }, [onPredictionCommit]);

  const [home, setHome] = useState(() => initialScore?.predictedHomeScore ?? 0);
  const [away, setAway] = useState(() => initialScore?.predictedAwayScore ?? 0);
  /** User adjusted scores (avoid committing silent 0-0 on first paint). */
  const [touched, setTouched] = useState(() => initialScore != null);
  const [bumpHome, setBumpHome] = useState(0);
  const [bumpAway, setBumpAway] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      if (initialScore) {
        const h = initialScore.predictedHomeScore;
        const a = initialScore.predictedAwayScore;
        setHome(h);
        setAway(a);
        setTouched(true);
        lastCommitSig.current = `${h}-${a}`;
      } else {
        setHome(0);
        setAway(0);
        setTouched(false);
        lastCommitSig.current = null;
      }
    });
  }, [initialScore, match.id]);

  useEffect(() => {
    if (predictionLocked) return;
    if (!onCommitRef.current) return;
    if (!touched) return;
    const sig = `${home}-${away}`;
    if (lastCommitSig.current === sig) return;
    lastCommitSig.current = sig;
    onCommitRef.current({
      predictedHomeScore: home,
      predictedAwayScore: away,
    });
  }, [home, away, touched, predictionLocked]);

  const adjustHome = (d: number) => {
    if (predictionLocked) return;
    setTouched(true);
    setHome((h) => {
      const n = clampGoals(h + d);
      if (n !== h) setBumpHome((k) => k + 1);
      return n;
    });
  };

  const adjustAway = (d: number) => {
    if (predictionLocked) return;
    setTouched(true);
    setAway((a) => {
      const n = clampGoals(a + d);
      if (n !== a) setBumpAway((k) => k + 1);
      return n;
    });
  };

  const hasPrediction = touched;
  const isStaleZero =
    !initialScore && !touched && home === 0 && away === 0;

  const { date, time } = formatMatchKickoffSplit(match.startsAt);

  return (
    <article
      className={cn(
        cardSurface,
        "overflow-hidden transition-[box-shadow,border-color] duration-200",
        hasPrediction && !predictionLocked
          ? "border-app-primary/35 shadow-[0_8px_28px_-12px_rgba(37,99,235,0.28)] ring-1 ring-app-primary/15"
          : "border-app-border shadow-card",
        className,
      )}
    >
      <div
        className={cn(
          "border-b border-app-border-subtle bg-gradient-to-r from-app-bg/80 via-white to-app-bg/80 px-2.5 py-1.5",
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

      <div
        className={cn(
          "px-2.5 pb-2.5 pt-2",
          compact && "px-2 pb-2 pt-1.5",
          predictionLocked && "pointer-events-none opacity-[0.72]",
        )}
        role="group"
        aria-labelledby={`${groupId}-heading`}
      >
        <p id={`${groupId}-heading`} className="sr-only">
          Pronóstico de marcador para {match.homeTeam} contra {match.awayTeam}
        </p>

        {/* Home */}
        <div className="flex items-center gap-2">
          <TeamCrest teamName={match.homeTeam} size={compact ? 30 : 34} />
          <p className="min-w-0 flex-1 truncate text-left text-[13px] font-bold leading-tight text-app-text">
            {match.homeTeam}
          </p>
        </div>

        <div className="mt-2">
          <ScoreRail
            value={home}
            onDelta={adjustHome}
            disabled={!!predictionLocked}
            compact={compact}
            labelMinus={`Un gol menos para ${match.homeTeam}`}
            labelPlus={`Un gol más para ${match.homeTeam}`}
            bumpKey={bumpHome}
            muted={!touched}
          />
        </div>

        <div className="my-2 flex items-center justify-center gap-2">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-app-border to-transparent" />
          <span
            className={cn(
              "rounded-full bg-app-bg px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-app-muted",
              isStaleZero && "opacity-80",
            )}
          >
            vs
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-app-border to-transparent" />
        </div>

        <div className="mb-2">
          <ScoreRail
            value={away}
            onDelta={adjustAway}
            disabled={!!predictionLocked}
            compact={compact}
            labelMinus={`Un gol menos para ${match.awayTeam}`}
            labelPlus={`Un gol más para ${match.awayTeam}`}
            bumpKey={bumpAway}
            muted={!touched}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <p className="min-w-0 flex-1 truncate text-right text-[13px] font-bold leading-tight text-app-text">
            {match.awayTeam}
          </p>
          <TeamCrest teamName={match.awayTeam} size={compact ? 30 : 34} />
        </div>

        <div className="mt-2.5 flex min-h-[36px] items-center justify-center">
          {predictionLocked ?
            <p className="text-center text-[11px] font-medium text-app-muted">
              Marcador cerrado
            </p>
          : hasPrediction ?
            <div
              className={cn(
                "inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200/90 bg-gradient-to-r from-emerald-50 to-white px-3 py-1.5 text-[12px] font-bold text-emerald-950 shadow-sm",
              )}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
                <Check className="h-3.5 w-3.5" strokeWidth={2.75} aria-hidden />
              </span>
              <span className="tabular-nums tracking-tight">
                {home} — {away}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-800/90">
                Listo
              </span>
            </div>
          : (
            <p className="text-center text-[11px] font-medium leading-snug text-app-muted">
              Tocá + / − para cargar tu marcador
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
