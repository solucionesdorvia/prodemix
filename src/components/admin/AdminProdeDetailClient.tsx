"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";

function toLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(s: string): string {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

type ProdePayload = {
  id: string;
  slug: string;
  title: string;
  type: string;
  seasonLabel: string | null;
  status: string;
  visibility: string;
  closesAt: string;
  startsAt: string | null;
  endsAt: string | null;
  prizeFirstArs: number | null;
  prizeSecondArs: number | null;
  prizeThirdArs: number | null;
  entryFeeArs: number;
};

export function AdminProdeDetailClient({ prodeId }: { prodeId: string }) {
  const [prode, setProde] = useState<ProdePayload | null>(null);
  const [tournaments, setTournaments] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [linkedTournaments, setLinkedTournaments] = useState<
    { id: string; name: string }[]
  >([]);
  const [matches, setMatches] = useState<
    { id: string; homeTeam: { name: string }; awayTeam: { name: string } }[]
  >([]);
  const [linkTournamentId, setLinkTournamentId] = useState("");
  const [linkMatchId, setLinkMatchId] = useState("");
  const [participants, setParticipants] = useState<
    {
      user: {
        id: string;
        email: string | null;
        username: string | null;
        name: string | null;
      };
      predictionCount: number;
      matchCount: number;
      predictionsComplete: boolean;
      points: number | null;
      plenos: number | null;
      signHits: number | null;
      leaderboardUpdatedAt: string | null;
    }[]
  >([]);
  const [predictionsByMatch, setPredictionsByMatch] = useState<
    {
      match: {
        id: string;
        startsAt: string;
        status: string;
        homeScore: number | null;
        awayScore: number | null;
        homeTeam: { name: string };
        awayTeam: { name: string };
      };
      predictions: {
        userId: string;
        user: {
          id: string;
          email: string | null;
          username: string | null;
          name: string | null;
        };
        predictedHomeScore: number;
        predictedAwayScore: number;
        savedAt: string;
        updatedAt: string;
      }[];
    }[]
  >([]);
  const [predictionTotal, setPredictionTotal] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setMsg(null);
    setErr(null);
    try {
      const [detail, tlist, m, part, preds] = await Promise.all([
        adminFetch<{ prode: ProdePayload; tournaments: { id: string; name: string }[] }>(
          `/api/admin/prodes/${encodeURIComponent(prodeId)}`,
        ),
        adminFetch<{ tournaments: { id: string; name: string }[] }>(
          "/api/admin/tournaments",
        ),
        adminFetch<{
          matches: {
            id: string;
            homeTeam: { name: string };
            awayTeam: { name: string };
          }[];
        }>(`/api/admin/prodes/${encodeURIComponent(prodeId)}/matches`),
        adminFetch<{
          participants: {
            user: {
              id: string;
              email: string | null;
              username: string | null;
              name: string | null;
            };
            predictionCount: number;
            matchCount: number;
            predictionsComplete: boolean;
            points: number | null;
            plenos: number | null;
            signHits: number | null;
            leaderboardUpdatedAt: string | null;
          }[];
        }>(`/api/admin/prodes/${encodeURIComponent(prodeId)}/participants`),
        adminFetch<{
          totalPredictions: number;
          byMatch: {
            match: {
              id: string;
              startsAt: string;
              status: string;
              homeScore: number | null;
              awayScore: number | null;
              homeTeam: { name: string };
              awayTeam: { name: string };
            };
            predictions: {
              userId: string;
              user: {
                id: string;
                email: string | null;
                username: string | null;
                name: string | null;
              };
              predictedHomeScore: number;
              predictedAwayScore: number;
              savedAt: string;
              updatedAt: string;
            }[];
          }[];
        }>(`/api/admin/prodes/${encodeURIComponent(prodeId)}/predictions`),
      ]);
      setProde(detail.prode);
      setLinkedTournaments(detail.tournaments);
      setTournaments(tlist.tournaments);
      setMatches(m.matches);
      setParticipants(part.participants);
      setPredictionsByMatch(preds.byMatch);
      setPredictionTotal(preds.totalPredictions);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }, [prodeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prode) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      await adminFetch(`/api/admin/prodes/${encodeURIComponent(prodeId)}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: prode.title,
          slug: prode.slug,
          type: prode.type,
          seasonLabel: prode.seasonLabel,
          closesAt: toIso(toLocal(prode.closesAt) || new Date().toISOString()),
          startsAt:
            prode.startsAt && toLocal(prode.startsAt) ?
              toIso(toLocal(prode.startsAt))
            : null,
          endsAt:
            prode.endsAt && toLocal(prode.endsAt) ?
              toIso(toLocal(prode.endsAt))
            : null,
          prizeFirstArs: prode.prizeFirstArs,
          prizeSecondArs: prode.prizeSecondArs,
          prizeThirdArs: prode.prizeThirdArs,
          entryFeeArs: prode.entryFeeArs,
          status: prode.status,
          visibility: prode.visibility,
        }),
      });
      setMsg("Guardado.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const linkTournament = async () => {
    if (!linkTournamentId) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      await adminFetch(
        `/api/admin/prodes/${encodeURIComponent(prodeId)}/tournaments`,
        {
          method: "POST",
          body: JSON.stringify({ tournamentId: linkTournamentId }),
        },
      );
      setLinkTournamentId("");
      await load();
      setMsg("Torneo vinculado.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const linkMatch = async () => {
    if (!linkMatchId.trim()) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      await adminFetch(`/api/admin/prodes/${encodeURIComponent(prodeId)}/matches`, {
        method: "POST",
        body: JSON.stringify({ matchId: linkMatchId.trim() }),
      });
      setLinkMatchId("");
      await load();
      setMsg("Partido vinculado.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const unlinkMatch = async (matchId: string) => {
    if (!window.confirm("¿Quitar este partido del prode?")) return;
    setBusy(true);
    try {
      await adminFetch(
        `/api/admin/prodes/${encodeURIComponent(prodeId)}/matches?matchId=${encodeURIComponent(matchId)}`,
        { method: "DELETE" },
      );
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  if (!prode && !err) {
    return <p className="text-[13px] text-neutral-500">Cargando…</p>;
  }
  if (!prode) {
    return <p className="text-[13px] text-red-700">{err}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-lg font-bold">{prode.title}</h1>
        <div className="flex flex-wrap gap-2 text-[12px] font-semibold">
          <Link href="/admin/prodes" className="text-blue-700 hover:underline">
            ← Lista
          </Link>
          <Link
            href={`/prodes/${encodeURIComponent(prode.slug)}`}
            className="text-blue-700 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Vista pública
          </Link>
          <Link
            href="/admin/results"
            className="text-blue-700 hover:underline"
          >
            Cargar resultados
          </Link>
        </div>
      </div>
      {err ?
        <p className="text-[13px] text-red-700">{err}</p>
      : null}
      {msg ?
        <p className="text-[13px] text-green-800">{msg}</p>
      : null}

      <section className="rounded border border-neutral-200 bg-white p-3">
        <h2 className="text-[13px] font-bold">Configuración</h2>
        <form onSubmit={saveConfig} className="mt-2 grid gap-2 text-[12px] sm:grid-cols-2">
          <label className="sm:col-span-2">
            Título
            <input
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={prode.title}
              onChange={(e) => setProde({ ...prode, title: e.target.value })}
            />
          </label>
          <label>
            Slug
            <input
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 font-mono"
              value={prode.slug}
              onChange={(e) => setProde({ ...prode, slug: e.target.value })}
            />
          </label>
          <label>
            Tipo
            <select
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={prode.type}
              onChange={(e) => setProde({ ...prode, type: e.target.value })}
            >
              <option value="FREE">Gratis</option>
              <option value="ELITE">Con entrada o premio</option>
            </select>
          </label>
          <label className="sm:col-span-2">
            Label fecha
            <input
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={prode.seasonLabel ?? ""}
              onChange={(e) =>
                setProde({ ...prode, seasonLabel: e.target.value || null })
              }
            />
          </label>
          <label>
            Cierra
            <input
              type="datetime-local"
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={toLocal(prode.closesAt)}
              onChange={(e) =>
                setProde({ ...prode, closesAt: toIso(e.target.value) })
              }
            />
          </label>
          <label>
            Inicia (opcional)
            <input
              type="datetime-local"
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={prode.startsAt ? toLocal(prode.startsAt) : ""}
              onChange={(e) =>
                setProde({
                  ...prode,
                  startsAt: e.target.value ? toIso(e.target.value) : null,
                })
              }
            />
          </label>
          <label>
            Termina (opcional)
            <input
              type="datetime-local"
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={prode.endsAt ? toLocal(prode.endsAt) : ""}
              onChange={(e) =>
                setProde({
                  ...prode,
                  endsAt: e.target.value ? toIso(e.target.value) : null,
                })
              }
            />
          </label>
          <label>
            Estado
            <select
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={prode.status}
              onChange={(e) => setProde({ ...prode, status: e.target.value })}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="OPEN">OPEN</option>
              <option value="CLOSED">CLOSED</option>
              <option value="FINALIZED">FINALIZED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </label>
          <label>
            Visibilidad
            <select
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={prode.visibility}
              onChange={(e) =>
                setProde({ ...prode, visibility: e.target.value })
              }
            >
              <option value="PUBLIC">PUBLIC</option>
              <option value="PRIVATE">PRIVATE</option>
            </select>
          </label>
          <label>
            Premio 1 ARS
            <input
              type="number"
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={prode.prizeFirstArs ?? ""}
              onChange={(e) =>
                setProde({
                  ...prode,
                  prizeFirstArs: e.target.value ?
                    Number.parseInt(e.target.value, 10)
                  : null,
                })
              }
            />
          </label>
          <label>
            Premio 2
            <input
              type="number"
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={prode.prizeSecondArs ?? ""}
              onChange={(e) =>
                setProde({
                  ...prode,
                  prizeSecondArs: e.target.value ?
                    Number.parseInt(e.target.value, 10)
                  : null,
                })
              }
            />
          </label>
          <label>
            Premio 3
            <input
              type="number"
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={prode.prizeThirdArs ?? ""}
              onChange={(e) =>
                setProde({
                  ...prode,
                  prizeThirdArs: e.target.value ?
                    Number.parseInt(e.target.value, 10)
                  : null,
                })
              }
            />
          </label>
          <label>
            Entrada ARS
            <input
              type="number"
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
              value={prode.entryFeeArs}
              onChange={(e) =>
                setProde({
                  ...prode,
                  entryFeeArs: Number.parseInt(e.target.value, 10) || 0,
                })
              }
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded bg-neutral-900 px-3 py-1.5 text-white disabled:opacity-50"
            >
              Guardar configuración
            </button>
          </div>
        </form>
      </section>

      <section className="rounded border border-neutral-200 bg-white p-3">
        <h2 className="text-[13px] font-bold">Torneos vinculados</h2>
        <ul className="mt-1 list-inside list-disc text-[12px]">
          {linkedTournaments.map((t) => (
            <li key={t.id}>
              {t.name}{" "}
              <span className="text-neutral-500">({t.id.slice(0, 8)}…)</span>
            </li>
          ))}
          {linkedTournaments.length === 0 ?
            <li className="text-neutral-500">Ninguno</li>
          : null}
        </ul>
        <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
          <select
            className="rounded border border-neutral-300 px-2 py-1"
            value={linkTournamentId}
            onChange={(e) => setLinkTournamentId(e.target.value)}
          >
            <option value="">— Añadir torneo —</option>
            {tournaments
              .filter((t) => !linkedTournaments.some((l) => l.id === t.id))
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            disabled={busy || !linkTournamentId}
            className="rounded border border-neutral-300 bg-neutral-50 px-2 py-1 disabled:opacity-50"
            onClick={() => void linkTournament()}
          >
            Vincular
          </button>
        </div>
      </section>

      <section className="rounded border border-neutral-200 bg-white p-3">
        <h2 className="text-[13px] font-bold">
          Participación ({participants.length})
        </h2>
        <p className="text-[11px] text-neutral-600">
          Pronósticos completos, puntos del ranking materializado y última actualización.
        </p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="p-1">Usuario</th>
                <th className="p-1">Pronósticos</th>
                <th className="p-1">Completo</th>
                <th className="p-1">Pts</th>
                <th className="p-1">Plenos</th>
                <th className="p-1">Signo</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((row) => (
                <tr key={row.user.id} className="border-b border-neutral-100">
                  <td className="p-1">
                    {row.user.username ?
                      `@${row.user.username}`
                    : row.user.name || row.user.email || "—"}
                  </td>
                  <td className="p-1">
                    {row.predictionCount}/{row.matchCount}
                  </td>
                  <td className="p-1">{row.predictionsComplete ? "Sí" : "No"}</td>
                  <td className="p-1">{row.points ?? "—"}</td>
                  <td className="p-1">{row.plenos ?? "—"}</td>
                  <td className="p-1">{row.signHits ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded border border-neutral-200 bg-white p-3">
        <h2 className="text-[13px] font-bold">
          Pronósticos de usuarios ({predictionTotal} cargados)
        </h2>
        <p className="text-[11px] text-neutral-600">
          Detalle por partido: qué marcador pronosticó cada usuario. Resultado
          oficial cuando ya está cargado.
        </p>
        <div className="mt-3 space-y-4">
          {predictionsByMatch.length === 0 ?
            <p className="text-[12px] text-neutral-500">
              No hay partidos vinculados al prode: cargá partidos abajo para que
              los usuarios puedan pronosticar.
            </p>
          : predictionsByMatch.map((block) => {
              const { match } = block;
              const official =
                match.homeScore != null && match.awayScore != null ?
                  `${match.homeScore} – ${match.awayScore}`
                : "—";
              return (
                <div
                  key={match.id}
                  className="rounded border border-neutral-100 bg-neutral-50/80 p-2"
                >
                  <p className="text-[12px] font-semibold text-neutral-900">
                    {match.homeTeam.name} vs {match.awayTeam.name}
                  </p>
                  <p className="text-[10px] text-neutral-500">
                    {new Date(match.startsAt).toLocaleString("es-AR")} ·{" "}
                    {match.status} · Oficial: {official}
                  </p>
                  {block.predictions.length === 0 ?
                    <p className="mt-2 text-[11px] text-neutral-500">
                      Nadie cargó pronóstico para este partido aún.
                    </p>
                  : (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full border-collapse text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-neutral-200 bg-white">
                            <th className="p-1.5">Usuario</th>
                            <th className="p-1.5">Pronóstico</th>
                            <th className="p-1.5">Última modificación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {block.predictions.map((pr) => (
                            <tr
                              key={`${pr.userId}-${match.id}`}
                              className="border-b border-neutral-100 bg-white"
                            >
                              <td className="p-1.5">
                                {pr.user.username ?
                                  `@${pr.user.username}`
                                : pr.user.name || pr.user.email || pr.user.id.slice(0, 8)}
                                {pr.user.email ?
                                  <span className="ml-1 block text-[10px] text-neutral-500">
                                    {pr.user.email}
                                  </span>
                                : null}
                              </td>
                              <td className="p-1.5 font-mono tabular-nums">
                                {pr.predictedHomeScore} – {pr.predictedAwayScore}
                              </td>
                              <td className="p-1.5 text-neutral-600">
                                {new Date(pr.updatedAt).toLocaleString("es-AR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </section>

      <section className="rounded border border-neutral-200 bg-white p-3">
        <h2 className="text-[13px] font-bold">Partidos en el prode ({matches.length})</h2>
        <p className="text-[11px] text-neutral-600">
          Pegá el ID del partido desde el admin del torneo (tabla Partidos).
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            className="min-w-[200px] flex-1 rounded border border-neutral-300 px-2 py-1 font-mono text-[11px]"
            placeholder="matchId (cuid)"
            value={linkMatchId}
            onChange={(e) => setLinkMatchId(e.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            className="rounded bg-neutral-900 px-2 py-1 text-white disabled:opacity-50"
            onClick={() => void linkMatch()}
          >
            Vincular partido
          </button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="p-1">ID</th>
                <th className="p-1">Local</th>
                <th className="p-1">Visita</th>
                <th className="p-1"> </th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id} className="border-b border-neutral-100">
                  <td className="p-1 font-mono">{m.id}</td>
                  <td className="p-1">{m.homeTeam.name}</td>
                  <td className="p-1">{m.awayTeam.name}</td>
                  <td className="p-1">
                    <button
                      type="button"
                      className="text-red-700 hover:underline"
                      onClick={() => void unlinkMatch(m.id)}
                    >
                      Quitar
                    </button>
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
