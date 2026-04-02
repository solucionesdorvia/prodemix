"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";

type Team = { id: string; name: string; slug: string };
type Matchday = {
  id: string;
  externalKey: string;
  name: string;
  roundNumber: number;
  startsAt: string;
  closesAt: string;
};
type MatchRow = {
  id: string;
  matchdayId: string;
  startsAt: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: Team;
  awayTeam: Team;
};

export function AdminTournamentDetailClient({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const [name, setName] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchdays, setMatchdays] = useState<Matchday[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [filterMd, setFilterMd] = useState<string>("");
  const [teamName, setTeamName] = useState("");
  const [mdKey, setMdKey] = useState("");
  const [mdName, setMdName] = useState("");
  const [mdRound, setMdRound] = useState("1");
  const [mdStart, setMdStart] = useState("");
  const [mdClose, setMdClose] = useState("");
  const [mMd, setMMd] = useState("");
  const [mHome, setMHome] = useState("");
  const [mAway, setMAway] = useState("");
  const [mStart, setMStart] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [t, tm, md, mt] = await Promise.all([
        adminFetch<{ tournament: { name: string } }>(
          `/api/admin/tournaments/${encodeURIComponent(tournamentId)}`,
        ),
        adminFetch<{ teams: Team[] }>(
          `/api/admin/tournaments/${encodeURIComponent(tournamentId)}/teams`,
        ),
        adminFetch<{ matchdays: Matchday[] }>(
          `/api/admin/tournaments/${encodeURIComponent(tournamentId)}/matchdays`,
        ),
        adminFetch<{ matches: MatchRow[] }>(
          `/api/admin/tournaments/${encodeURIComponent(tournamentId)}/matches`,
        ),
      ]);
      setName(t.tournament.name);
      setTeams(tm.teams);
      setMatchdays(md.matchdays);
      setMatches(mt.matches);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }, [tournamentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredMatches = useMemo(() => {
    if (!filterMd) return matches;
    return matches.filter((m) => m.matchdayId === filterMd);
  }, [matches, filterMd]);

  const addTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      await adminFetch(
        `/api/admin/tournaments/${encodeURIComponent(tournamentId)}/teams`,
        {
          method: "POST",
          body: JSON.stringify({ name: teamName.trim() }),
        },
      );
      setTeamName("");
      setMsg("Equipo creado.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const addMatchday = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const startsAt = new Date(mdStart).toISOString();
      const closesAt = new Date(mdClose).toISOString();
      await adminFetch(
        `/api/admin/tournaments/${encodeURIComponent(tournamentId)}/matchdays`,
        {
          method: "POST",
          body: JSON.stringify({
            externalKey: mdKey.trim() || `md-${Date.now()}`,
            name: mdName.trim() || "Fecha",
            roundNumber: Number.parseInt(mdRound, 10) || 1,
            startsAt,
            closesAt,
          }),
        },
      );
      setMdName("");
      setMsg("Fecha creada.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const addMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mMd || !mHome || !mAway) {
      setErr("Elegí fecha y equipos.");
      return;
    }
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      await adminFetch(
        `/api/admin/tournaments/${encodeURIComponent(tournamentId)}/matches`,
        {
          method: "POST",
          body: JSON.stringify({
            matchdayId: mMd,
            homeTeamId: mHome,
            awayTeamId: mAway,
            startsAt: new Date(mStart).toISOString(),
          }),
        },
      );
      setMsg("Partido creado.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-lg font-bold">{name || "Torneo"}</h1>
        <Link href="/admin/tournaments" className="text-[12px] text-blue-700 hover:underline">
          ← Torneos
        </Link>
      </div>
      {err ?
        <p className="text-[13px] text-red-700">{err}</p>
      : null}
      {msg ?
        <p className="text-[13px] text-green-800">{msg}</p>
      : null}

      <section className="rounded border border-neutral-200 bg-white p-3">
        <h2 className="text-[13px] font-bold">Equipos ({teams.length})</h2>
        <form onSubmit={addTeam} className="mt-2 flex flex-wrap gap-2 text-[12px]">
          <input
            className="min-w-[200px] flex-1 rounded border border-neutral-300 px-2 py-1"
            placeholder="Nombre del equipo"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy || !teamName.trim()}
            className="rounded bg-neutral-900 px-2 py-1 text-white disabled:opacity-50"
          >
            Añadir
          </button>
        </form>
        <div className="mt-2 max-h-40 overflow-y-auto text-[11px]">
          <table className="w-full border-collapse">
            <tbody>
              {teams.map((t) => (
                <tr key={t.id} className="border-b border-neutral-100">
                  <td className="p-1">{t.name}</td>
                  <td className="p-1 font-mono text-neutral-600">{t.slug}</td>
                  <td className="p-1 font-mono text-[10px] text-neutral-500">
                    {t.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded border border-neutral-200 bg-white p-3">
        <h2 className="text-[13px] font-bold">Fechas / jornadas</h2>
        <form onSubmit={addMatchday} className="mt-2 grid gap-2 text-[11px] sm:grid-cols-2">
          <label className="sm:col-span-2">
            externalKey (único global)
            <input
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 font-mono"
              value={mdKey}
              onChange={(e) => setMdKey(e.target.value)}
              placeholder={`ej. torneo-${tournamentId.slice(0, 6)}-f1`}
            />
          </label>
          <label>
            Nombre visible
            <input
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={mdName}
              onChange={(e) => setMdName(e.target.value)}
            />
          </label>
          <label>
            Número fecha
            <input
              type="number"
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={mdRound}
              onChange={(e) => setMdRound(e.target.value)}
            />
          </label>
          <label>
            Inicio
            <input
              type="datetime-local"
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={mdStart}
              onChange={(e) => setMdStart(e.target.value)}
            />
          </label>
          <label>
            Cierre pronósticos
            <input
              type="datetime-local"
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={mdClose}
              onChange={(e) => setMdClose(e.target.value)}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded bg-neutral-900 px-2 py-1 text-white disabled:opacity-50"
            >
              Crear fecha
            </button>
          </div>
        </form>
        <ul className="mt-2 list-inside list-disc text-[11px] text-neutral-700">
          {matchdays.map((m) => (
            <li key={m.id}>
              {m.name} · {m.externalKey}{" "}
              <span className="font-mono text-[10px]">({m.id})</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded border border-neutral-200 bg-white p-3">
        <h2 className="text-[13px] font-bold">Partidos</h2>
        <form onSubmit={addMatch} className="mt-2 grid gap-2 text-[11px] sm:grid-cols-2">
          <label className="sm:col-span-2">
            Fecha (matchday)
            <select
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={mMd}
              onChange={(e) => setMMd(e.target.value)}
              required
            >
              <option value="">— Elegir —</option>
              {matchdays.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.externalKey})
                </option>
              ))}
            </select>
          </label>
          <label>
            Local
            <select
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={mHome}
              onChange={(e) => setMHome(e.target.value)}
              required
            >
              <option value="">—</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Visita
            <select
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={mAway}
              onChange={(e) => setMAway(e.target.value)}
              required
            >
              <option value="">—</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            Kickoff
            <input
              type="datetime-local"
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={mStart}
              onChange={(e) => setMStart(e.target.value)}
              required
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded bg-neutral-900 px-2 py-1 text-white disabled:opacity-50"
            >
              Crear partido
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="font-semibold">Filtrar por fecha:</span>
          <select
            className="rounded border border-neutral-300 px-2 py-0.5"
            value={filterMd}
            onChange={(e) => setFilterMd(e.target.value)}
          >
            <option value="">Todas</option>
            {matchdays.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="p-1">ID</th>
                <th className="p-1">Local</th>
                <th className="p-1">Visita</th>
                <th className="p-1">Estado</th>
                <th className="p-1">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatches.map((m) => (
                <tr key={m.id} className="border-b border-neutral-100">
                  <td className="p-1 font-mono text-[10px]">{m.id}</td>
                  <td className="p-1">{m.homeTeam.name}</td>
                  <td className="p-1">{m.awayTeam.name}</td>
                  <td className="p-1">{m.status}</td>
                  <td className="p-1 tabular-nums">
                    {m.homeScore ?? "—"} - {m.awayScore ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
