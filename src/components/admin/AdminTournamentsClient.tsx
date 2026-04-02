"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { slugify } from "@/lib/admin/slug";
import { adminFetch } from "@/lib/admin/admin-fetch";

type Row = {
  id: string;
  slug: string;
  name: string;
  category: string;
  isActive: boolean;
  _count: { teams: number; matchdays: number; matches: number };
};

export function AdminTournamentsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("liga");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const data = await adminFetch<{ tournaments: Row[] }>(
        "/api/admin/tournaments",
      );
      setRows(data.tournaments);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const s = slug.trim() || slugify(name);
      await adminFetch("/api/admin/tournaments", {
        method: "POST",
        body: JSON.stringify({
          slug: s,
          name: name.trim() || "Sin nombre",
          category: category.trim() || "liga",
        }),
      });
      setName("");
      setSlug("");
      setMsg("Torneo creado.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold">Torneos</h1>
        <button
          type="button"
          className="rounded border border-neutral-300 bg-white px-2 py-1 text-[12px] font-semibold"
          onClick={() => void load()}
        >
          Actualizar
        </button>
      </div>
      {err ?
        <p className="text-[13px] text-red-700">{err}</p>
      : null}
      {msg ?
        <p className="text-[13px] text-green-800">{msg}</p>
      : null}

      <form
        onSubmit={onSubmit}
        className="grid gap-2 rounded border border-neutral-200 bg-white p-3 text-[12px] sm:grid-cols-4"
      >
        <label className="sm:col-span-2">
          <span className="font-semibold">Nombre</span>
          <input
            className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          <span className="font-semibold">Slug</span>
          <input
            className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 font-mono text-[11px]"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto"
          />
        </label>
        <label>
          <span className="font-semibold">Categoría</span>
          <input
            className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </label>
        <div className="sm:col-span-4">
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-neutral-900 px-3 py-1.5 text-white disabled:opacity-50"
          >
            Crear torneo
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded border border-neutral-200 bg-white">
        <table className="w-full min-w-[640px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="p-2 font-semibold">Nombre</th>
              <th className="p-2 font-semibold">Slug</th>
              <th className="p-2 font-semibold">Equipos</th>
              <th className="p-2 font-semibold">Fechas</th>
              <th className="p-2 font-semibold">Partidos</th>
              <th className="p-2 font-semibold"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-neutral-100">
                <td className="p-2">{r.name}</td>
                <td className="p-2 font-mono text-[11px]">{r.slug}</td>
                <td className="p-2 tabular-nums">{r._count.teams}</td>
                <td className="p-2 tabular-nums">{r._count.matchdays}</td>
                <td className="p-2 tabular-nums">{r._count.matches}</td>
                <td className="p-2">
                  <Link
                    href={`/admin/tournaments/${encodeURIComponent(r.id)}`}
                    className="text-blue-700 hover:underline"
                  >
                    Gestionar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !err ?
          <p className="p-4 text-[13px] text-neutral-500">Sin torneos.</p>
        : null}
      </div>
    </div>
  );
}
