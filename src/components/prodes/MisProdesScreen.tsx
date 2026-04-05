"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  EmptyState,
  EmptyStateButtonLink,
} from "@/components/ui/EmptyState";
import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";

import { MisProdesServerSection } from "./MisProdesServerSection";

export function MisProdesScreen() {
  const { hydrated, loggedIn } = useAuth();

  if (!hydrated) {
    return (
      <p className="py-10 text-center text-[13px] text-app-muted">Cargando…</p>
    );
  }

  return (
    <div className="pb-2">
      <Link
        href="/"
        className="mb-2 inline-flex items-center gap-1 text-[12px] font-semibold text-app-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Inicio
      </Link>

      <header className={pageHeader}>
        <p className={pageEyebrow}>Cuenta</p>
        <h1 className={pageTitle}>Mis prodes</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-app-muted">
          Acá están los prodes en los que entraste con tu cuenta:{" "}
          <span className="font-medium text-app-text">próximos</span> (abiertos
          al pronóstico),{" "}
          <span className="font-medium text-app-text">en juego</span> (ya cerró
          la carga; ranking y goles según la base) y{" "}
          <span className="font-medium text-app-text">finalizados</span>. En
          cada fila: resumen pronóstico vs resultado, top 5 y tu posición. Dentro
          del prode: todos los partidos con tu pronóstico y el marcador real, y la
          tabla completa.
        </p>
      </header>

      {loggedIn ?
        <MisProdesServerSection className="mt-3" omitSectionHeader />
      : (
        <EmptyState
          className="mt-4"
          variant="soft"
          layout="horizontal"
          title="Iniciá sesión"
          description="Para ver los prodes en los que participás y tus puntos sincronizados."
        >
          <EmptyStateButtonLink href="/login">Iniciar sesión</EmptyStateButtonLink>
        </EmptyState>
      )}
    </div>
  );
}
