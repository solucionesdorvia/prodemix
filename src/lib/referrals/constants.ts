/** Invitaciones necesarias para desbloquear entrada gratis a prodes pagos. */
export const REFERRAL_TARGET_FREE = 10;

/** Hitos opcionales para UI (beneficios menores pueden activarse en lógica futura). */
export const REFERRAL_MILESTONES = [3, 5, REFERRAL_TARGET_FREE] as const;

export const REFERRAL_COOKIE = "prodemix_ref";

/** Misma clave en `localStorage` como respaldo si la cookie no llega al POST. */
export const REFERRAL_STORAGE_KEY = "prodemix_ref";

/** Duración de la cookie con código pendiente (30 días). */
export const REFERRAL_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;
