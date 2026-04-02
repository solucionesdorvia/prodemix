/** Client-safe: whether the user may still edit predictions (before prode closes). */

export function clientCanEditPredictions(prode: {
  status: string;
  closesAt: string;
}): boolean {
  if (prode.status === "CANCELLED" || prode.status === "FINALIZED") {
    return false;
  }
  return new Date(prode.closesAt) > new Date();
}
