"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";

import { AdminCard } from "./AdminCard";
import { AdminTable, AdminTd, AdminTh } from "./AdminTable";

type ReferralUserRow = {
  id: string;
  email: string | null;
  username: string | null;
  name: string | null;
  referralCode: string | null;
  referralCount: number;
  hasFreeEntry: boolean;
  bannedAt: string | null;
  createdAt: string;
};

function displayLabel(u: ReferralUserRow): string {
  if (u.username) return `@${u.username}`;
  if (u.name?.trim()) return u.name.trim();
  return u.email ?? u.id.slice(0, 8);
}

export function AdminReferralsClient() {
  const [users, setUsers] = useState<ReferralUserRow[]>([]);
  const [referralRowsCount, setReferralRowsCount] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const data = await adminFetch<{
        users: ReferralUserRow[];
        referralRowsCount: number;
      }>("/api/admin/referrals?take=150");
      setUsers(data.users);
      setReferralRowsCount(data.referralRowsCount);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const withReferrals = users.filter((u) => u.referralCount > 0).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-neutral-900">Referidos</h1>
        <p className="text-[13px] text-neutral-600">
          Usuarios ordenados por cantidad de invitaciones válidas (campo{" "}
          <code className="rounded bg-neutral-200 px-1 text-[12px]">referralCount</code>
          ).
        </p>
      </div>

      {referralRowsCount !== null ?
        <AdminCard title="Resumen">
          <p className="text-[13px] text-neutral-700">
            Registros en tabla <span className="font-mono">Referral</span>:{" "}
            <strong>{referralRowsCount}</strong>
            {" · "}
            Usuarios en este ranking con al menos 1 referido:{" "}
            <strong>{withReferrals}</strong> (top {users.length} filas)
          </p>
        </AdminCard>
      : null}

      {err ?
        <p className="text-[13px] text-red-700">{err}</p>
      : null}

      {loading ?
        <p className="text-[13px] text-neutral-600">Cargando…</p>
      : (
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>#</AdminTh>
              <AdminTh>Usuario</AdminTh>
              <AdminTh>Email</AdminTh>
              <AdminTh className="text-right">Referidos</AdminTh>
              <AdminTh>Código</AdminTh>
              <AdminTh>Entrada gratis</AdminTh>
              <AdminTh>Estado</AdminTh>
              <AdminTh>Acciones</AdminTh>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id}>
                <AdminTd className="tabular-nums text-neutral-500">{i + 1}</AdminTd>
                <AdminTd className="font-medium">{displayLabel(u)}</AdminTd>
                <AdminTd className="max-w-[14rem] truncate text-[12px] text-neutral-600">
                  {u.email ?? "—"}
                </AdminTd>
                <AdminTd className="text-right font-semibold tabular-nums">
                  {u.referralCount}
                </AdminTd>
                <AdminTd className="font-mono text-[12px]">
                  {u.referralCode ?? "—"}
                </AdminTd>
                <AdminTd>{u.hasFreeEntry ? "Sí" : "No"}</AdminTd>
                <AdminTd>{u.bannedAt ? "Suspendido" : "OK"}</AdminTd>
                <AdminTd>
                  <Link
                    href={`/admin/users?q=${encodeURIComponent(u.email ?? u.username ?? u.id)}`}
                    className="text-[12px] font-semibold text-neutral-900 underline"
                  >
                    Ver en usuarios
                  </Link>
                </AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
