import type { PublicPool } from "@/domain";

export function formatArsCompact(n: number): string {
  return n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

/** Línea principal de premio para CTAs (escaneo rápido). */
export function formatPrizeLine(pool: PublicPool): string {
  if (pool.prizePoolArs > 0) {
    return `Premio: $${formatArsCompact(pool.prizePoolArs)}`;
  }
  return "Premio: gratuito";
}
