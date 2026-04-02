"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(s: string): string {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function AdminProdeNewClient() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<
    { id: string; slug: string; name: string }[]
  >([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<"FREE" | "ELITE">("FREE");
  const [seasonLabel, setSeasonLabel] = useState("");
  const [closesAt, setClosesAt] = useState(() =>
    toDatetimeLocal(new Date(Date.now() + 864e5).toISOString()),
  );
  const [status, setStatus] = useState<
    "DRAFT" | "OPEN" | "CLOSED" | "FINALIZED" | "CANCELLED"
  >("DRAFT");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [prize1, setPrize1] = useState("");
  const [prize2, setPrize2] = useState("");
  const [prize3, setPrize3] = useState("");
  const [entryFee, setEntryFee] = useState("0");
  const [tournamentId, setTournamentId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<{ tournaments: { id: string; slug: string; name: string }[] }>(
          "/api/admin/tournaments",
        );
        setTournaments(data.tournaments);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        title: title.trim() || "Sin título",
        type,
        seasonLabel: seasonLabel.trim() || null,
        closesAt: fromDatetimeLocal(closesAt),
        status,
        visibility,
        entryFeeArs: Number.parseInt(entryFee, 10) || 0,
      };
      if (slug.trim()) body.slug = slug.trim();
      if (prize1.trim()) body.prizeFirstArs = Number.parseInt(prize1, 10);
      if (prize2.trim()) body.prizeSecondArs = Number.parseInt(prize2, 10);
      if (prize3.trim()) body.prizeThirdArs = Number.parseInt(prize3, 10);
      if (tournamentId) body.tournamentId = tournamentId;

      const res = await adminFetch<{ prode: { id: string } }>("/api/admin/prodes", {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.push(`/admin/prodes/${encodeURIComponent(res.prode.id)}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl space-y-3">
      <h1 className="text-lg font-bold">Nuevo prode</h1>
      <Link href="/admin/prodes" className="text-[12px] text-blue-700 hover:underline">
        ← Lista
      </Link>
      {msg ?
        <p className="text-[13px] text-red-700">{msg}</p>
      : null}
      <form onSubmit={onSubmit} className="space-y-2 rounded border border-neutral-200 bg-white p-3 text-[13px]">
        <label className="block">
          <span className="font-semibold">Título</span>
          <input
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="font-semibold">Slug (opcional)</span>
          <input
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 font-mono text-[12px]"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto desde título"
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="font-semibold">Tipo</span>
            <select
              className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
              value={type}
              onChange={(e) => setType(e.target.value as "FREE" | "ELITE")}
            >
              <option value="FREE">FREE</option>
              <option value="ELITE">ELITE</option>
            </select>
          </label>
          <label className="block">
            <span className="font-semibold">Estado</span>
            <select
              className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as typeof status)
              }
            >
              <option value="DRAFT">DRAFT</option>
              <option value="OPEN">OPEN</option>
              <option value="CLOSED">CLOSED</option>
              <option value="FINALIZED">FINALIZED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="font-semibold">Label fecha / temporada</span>
          <input
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
            value={seasonLabel}
            onChange={(e) => setSeasonLabel(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="font-semibold">Cierra pronósticos</span>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="font-semibold">Visibilidad</span>
          <select
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as "PUBLIC" | "PRIVATE")
            }
          >
            <option value="PUBLIC">PUBLIC</option>
            <option value="PRIVATE">PRIVATE</option>
          </select>
        </label>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="block">
            <span className="font-semibold">Premio 1 (ARS)</span>
            <input
              type="number"
              className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
              value={prize1}
              onChange={(e) => setPrize1(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="font-semibold">Premio 2</span>
            <input
              type="number"
              className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
              value={prize2}
              onChange={(e) => setPrize2(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="font-semibold">Premio 3</span>
            <input
              type="number"
              className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
              value={prize3}
              onChange={(e) => setPrize3(e.target.value)}
            />
          </label>
        </div>
        <label className="block">
          <span className="font-semibold">Costo entrada ARS (futuro)</span>
          <input
            type="number"
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="font-semibold">Vincular torneo (opcional)</span>
          <select
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
            value={tournamentId}
            onChange={(e) => setTournamentId(e.target.value)}
          >
            <option value="">— Ninguno —</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.slug})
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Crear prode"}
        </button>
      </form>
    </div>
  );
}
