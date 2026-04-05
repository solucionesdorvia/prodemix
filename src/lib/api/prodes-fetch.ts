/** Browser fetch helpers — cookies sent for Auth.js session. */

export async function fetchProdeApi<T>(
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
    cache: "no-store",
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
      : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export async function postProdePredictions(
  prodeId: string,
  predictions: {
    matchId: string;
    predictedHomeScore: number;
    predictedAwayScore: number;
  }[],
): Promise<{ ok: boolean; saved: number }> {
  return fetchProdeApi<{ ok: boolean; saved: number }>(
    `/api/prodes/${encodeURIComponent(prodeId)}/predictions`,
    {
      method: "POST",
      body: JSON.stringify({ predictions }),
    },
  );
}

export async function postJoinProde(prodeId: string): Promise<{ ok: boolean }> {
  return fetchProdeApi<{ ok: boolean }>(
    `/api/prodes/${encodeURIComponent(prodeId)}/join`,
    { method: "POST", body: "{}" },
  );
}

export type FetchedProdePrediction = {
  matchId: string;
  home: number;
  away: number;
  savedAt: string;
};

/** Pronósticos guardados en servidor para el prode (GET). */
export async function fetchProdePredictions(
  prodeId: string,
): Promise<{ predictions: FetchedProdePrediction[] }> {
  return fetchProdeApi<{ predictions: FetchedProdePrediction[] }>(
    `/api/prodes/${encodeURIComponent(prodeId)}/predictions`,
  );
}
