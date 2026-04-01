import { getAdminProdeByProdeId } from "@/state/admin-prode-storage";

/**
 * Si el prode tiene metadata admin, bloquea pronósticos cuando el estado no es
 * `open` o cuando pasó el deadline.
 */
export function isAdminProdePredictionsLocked(
  prodeId: string,
  nowMs = Date.now(),
): boolean {
  const r = getAdminProdeByProdeId(prodeId);
  if (!r) return false;
  if (r.status !== "open") return true;
  const deadline = Date.parse(r.deadlineAt);
  if (Number.isNaN(deadline)) return true;
  return nowMs >= deadline;
}
