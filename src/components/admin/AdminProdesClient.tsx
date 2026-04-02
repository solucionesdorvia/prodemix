"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import type { AdminAfaBand, AdminProdeRecord, AdminProdeTier } from "@/state/admin-prode-types";
import {
  ADMIN_PRODE_UPDATED_EVENT,
  loadAdminProdeStorage,
} from "@/state/admin-prode-storage";
import { createProdeId, useAppState } from "@/state/app-state";

type MatchDraft = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startsAtLocal: string;
};

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function emptyMatch(id: string): MatchDraft {
  return {
    id,
    homeTeam: "",
    awayTeam: "",
    startsAtLocal: toDatetimeLocalValue(new Date().toISOString()),
  };
}

export function AdminProdesClient() {
  const { adminUpsertProdeRecord, adminDeleteProdeRecord } = useAppState();
  const [listRev, setListRev] = useState(0);

  const records = useMemo(() => {
    void listRev;
    return loadAdminProdeStorage().prodes.slice().sort((a, b) =>
      a.name.localeCompare(b.name, "es"),
    );
  }, [listRev]);

  const [selectedId, setSelectedId] = useState<string | "new">("new");
  const [name, setName] = useState("");
  const [afaBand, setAfaBand] = useState<AdminAfaBand>("A");
  const [fechaLabel, setFechaLabel] = useState("Fecha 1");
  const [tier, setTier] = useState<AdminProdeTier>("gratis");
  const [deadlineLocal, setDeadlineLocal] = useState(
    toDatetimeLocalValue(new Date().toISOString()),
  );
  const [status, setStatus] = useState<AdminProdeRecord["status"]>("open");
  const [prodeId, setProdeId] = useState<string | null>(null);
  const [syntheticTournamentId, setSyntheticTournamentId] = useState<
    string | null
  >(null);
  const [matches, setMatches] = useState<MatchDraft[]>([
    emptyMatch("tmp-m1"),
  ]);
  const [results, setResults] = useState<Record<string, { home: string; away: string }>>(
    {},
  );
  const [message, setMessage] = useState<string | null>(null);

  const bumpList = useCallback(() => setListRev((n) => n + 1), []);

  const loadRecord = useCallback(
    (r: AdminProdeRecord) => {
      setProdeId(r.id);
      setSyntheticTournamentId(r.syntheticTournamentId);
      setName(r.name);
      setAfaBand(r.afaBand);
      setFechaLabel(r.fechaLabel);
      setTier(r.tier);
      setDeadlineLocal(toDatetimeLocalValue(r.deadlineAt));
      setStatus(r.status);
      setMatches(
        r.matches.map((m) => ({
          id: m.id,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          startsAtLocal: toDatetimeLocalValue(m.startsAt),
        })),
      );
      const res: Record<string, { home: string; away: string }> = {};
      for (const [mid, sc] of Object.entries(r.results)) {
        res[mid] = { home: String(sc.home), away: String(sc.away) };
      }
      setResults(res);
    },
    [],
  );

  const resetNewForm = useCallback(() => {
    setProdeId(null);
    setSyntheticTournamentId(null);
    setName("");
    setAfaBand("A");
    setFechaLabel("Fecha 1");
    setTier("gratis");
    setDeadlineLocal(toDatetimeLocalValue(new Date().toISOString()));
    setStatus("open");
    const nid = `tmp-${Date.now()}`;
    setMatches([emptyMatch(`${nid}-m1`)]);
    setResults({});
  }, []);

  const handleSelectProde = useCallback(
    (value: string) => {
      if (value === "new") {
        setSelectedId("new");
        resetNewForm();
        return;
      }
      setSelectedId(value);
      const r = loadAdminProdeStorage().prodes.find((x) => x.id === value);
      if (r) loadRecord(r);
    },
    [loadRecord, resetNewForm],
  );

  const handleSave = () => {
    setMessage(null);
    const id = prodeId ?? createProdeId();
    const syn = syntheticTournamentId ?? `admin-t-${id}`;
    const matchEntities = matches.map((m, i) => {
      const mid =
        m.id.startsWith("tmp-") ? `admin-${id}-m-${i + 1}` : m.id;
      return {
        id: mid,
        homeTeam: m.homeTeam.trim() || `Local ${i + 1}`,
        awayTeam: m.awayTeam.trim() || `Visita ${i + 1}`,
        startsAt: fromDatetimeLocal(m.startsAtLocal),
      };
    });
    const idMap = new Map(matches.map((m, i) => [m.id, matchEntities[i]!.id]));
    const resultsNum: Record<string, { home: number; away: number }> = {};
    for (const [k, v] of Object.entries(results)) {
      const nk = idMap.get(k) ?? k;
      const h = Number.parseInt(v.home, 10);
      const a = Number.parseInt(v.away, 10);
      if (!Number.isNaN(h) && !Number.isNaN(a)) {
        resultsNum[nk] = { home: h, away: a };
      }
    }
    const record: AdminProdeRecord = {
      id,
      name: name.trim() || "Prode sin nombre",
      createdAt:
        records.find((x) => x.id === id)?.createdAt ?? new Date().toISOString(),
      syntheticTournamentId: syn,
      afaBand,
      fechaLabel: fechaLabel.trim() || "Fecha",
      tier,
      deadlineAt: fromDatetimeLocal(deadlineLocal),
      status,
      matches: matchEntities,
      results: resultsNum,
    };
    adminUpsertProdeRecord(record);
    loadRecord(record);
    setSelectedId(id);
    setMessage("Guardado. Aparece en la app bajo Prodes.");
    bumpList();
  };

  const handleDelete = () => {
    if (!prodeId) return;
    if (!window.confirm("¿Eliminar este prode del admin y de la lista local?"))
      return;
    adminDeleteProdeRecord(prodeId);
    setMessage("Eliminado.");
    bumpList();
    resetNewForm();
    setSelectedId("new");
  };

  const recalcRanking = () => {
    window.dispatchEvent(new Event(ADMIN_PRODE_UPDATED_EVENT));
    setMessage("Vistas de ranking refrescadas (cliente).");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      <header className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
          Interno
        </p>
        <h1 className="text-xl font-bold text-neutral-900">Admin · Prodes</h1>
        <p className="text-[13px] text-neutral-600">
          Control manual: fixture, estado, resultados. Datos en{" "}
          <code className="rounded bg-neutral-200 px-1 text-[12px]">localStorage</code>{" "}
          de este navegador.
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold">
          <Link href="/admin/dashboard" className="text-blue-700 hover:underline">
            Panel
          </Link>
          <Link href="/admin/prodes" className="text-blue-700 hover:underline">
            Prodes (DB)
          </Link>
          <Link href="/" className="text-blue-700 hover:underline">
            App
          </Link>
        </div>
      </header>

      {message ?
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-900">
          {message}
        </p>
      : null}

      {prodeId ?
        <p className="text-[12px] text-neutral-600">
          Vista jugador:{" "}
          <Link
            href={`/prodes/${encodeURIComponent(prodeId)}`}
            className="font-semibold text-blue-700 hover:underline"
          >
            /prodes/{prodeId}
          </Link>
        </p>
      : null}

      <section className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <label className="block text-[12px] font-semibold text-neutral-700">
          Prode existente
        </label>
        <select
          className="w-full rounded border border-neutral-300 px-2 py-2 text-[13px]"
          value={selectedId}
          onChange={(e) => handleSelectProde(e.target.value)}
        >
          <option value="new">— Nuevo —</option>
          {records.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.afaBand} · {r.fechaLabel})
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="text-[14px] font-bold text-neutral-900">1. Datos del prode</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-[12px]">
            <span className="font-semibold text-neutral-700">Nombre</span>
            <input
              className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-[13px]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Prode oficina marzo"
            />
          </label>
          <label className="block text-[12px]">
            <span className="font-semibold text-neutral-700">Torneo AFA</span>
            <select
              className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-[13px]"
              value={afaBand}
              onChange={(e) => setAfaBand(e.target.value as AdminAfaBand)}
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </label>
          <label className="block text-[12px]">
            <span className="font-semibold text-neutral-700">Fecha (label)</span>
            <input
              className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-[13px]"
              value={fechaLabel}
              onChange={(e) => setFechaLabel(e.target.value)}
            />
          </label>
          <label className="block text-[12px]">
            <span className="font-semibold text-neutral-700">Tipo</span>
            <select
              className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-[13px]"
              value={tier}
              onChange={(e) => setTier(e.target.value as AdminProdeTier)}
            >
              <option value="gratis">Gratis</option>
              <option value="elite">Elite</option>
            </select>
          </label>
          <label className="block text-[12px] sm:col-span-2">
            <span className="font-semibold text-neutral-700">
              Cierre de pronósticos (deadline)
            </span>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-[13px]"
              value={deadlineLocal}
              onChange={(e) => setDeadlineLocal(e.target.value)}
            />
          </label>
          <label className="block text-[12px] sm:col-span-2">
            <span className="font-semibold text-neutral-700">Estado</span>
            <select
              className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-[13px]"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as AdminProdeRecord["status"])
              }
            >
              <option value="open">Abierto (se puede pronosticar)</option>
              <option value="closed">Cerrado (sin pronósticos)</option>
              <option value="finalized">Finalizado</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[14px] font-bold text-neutral-900">2. Partidos</h2>
          <button
            type="button"
            className="rounded border border-neutral-300 bg-neutral-50 px-2 py-1 text-[12px] font-semibold"
            onClick={() =>
              setMatches((m) => [
                ...m,
                emptyMatch(`tmp-${Date.now()}-${m.length}`),
              ])
            }
          >
            + Partido
          </button>
        </div>
        <ul className="space-y-3">
          {matches.map((m, idx) => (
            <li
              key={m.id}
              className="rounded border border-neutral-100 bg-neutral-50/80 p-3"
            >
              <p className="mb-2 text-[11px] font-semibold text-neutral-500">
                Partido {idx + 1}{" "}
                <code className="text-[10px] text-neutral-600">{m.id}</code>
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className="rounded border border-neutral-300 px-2 py-1.5 text-[13px]"
                  placeholder="Local"
                  value={m.homeTeam}
                  onChange={(e) =>
                    setMatches((rows) =>
                      rows.map((row) =>
                        row.id === m.id ?
                          { ...row, homeTeam: e.target.value }
                        : row,
                      ),
                    )
                  }
                />
                <input
                  className="rounded border border-neutral-300 px-2 py-1.5 text-[13px]"
                  placeholder="Visita"
                  value={m.awayTeam}
                  onChange={(e) =>
                    setMatches((rows) =>
                      rows.map((row) =>
                        row.id === m.id ?
                          { ...row, awayTeam: e.target.value }
                        : row,
                      ),
                    )
                  }
                />
                <label className="block text-[11px] sm:col-span-2">
                  <span className="font-semibold text-neutral-600">
                    Inicio (fecha/hora)
                  </span>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-[13px]"
                    value={m.startsAtLocal}
                    onChange={(e) =>
                      setMatches((rows) =>
                        rows.map((row) =>
                          row.id === m.id ?
                            { ...row, startsAtLocal: e.target.value }
                          : row,
                        ),
                      )
                    }
                  />
                </label>
              </div>
              <div className="mt-2 border-t border-neutral-200 pt-2">
                <p className="text-[11px] font-semibold text-neutral-600">
                  Resultado final (opcional)
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    className="w-16 rounded border border-neutral-300 px-1 py-1 text-[13px]"
                    placeholder="L"
                    value={results[m.id]?.home ?? ""}
                    onChange={(e) =>
                      setResults((r) => ({
                        ...r,
                        [m.id]: {
                          home: e.target.value,
                          away: r[m.id]?.away ?? "",
                        },
                      }))
                    }
                  />
                  <span className="text-neutral-400">—</span>
                  <input
                    type="number"
                    min={0}
                    className="w-16 rounded border border-neutral-300 px-1 py-1 text-[13px]"
                    placeholder="V"
                    value={results[m.id]?.away ?? ""}
                    onChange={(e) =>
                      setResults((r) => ({
                        ...r,
                        [m.id]: {
                          home: r[m.id]?.home ?? "",
                          away: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-neutral-800"
          onClick={handleSave}
        >
          Guardar prode
        </button>
        <button
          type="button"
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-[13px] font-semibold"
          onClick={recalcRanking}
        >
          Refrescar ranking (UI)
        </button>
        {prodeId ?
          <button
            type="button"
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-[13px] font-semibold text-red-900"
            onClick={handleDelete}
          >
            Eliminar
          </button>
        : null}
      </div>
    </div>
  );
}
