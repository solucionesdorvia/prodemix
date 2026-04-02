import {
  PRODE_PUNTOS_ERROR,
  PRODE_PUNTOS_PLENO,
  PRODE_PUNTOS_SIGNO,
} from "./constants";
import { resultSign } from "./outcome";

export type ScoreBreakdown = {
  points: number;
  pleno: boolean;
  signHit: boolean;
};

/**
 * Compara pronóstico vs resultado oficial (mismos goles = pleno).
 * Reutilizable en UI, recálculo de ranking e ingesta admin.
 */
export function scorePrediction(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
): ScoreBreakdown {
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return { points: PRODE_PUNTOS_PLENO, pleno: true, signHit: true };
  }
  const ps = resultSign(predictedHome, predictedAway);
  const rs = resultSign(actualHome, actualAway);
  if (ps === rs) {
    return { points: PRODE_PUNTOS_SIGNO, pleno: false, signHit: true };
  }
  return { points: PRODE_PUNTOS_ERROR, pleno: false, signHit: false };
}

/** Puntos 0 | 1 | 3 para una fila de pronóstico vs resultado. */
export function pointsForPrediction(
  pred: { home: number; away: number },
  actual: { home: number; away: number },
): 0 | 1 | 3 {
  return scorePrediction(
    pred.home,
    pred.away,
    actual.home,
    actual.away,
  ).points as 0 | 1 | 3;
}
