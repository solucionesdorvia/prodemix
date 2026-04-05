"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { reportClientError } from "@/lib/observability/client-error";

type AdminProdeSummary = {
  id: string;
  slug: string;
  title: string;
  status: string;
  closesAt: string;
};

type MatchRow = {
  id: string;
  startsAt: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
};

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
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
      : `Error (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

function formatKickoff(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminProdeResultsClient() {
  const [prodes, setProdes] = useState<AdminProdeSummary[]>([]);
  const [prodesError, setProdesError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");

  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  const [draft, setDraft] = useState<Record<string, { home: string; away: string }>>(
    {},
  );
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadProdes = useCallback(async () => {
    setProdesError(null);
    try {
      const data = await adminFetch<{ prodes: AdminProdeSummary[] }>(
        "/api/admin/prodes",
      );
      setProdes(data.prodes);
    } catch (e) {
      setProdesError(e instanceof Error ? e.message : "No se pudieron cargar los prodes.");
    }
  }, []);

  useEffect(() => {
    void loadProdes();
  }, [loadProdes]);

  const loadMatches = useCallback(async (prodeId: string) => {
    if (!prodeId) {
      setMatches([]);
      setDraft({});
      return;
    }
    setMatchesLoading(true);
    setMatchesError(null);
    try {
      const data = await adminFetch<{ matches: MatchRow[] }>(
        `/api/admin/prodes/${encodeURIComponent(prodeId)}/matches`,
      );
      setMatches(data.matches);
      const next: Record<string, { home: string; away: string }> = {};
      for (const m of data.matches) {
        next[m.id] = {
          home:
            m.homeScore != null ? String(m.homeScore) : "",
          away:
            m.awayScore != null ? String(m.awayScore) : "",
        };
      }
      setDraft(next);
    } catch (e) {
      setMatches([]);
      setDraft({});
      setMatchesError(e instanceof Error ? e.message : "No se pudieron cargar los partidos.");
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMatches(selectedId);
  }, [selectedId, loadMatches]);

  const selectedProde = useMemo(
    () => prodes.find((p) => p.id === selectedId),
    [prodes, selectedId],
  );

  const saveResults = async () => {
    setMessage(null);
    if (!selectedId) {
      setMessage("Elegí un prode.");
      return;
    }
    const results: { matchId: string; homeScore: number; awayScore: number }[] =
      [];
    for (const m of matches) {
      const d = draft[m.id];
      if (!d) continue;
      const h = d.home.trim();
      const a = d.away.trim();
      if (h === "" && a === "") continue;
      const hn = Number.parseInt(h, 10);
      const an = Number.parseInt(a, 10);
      if (
        Number.isNaN(hn) ||
        Number.isNaN(an) ||
        hn < 0 ||
        hn > 99 ||
        an < 0 ||
        an > 99
      ) {
        setMessage(
          `Marcador inválido para ${m.homeTeam.name} vs ${m.awayTeam.name} (enteros 0–99 o vacío).`,
        );
        return;
      }
      results.push({ matchId: m.id, homeScore: hn, awayScore: an });
    }
    if (results.length === 0) {
      setMessage("Completá al menos un marcador final.");
      return;
    }
    setBusy(true);
    try {
      const qs =
        selectedId ?
          `?prodeId=${encodeURIComponent(selectedId)}`
        : "";
      await adminFetch<{ ok: boolean; affectedProdeIds: string[] }>(
        `/api/admin/results${qs}`,
        {
          method: "POST",
          body: JSON.stringify({ results }),
        },
      );
      setMessage(
        `Guardado: ${results.length} resultado(s). Ranking recalculado para los prodes afectados.`,
      );
      await loadMatches(selectedId);
    } catch (e) {
      reportClientError(e, { area: "admin.results.save" });
      setMessage(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };

  const recalcOnly = async () => {
    setMessage(null);
    if (!selectedId) {
      setMessage("Elegí un prode.");
      return;
    }
    setBusy(true);
    try {
      await adminFetch<{ ok: boolean }>("/api/admin/recalculate", {
        method: "POST",
        body: JSON.stringify({ prodeId: selectedId }),
      });
      setMessage("Ranking recalculado.");
    } catch (e) {
      reportClientError(e, { area: "admin.ranking.recalc" });
      setMessage(e instanceof Error ? e.message : "No se pudo recalcular.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      <header className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
          Interno · Base de datos
        </p>
        <h1 className="text-xl font-bold text-neutral-900">
          Resultados oficiales
        </h1>
        <p className="text-[13px] text-neutral-600">
          Cargá marcadores finales en los partidos del prode. Al guardar se
          actualizan los resultados y se recalcula el ranking (3 pleno · 1 signo
          · 0 error).
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold">
          <Link href="/admin/dashboard" className="text-blue-700 hover:underline">
            Panel
          </Link>
          <Link href="/admin/prodes" className="text-blue-700 hover:underline">
            Prodes
          </Link>
          <Link href="/" className="text-blue-700 hover:underline">
            App
          </Link>
        </div>
      </header>

      {message ?
        <p
          className={`rounded-md border px-3 py-2 text-[13px] ${
            message.startsWith("Guardado") || message.includes("recalculado") ?
              "border-green-200 bg-green-50 text-green-900"
            : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          {message}
        </p>
      : null}

      {prodesError ?
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-900">
          {prodesError}{" "}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => void loadProdes()}
          >
            Reintentar
          </button>
        </p>
      : null}

      <section className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <label className="block text-[12px] font-semibold text-neutral-700">
          Prode
        </label>
        <select
          className="w-full rounded border border-neutral-300 px-2 py-2 text-[13px]"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">— Elegí un prode —</option>
          {prodes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.status})
            </option>
          ))}
        </select>
        {selectedProde ?
          <p className="text-[11px] text-neutral-500">
            ID: <code className="rounded bg-neutral-100 px-1">{selectedProde.id}</code>
            {" · "}
            <Link
              href={`/prodes/${encodeURIComponent(selectedProde.slug)}`}
              className="font-semibold text-blue-700 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Vista jugador
            </Link>
          </p>
        : null}
      </section>

      {matchesError ?
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-900">
          {matchesError}
        </p>
      : null}

      {selectedId && matchesLoading ?
        <p className="text-[13px] text-neutral-600">Cargando partidos…</p>
      : null}

      {selectedId && !matchesLoading && matches.length === 0 && !matchesError ?
        <p className="text-[13px] text-neutral-600">
          Este prode no tiene partidos vinculados en la base.
        </p>
      : null}

      {matches.length > 0 ?
        <section className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-neutral-900">Partidos</h2>
          <ul className="space-y-3">
            {matches.map((m, idx) => {
              const d = draft[m.id] ?? { home: "", away: "" };
              return (
                <li
                  key={m.id}
                  className="rounded border border-neutral-100 bg-neutral-50/80 p-3"
                >
                  <p className="text-[11px] font-semibold text-neutral-500">
                    Partido {idx + 1} · {formatKickoff(m.startsAt)} ·{" "}
                    <span className="uppercase">{m.status}</span>
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-neutral-900">
                    {m.homeTeam.name}{" "}
                    <span className="font-normal text-neutral-400">vs</span>{" "}
                    {m.awayTeam.name}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[12px] font-medium text-neutral-600">
                      Final
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      className="w-16 rounded border border-neutral-300 px-2 py-1 text-[13px]"
                      placeholder="L"
                      value={d.home}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          [m.id]: {
                            home: e.target.value,
                            away: prev[m.id]?.away ?? "",
                          },
                        }))
                      }
                    />
                    <span className="text-neutral-400">—</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      className="w-16 rounded border border-neutral-300 px-2 py-1 text-[13px]"
                      placeholder="V"
                      value={d.away}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          [m.id]: {
                            home: prev[m.id]?.home ?? "",
                            away: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              disabled={busy}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
              onClick={() => void saveResults()}
            >
              {busy ? "Guardando…" : "Guardar resultados y recalcular ranking"}
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-[13px] font-semibold disabled:opacity-50"
              onClick={() => void recalcOnly()}
            >
              Solo recalcular ranking
            </button>
          </div>
        </section>
      : null}
    </div>
  );
}
