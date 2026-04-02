"use client";

import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";

import { AdminCard } from "./AdminCard";
import { AdminField } from "./AdminForm";
import { AdminTable, AdminTd, AdminTh } from "./AdminTable";

type Tournament = { id: string; name: string; slug: string };
type TeamRow = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  tournament: { name: string; slug: string };
};

export function AdminTeamsClient() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentId, setTournamentId] = useState("");
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTournaments = useCallback(async () => {
    const data = await adminFetch<{ tournaments: Tournament[] }>(
      "/api/admin/tournaments",
    );
    setTournaments(data.tournaments);
  }, []);

  const loadTeams = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const q = tournamentId ?
        `?tournamentId=${encodeURIComponent(tournamentId)}`
      : "";
      const data = await adminFetch<{ teams: TeamRow[] }>(
        `/api/admin/teams${q}`,
      );
      setTeams(data.teams);
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
    void loadTeams();
  }, [loadTeams]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-neutral-900">Equipos</h1>
        <p className="text-[13px] text-neutral-600">
          Equipos por torneo. Creación y edición desde cada torneo.
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
            onClick={() => void loadTeams()}
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
              <AdminTh>Equipo</AdminTh>
              <AdminTh>Slug</AdminTh>
              <AdminTh>Torneo</AdminTh>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id}>
                <AdminTd className="font-medium">{t.name}</AdminTd>
                <AdminTd className="font-mono text-[12px]">{t.slug}</AdminTd>
                <AdminTd>{t.tournament.name}</AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
