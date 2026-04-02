"use client";

import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";

import { AdminCard } from "./AdminCard";
import { AdminField } from "./AdminForm";
import { AdminTable, AdminTd, AdminTh } from "./AdminTable";

type UserRow = {
  id: string;
  email: string | null;
  username: string | null;
  name: string | null;
  role: string;
  bannedAt: string | null;
  createdAt: string;
};

export function AdminUsersClient() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
      const data = await adminFetch<{ users: UserRow[] }>(
        `/api/admin/users${qs}`,
      );
      setUsers(data.users);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
    // Carga inicial; la búsqueda se dispara con el botón.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setRole = async (id: string, role: "user" | "admin") => {
    setBusyId(id);
    setErr(null);
    try {
      await adminFetch(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusyId(null);
    }
  };

  const toggleBan = async (id: string, banned: boolean) => {
    setBusyId(id);
    setErr(null);
    try {
      await adminFetch(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          bannedAt: banned ? new Date().toISOString() : null,
        }),
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-neutral-900">Usuarios</h1>
        <p className="text-[13px] text-neutral-600">
          Búsqueda por email, usuario o nombre. Rol y suspensión.
        </p>
      </div>

      <AdminCard title="Buscar">
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void load();
          }}
        >
          <AdminField label="Texto">
            <input
              className="w-full max-w-md rounded border border-neutral-300 px-2 py-1.5 text-[13px]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="email, @usuario o nombre"
            />
          </AdminField>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-3 py-2 text-[13px] font-semibold text-white"
          >
            Buscar
          </button>
        </form>
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
              <AdminTh>Email</AdminTh>
              <AdminTh>Usuario</AdminTh>
              <AdminTh>Rol</AdminTh>
              <AdminTh>Estado</AdminTh>
              <AdminTh>Alta</AdminTh>
              <AdminTh>Acciones</AdminTh>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <AdminTd>{u.email ?? "—"}</AdminTd>
                <AdminTd>{u.username ? `@${u.username}` : "—"}</AdminTd>
                <AdminTd>{u.role}</AdminTd>
                <AdminTd>{u.bannedAt ? "Suspendido" : "OK"}</AdminTd>
                <AdminTd className="whitespace-nowrap text-[12px] text-neutral-600">
                  {new Date(u.createdAt).toLocaleDateString("es-AR")}
                </AdminTd>
                <AdminTd className="space-x-1 whitespace-nowrap">
                  {u.role === "admin" ?
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      className="rounded border border-neutral-300 px-2 py-1 text-[11px] font-semibold hover:bg-neutral-50 disabled:opacity-50"
                      onClick={() => void setRole(u.id, "user")}
                    >
                      Quitar admin
                    </button>
                  : <button
                      type="button"
                      disabled={busyId === u.id}
                      className="rounded border border-neutral-300 px-2 py-1 text-[11px] font-semibold hover:bg-neutral-50 disabled:opacity-50"
                      onClick={() => void setRole(u.id, "admin")}
                    >
                      Hacer admin
                    </button>}
                  <button
                    type="button"
                    disabled={busyId === u.id}
                    className="rounded border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50"
                    onClick={() => void toggleBan(u.id, !u.bannedAt)}
                  >
                    {u.bannedAt ? "Reactivar" : "Suspender"}
                  </button>
                </AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
