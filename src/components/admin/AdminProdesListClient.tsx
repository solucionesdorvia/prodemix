"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";

type Row = {
  id: string;
  slug: string;
  title: string;
  type: string;
  status: string;
  seasonLabel: string | null;
  closesAt: string;
  updatedAt: string;
  _count: { prodeMatches: number; entries: number };
};

export function AdminProdesListClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const data = await adminFetch<{ prodes: Row[] }>("/api/admin/prodes");
      setRows(data.prodes);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold">Prodes</h1>
        <div className="flex gap-2 text-[12px] font-semibold">
          <button
            type="button"
            className="rounded border border-neutral-300 bg-white px-2 py-1"
            onClick={() => void load()}
          >
            Actualizar
          </button>
          <Link
            href="/admin/prodes/new"
            className="rounded bg-neutral-900 px-3 py-1 text-white"
          >
            Nuevo prode
          </Link>
        </div>
      </div>
      {err ?
        <p className="text-[13px] text-red-700">{err}</p>
      : null}
      <div className="overflow-x-auto rounded border border-neutral-200 bg-white">
        <table className="w-full min-w-[640px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="p-2 font-semibold">Título</th>
              <th className="p-2 font-semibold">Slug</th>
              <th className="p-2 font-semibold">Tipo</th>
              <th className="p-2 font-semibold">Estado</th>
              <th className="p-2 font-semibold">Fecha label</th>
              <th className="p-2 font-semibold">Partidos</th>
              <th className="p-2 font-semibold">Entradas</th>
              <th className="p-2 font-semibold">Cierre</th>
              <th className="p-2 font-semibold"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-neutral-100">
                <td className="p-2 font-medium">{r.title}</td>
                <td className="p-2 font-mono text-[11px]">{r.slug}</td>
                <td className="p-2">{r.type}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.seasonLabel ?? "—"}</td>
                <td className="p-2 tabular-nums">{r._count.prodeMatches}</td>
                <td className="p-2 tabular-nums">{r._count.entries}</td>
                <td className="p-2 whitespace-nowrap text-[11px]">
                  {new Date(r.closesAt).toLocaleString("es-AR")}
                </td>
                <td className="p-2">
                  <Link
                    href={`/admin/prodes/${encodeURIComponent(r.id)}`}
                    className="text-blue-700 hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !err ?
          <p className="p-4 text-[13px] text-neutral-500">Sin prodes.</p>
        : null}
      </div>
    </div>
  );
}
