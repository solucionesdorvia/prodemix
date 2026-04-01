"use client";

import type { ScorePrediction } from "@/domain";
import {
  Check,
  CheckCircle2,
  Copy,
  Eraser,
  Pencil,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import { btnPrimaryFull } from "@/lib/ui-styles";
import {
  buildClearUnlockedPredictionsUpdates,
  buildImportPredictionUpdates,
  destinationHasUnlockedPredictions,
  getCompatibleImportSources,
  type CompatibleImportSource,
} from "@/lib/compatible-prode-predictions";
import { getMockResultForMatch } from "@/mocks/mock-match-results";
import { useAppState } from "@/state/app-state";
import type { StoredProde } from "@/state/types";
import { cn } from "@/lib/utils";

type ProdeCopyPredictionsSectionProps = {
  prode: StoredProde;
};

export function ProdeCopyPredictionsSection({
  prode,
}: ProdeCopyPredictionsSectionProps) {
  const { user, state, bulkSetPredictionsForProde } = useAppState();
  const [replaceSourceId, setReplaceSourceId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const sources = useMemo(
    () => getCompatibleImportSources(user.id, prode, state),
    [user.id, prode, state],
  );

  const hasDestPreds = useMemo(
    () =>
      destinationHasUnlockedPredictions(
        user.id,
        prode.id,
        prode,
        state.predictionMap,
      ),
    [user.id, prode, state.predictionMap],
  );

  const canClear = hasDestPreds;

  const runImport = (sourceId: string, replace: boolean) => {
    const imports = buildImportPredictionUpdates(
      user.id,
      prode,
      sourceId,
      state,
    );
    const updates: Record<string, ScorePrediction | null> = {};

    if (replace) {
      for (const mid of prode.matchIds) {
        if (getMockResultForMatch(mid)) continue;
        updates[mid] = imports[mid] ?? null;
      }
    } else {
      for (const [mid, score] of Object.entries(imports)) {
        updates[mid] = score;
      }
    }

    bulkSetPredictionsForProde(prode.id, updates);
    setImportSuccess(true);
    setReplaceSourceId(null);
    window.setTimeout(() => setImportSuccess(false), 7000);
  };

  const requestCopy = (sourceId: string) => {
    if (hasDestPreds) {
      setReplaceSourceId(sourceId);
      return;
    }
    runImport(sourceId, false);
  };

  const confirmReplace = () => {
    if (replaceSourceId) runImport(replaceSourceId, true);
  };

  const handleClear = () => {
    const updates = buildClearUnlockedPredictionsUpdates(
      user.id,
      prode.id,
      prode,
      state.predictionMap,
    );
    if (Object.keys(updates).length === 0) {
      setShowClearConfirm(false);
      return;
    }
    bulkSetPredictionsForProde(prode.id, updates);
    setShowClearConfirm(false);
  };

  if (sources.length === 0) return null;

  return (
    <>
      <section className="mt-3">
        <div className="rounded-xl border border-app-primary/15 bg-gradient-to-br from-blue-50/70 via-white to-app-surface p-2.5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
          <div className="flex gap-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-app-primary/10 text-app-primary"
              aria-hidden
            >
              <Zap className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-app-primary">
                Ahorrá tiempo
              </p>
              <h2 className="mt-0.5 text-[13px] font-bold leading-tight tracking-tight text-app-text">
                Copiar pronósticos de otro prode
              </h2>
              <p className="mt-1 text-[10px] font-medium leading-snug text-app-muted">
                Elegí un origen abajo y tocá{" "}
                <span className="font-semibold text-app-text">Copiar</span>.
              </p>
              <ul
                className="mt-2 flex flex-wrap gap-x-1.5 gap-y-1 text-[9px] font-semibold leading-tight text-app-text"
                aria-label="Beneficios"
              >
                <li className="inline-flex items-center gap-0.5 rounded-md bg-white/90 px-1.5 py-1 ring-1 ring-app-border/80">
                  <Zap className="h-3 w-3 shrink-0 text-app-primary" strokeWidth={2} />
                  Ahorrá minutos
                </li>
                <li className="inline-flex items-center gap-0.5 rounded-md bg-white/90 px-1.5 py-1 ring-1 ring-emerald-200/90">
                  <Check
                    className="h-3 w-3 shrink-0 text-emerald-600"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  Mismo fixture
                </li>
                <li className="inline-flex items-center gap-0.5 rounded-md bg-white/90 px-1.5 py-1 ring-1 ring-app-border/80">
                  <Pencil
                    className="h-3 w-3 shrink-0 text-app-muted"
                    strokeWidth={2}
                    aria-hidden
                  />
                  Editá abajo
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-2 space-y-2">
          {importSuccess ?
            <div
              className="flex gap-2 rounded-[10px] border border-emerald-200/90 bg-emerald-50/90 px-2.5 py-2"
              role="status"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                strokeWidth={2}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-emerald-950">
                  Pronósticos importados correctamente
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-emerald-900/90">
                  Revisalos y modificá lo que quieras antes de guardar.
                </p>
              </div>
            </div>
          : null}

          <ul className="space-y-2">
            {sources.map((s) => (
              <CopySourceRow
                key={s.prodeId}
                source={s}
                onCopy={() => requestCopy(s.prodeId)}
              />
            ))}
          </ul>

          <button
            type="button"
            disabled={!canClear}
            onClick={() => canClear && setShowClearConfirm(true)}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-app-border bg-app-surface py-2 text-[11px] font-semibold text-app-muted transition",
              canClear ?
                "hover:bg-app-bg hover:text-app-text active:scale-[0.995]"
              : "cursor-not-allowed opacity-50",
            )}
          >
            <Eraser className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Empezar de cero
          </button>
        </div>
      </section>

      {replaceSourceId ?
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="replace-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            aria-label="Cerrar"
            onClick={() => setReplaceSourceId(null)}
          />
          <div className="relative z-[1] m-3 w-full max-w-sm rounded-2xl border border-app-border bg-app-surface p-4 shadow-xl shadow-slate-900/10">
            <h3
              id="replace-title"
              className="text-[15px] font-bold leading-snug text-app-text"
            >
              Ya tenés pronósticos cargados
            </h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-app-muted">
              Si copiás desde otro prode, se van a reemplazar los marcadores de
              los partidos abiertos.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className={cn(btnPrimaryFull(), "min-h-[44px] text-[13px] font-bold")}
                onClick={confirmReplace}
              >
                Reemplazar
              </button>
              <button
                type="button"
                className="min-h-[44px] rounded-[10px] border border-app-border bg-app-bg text-[13px] font-semibold text-app-text transition hover:bg-app-surface"
                onClick={() => setReplaceSourceId(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      : null}

      {showClearConfirm ?
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            aria-label="Cerrar"
            onClick={() => setShowClearConfirm(false)}
          />
          <div className="relative z-[1] m-3 w-full max-w-sm rounded-2xl border border-app-border bg-app-surface p-4 shadow-xl shadow-slate-900/10">
            <h3
              id="clear-title"
              className="text-[15px] font-bold leading-snug text-app-text"
            >
              Borrar pronósticos
            </h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-app-muted">
              Se van a quitar todos tus marcadores en partidos que todavía no
              cerraron en este prode.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className={cn(btnPrimaryFull(), "min-h-[44px] text-[13px] font-bold")}
                onClick={handleClear}
              >
                Borrar
              </button>
              <button
                type="button"
                className="min-h-[44px] rounded-[10px] border border-app-border bg-app-bg text-[13px] font-semibold text-app-text transition hover:bg-app-surface"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      : null}
    </>
  );
}

function CopySourceRow({
  source,
  onCopy,
}: {
  source: CompatibleImportSource;
  onCopy: () => void;
}) {
  const full =
    source.copyableCount >= source.totalUnlockedDest && source.totalUnlockedDest > 0;
  const statusLabel = full
    ? "Mismo fixture completo en este origen"
    : `${source.copyableCount} marcador${source.copyableCount === 1 ? "" : "es"} para traer (${source.totalUnlockedDest} partidos abiertos)`;

  return (
    <li className="rounded-[10px] border border-app-border bg-app-surface px-2.5 py-2 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <span className="rounded bg-emerald-50 px-1 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200/90">
              Compatible
            </span>
          </div>
          <p className="mt-1 text-[12px] font-bold leading-tight text-app-text">
            {source.displayName}
          </p>
          <p className="mt-0.5 text-[10px] font-medium leading-snug text-app-muted">
            {statusLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-lg border border-app-primary/25 bg-blue-50/90 px-2.5 py-1.5 text-[11px] font-bold text-app-primary transition hover:bg-blue-100/90 active:scale-[0.98]",
          )}
        >
          <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Copiar
        </button>
      </div>
    </li>
  );
}
