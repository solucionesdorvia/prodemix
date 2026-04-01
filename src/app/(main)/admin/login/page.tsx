"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/admin/prodes";
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(
          data.error === "ADMIN_SECRET not configured" ?
            "Falta ADMIN_SECRET en el servidor."
          : "Clave incorrecta.",
        );
        return;
      }
      router.replace(from.startsWith("/admin") ? from : "/admin/prodes");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm space-y-4 pt-8">
      <h1 className="text-lg font-bold text-neutral-900">Admin · acceso</h1>
      <p className="text-[13px] text-neutral-600">
        Uso interno. Configurá{" "}
        <code className="rounded bg-neutral-200 px-1 text-[12px]">
          ADMIN_SECRET
        </code>{" "}
        en el entorno del servidor.
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-[12px] font-semibold text-neutral-700">
          Clave
          <input
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-[14px]"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
        </label>
        {error ?
          <p className="text-[13px] text-red-700">{error}</p>
        : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-neutral-900 py-2.5 text-[14px] font-semibold text-white disabled:opacity-60"
        >
          {loading ? "…" : "Entrar"}
        </button>
      </form>
      <Link
        href="/"
        className="inline-block text-[12px] font-semibold text-blue-700 hover:underline"
      >
        ← Inicio
      </Link>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-sm pt-8 text-[13px] text-neutral-600">
          Cargando…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
