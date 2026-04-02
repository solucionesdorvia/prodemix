import Link from "next/link";

import { AdminCard } from "@/components/admin/AdminCard";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const prisma = getPrisma();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [userCount, activeProdes, closingToday] = await Promise.all([
    prisma.user.count(),
    prisma.prode.count({ where: { status: "OPEN" } }),
    prisma.prode.count({
      where: {
        status: "OPEN",
        closesAt: { gte: todayStart, lt: todayEnd },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-neutral-900">Dashboard</h1>
        <p className="text-[13px] text-neutral-600">
          Resumen y accesos rápidos a operaciones frecuentes.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminCard title="Usuarios registrados">
          <p className="text-2xl font-bold tabular-nums text-neutral-900">{userCount}</p>
        </AdminCard>
        <AdminCard title="Prodes abiertos">
          <p className="text-2xl font-bold tabular-nums text-neutral-900">{activeProdes}</p>
        </AdminCard>
        <AdminCard title="Cierran hoy">
          <p className="text-2xl font-bold tabular-nums text-neutral-900">{closingToday}</p>
        </AdminCard>
      </div>

      <AdminCard title="Acciones rápidas">
        <ul className="flex flex-wrap gap-2 text-[13px] font-semibold">
          <li>
            <Link
              className="inline-block rounded-md bg-neutral-900 px-3 py-2 text-white hover:bg-neutral-800"
              href="/admin/tournaments"
            >
              Crear / editar torneo
            </Link>
          </li>
          <li>
            <Link
              className="inline-block rounded-md bg-neutral-900 px-3 py-2 text-white hover:bg-neutral-800"
              href="/admin/prodes/new"
            >
              Crear prode
            </Link>
          </li>
          <li>
            <Link
              className="inline-block rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 hover:bg-neutral-50"
              href="/admin/results"
            >
              Cargar resultados
            </Link>
          </li>
        </ul>
      </AdminCard>
    </div>
  );
}
