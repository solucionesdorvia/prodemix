/** Fetch admin API (sesión NextAuth + rol admin; cookies automáticas). */
export async function adminFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers,
  });
  const data = (await res.json().catch(() => ({}))) as T & {
    error?: { message?: string };
  };
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: { message?: string } }).error?.message ===
        "string" ?
        (data as { error: { message: string } }).error.message
      : `Error ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}
