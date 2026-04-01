const SESSION_KEY = "prodemix:v1:session";

export type SessionPayload = {
  loggedIn: boolean;
};

export function loadSessionLoggedIn(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw === null) return true;
  try {
    const v = JSON.parse(raw) as SessionPayload;
    return v.loggedIn !== false;
  } catch {
    return true;
  }
}

export function saveSessionLoggedIn(loggedIn: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ loggedIn } satisfies SessionPayload),
    );
  } catch {
    /* ignore */
  }
}
