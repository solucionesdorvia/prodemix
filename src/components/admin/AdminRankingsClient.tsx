"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";

import { AdminCard } from "./AdminCard";
import { AdminField } from "./AdminForm";
import { AdminTable, AdminTd, AdminTh } from "./AdminTable";

type ProdeOpt = { id: string; slug: string; title: string };
type RankRow = {
  rank: number | null;
  points: number;
  plenos: number;
  signHits: number;
  user: {
    id: string;
    email: string | null;
    username: string | null;
    name: string | null;
  };
};

export function AdminRankingsClient() {
  const [prodes, setProdes] = useState<ProdeOpt[]>([]);
  const [prodeId, setProdeId] = useState("");
  const [title, setTitle] = useState<string | null>(null);
  const [rows, setRows] = useState<RankRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recalcBusy, setRecalcBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<{ prodes: ProdeOpt[] }>("/api/admin/prodes");
        setProdes(data.prodes);
      } catch {
        setProdes([]);
      }
    })();
  }, []);

  const loadRanking = useCallback(async () => {
    if (!prodeId) {
      setRows([]);
      setTitle(null);
      return;
    }
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const data = await adminFetch<{
        prode: { title: string };
        ranking: RankRow[];
      }>(
        `/api/admin/rankings?prodeId=${encodeURIComponent(prodeId)}`,
      );
      setTitle(data.prode.title);
      setRows(data.ranking);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [prodeId]);

  useEffect(() => {
    void loadRanking();
  }, [loadRanking]);

  const recalc = async () => {
    if (!prodeId) return;
    setRecalcBusy(true);
    setMsg(null);
    setErr(null);
    try {
      await adminFetch("/api/admin/recalculate", {
        method: "POST",
        body: JSON.stringify({ prodeId }),
      });
      setMsg("Ranking recalculado.");
      await loadRanking();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setRecalcBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-neutral-900">Rankings</h1>
        <p className="text-[13px] text-neutral-600">
          Tabla materializada por prode. Recalcular tras cargar resultados.
        </p>
      </div>

      <AdminCard title="Prode">
        <div className="flex flex-wrap items-end gap-3">
          <AdminField label="Seleccionar prode">
            <select
              className="w-full max-w-lg rounded border border-neutral-300 px-2 py-1.5 text-[13px]"
              value={prodeId}
              onChange={(e) => setProdeId(e.target.value)}
            >
              <option value="">—</option>
              {prodes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.slug})
                </option>
              ))}
            </select>
          </AdminField>
          <button
            type="button"
            className="rounded-md bg-neutral-200 px-3 py-2 text-[13px] font-semibold text-neutral-900 disabled:opacity-50"
            disabled={!prodeId || recalcBusy}
            onClick={() => void recalc()}
          >
            {recalcBusy ? "…" : "Recalcular ranking"}
          </button>
        </div>
        {title ?
          <p className="mt-2 text-[13px] text-neutral-700">
            Mostrando: <strong>{title}</strong> ·{" "}
            <Link
              className="text-blue-700 underline"
              href={`/admin/prodes/${encodeURIComponent(prodeId)}`}
            >
              Editar prode
            </Link>
          </p>
        : null}
      </AdminCard>

      {msg ?
        <p className="text-[13px] text-green-800">{msg}</p>
      : null}
      {err ?
        <p className="text-[13px] text-red-700">{err}</p>
      : null}

      {loading ?
        <p className="text-[13px] text-neutral-600">Cargando…</p>
      : rows.length === 0 && prodeId ?
        <p className="text-[13px] text-neutral-600">Sin filas en el ranking.</p>
      : rows.length === 0 ? null : (
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>#</AdminTh>
              <AdminTh>Usuario</AdminTh>
              <AdminTh>Puntos</AdminTh>
              <AdminTh>Plenos</AdminTh>
              <AdminTh>Aciertos (signo)</AdminTh>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.user.id}>
                <AdminTd>{r.rank ?? i + 1}</AdminTd>
                <AdminTd>
                  {r.user.username ?
                    `@${r.user.username}`
                  : r.user.name || r.user.email || "—"}
                </AdminTd>
                <AdminTd>{r.points}</AdminTd>
                <AdminTd>{r.plenos}</AdminTd>
                <AdminTd>{r.signHits}</AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
