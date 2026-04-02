"use client";

import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";

import { AdminCard } from "./AdminCard";
import { AdminField } from "./AdminForm";
import { AdminTable, AdminTd, AdminTh } from "./AdminTable";

type Tournament = { id: string; name: string; slug: string };
type MatchRow = {
  id: string;
  startsAt: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
  tournament: { name: string; slug: string };
  matchday: { name: string };
};

export function AdminMatchesClient() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentId, setTournamentId] = useState("");
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTournaments = useCallback(async () => {
    const data = await adminFetch<{ tournaments: Tournament[] }>(
      "/api/admin/tournaments",
    );
    setTournaments(data.tournaments);
  }, []);

  const loadMatches = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const q = tournamentId ?
        `?tournamentId=${encodeURIComponent(tournamentId)}`
      : "";
      const data = await adminFetch<{ matches: MatchRow[] }>(
        `/api/admin/matches${q}`,
      );
      setMatches(data.matches);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    void loadTournaments().catch(() => {});
  }, [loadTournaments]);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-neutral-900">Partidos</h1>
        <p className="text-[13px] text-neutral-600">
          Catálogo de partidos por torneo (últimos primero).
        </p>
      </div>

      <AdminCard title="Filtro">
        <div className="flex flex-wrap items-end gap-3">
          <AdminField label="Torneo">
            <select
              className="w-full max-w-xs rounded border border-neutral-300 px-2 py-1.5 text-[13px]"
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
            >
              <option value="">Todos</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </AdminField>
          <button
            type="button"
            className="rounded-md bg-neutral-900 px-3 py-2 text-[13px] font-semibold text-white"
            onClick={() => void loadMatches()}
          >
            Actualizar
          </button>
        </div>
      </AdminCard>

      {err ?
        <p className="text-[13px] text-red-700">{err}</p>
      : null}

      {loading ?
        <p className="text-[13px] text-neutral-600">Cargando…</p>
      : (
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Fecha / estado</AdminTh>
              <AdminTh>Torneo</AdminTh>
              <AdminTh>Partido</AdminTh>
              <AdminTh>Resultado</AdminTh>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id}>
                <AdminTd>
                  {new Date(m.startsAt).toLocaleString("es-AR")}
                  <span className="ml-2 text-[11px] text-neutral-500">
                    {m.status}
                  </span>
                </AdminTd>
                <AdminTd>{m.tournament.name}</AdminTd>
                <AdminTd>
                  {m.homeTeam.name} vs {m.awayTeam.name}
                  <div className="text-[11px] text-neutral-500">
                    {m.matchday.name}
                  </div>
                </AdminTd>
                <AdminTd>
                  {m.homeScore != null && m.awayScore != null ?
                    `${m.homeScore} – ${m.awayScore}`
                  : "—"}
                </AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
