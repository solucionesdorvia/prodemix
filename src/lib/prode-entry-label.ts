/**
 * Etiquetas cortas de participación en prodes / pools públicos (es-AR).
 * Evita términos tipo SaaS; prioriza claridad: si hay que pagar, cuánto, o si hay premio.
 */

export function formatArsAmount(n: number): string {
  return Math.max(0, Math.floor(n)).toLocaleString("es-AR", {
    maximumFractionDigits: 0,
  });
}

export type ProdeEntryLabelInput = {
  entryFeeArs: number;
  /** Premio acumulado (pools públicos). */
  prizePoolArs?: number;
  /** Premios por puesto (prodes en DB). */
  prizeFirstArs?: number | null;
  prizeSecondArs?: number | null;
  prizeThirdArs?: number | null;
};

function hasAnyPrize(input: ProdeEntryLabelInput): boolean {
  const pool = input.prizePoolArs ?? 0;
  if (pool > 0) return true;
  const a = input.prizeFirstArs ?? 0;
  const b = input.prizeSecondArs ?? 0;
  const c = input.prizeThirdArs ?? 0;
  return a > 0 || b > 0 || c > 0;
}

/**
 * - `Entrada $X` si hay costo de entrada.
 * - `Con premio` si no hay entrada pero sí premio en juego.
 * - `Gratis` en el resto.
 */
export function prodeEntryLabel(input: ProdeEntryLabelInput): string {
  const fee = Math.max(0, Math.floor(input.entryFeeArs));
  if (fee > 0) {
    return `Entrada $${formatArsAmount(fee)}`;
  }
  if (hasAnyPrize(input)) {
    return "Con premio";
  }
  return "Gratis";
}

export function publicPoolEntryLabel(pool: {
  entryFeeArs: number;
  prizePoolArs: number;
}): string {
  return prodeEntryLabel({
    entryFeeArs: pool.entryFeeArs,
    prizePoolArs: pool.prizePoolArs,
  });
}

/** Valores `ProdePoolType` en Prisma (solo etiqueta en admin). */
export function prodeDbTypeLabel(type: string): string {
  switch (type) {
    case "FREE":
      return "Gratis";
    case "ELITE":
      return "Con entrada o premio";
    default:
      return type;
  }
}
