"use client";

import Link from "next/link";
import {
  Bell,
  ChevronRight,
  LogOut,
  Pencil,
  Star,
  Trophy,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSession, useSession } from "next-auth/react";

import type { PublicPool } from "@/domain";
import { useAuth } from "@/components/auth/AuthProvider";
import { MisProdesSection } from "@/components/prodes/MisProdesSection";
import { MisProdesServerSection } from "@/components/prodes/MisProdesServerSection";
import {
  EmptyState,
  EmptyStateButtonLink,
} from "@/components/ui/EmptyState";
import { useIngestionTick } from "@/hooks/useIngestionTick";
import { pageEyebrow, pageHeader, pageTitle, statLabel } from "@/lib/ui-styles";
import { initialsFromDisplayName } from "@/lib/user-display";
import { cn } from "@/lib/utils";
import {
  formatPublicPoolLabel,
  getPublicPoolById,
} from "@/mocks/catalog/primera-catalog";
import { getTorneoBrowseItems } from "@/mocks/services/torneos-browse.mock";
import {
  aggregateUserPredictionsByMatch,
  computePointsBreakdown,
} from "@/state/selectors";
import { useAppState, useOwnedProdes } from "@/state/app-state";

async function readApiError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: { message?: string } };
    if (typeof j?.error?.message === "string") return j.error.message;
  } catch {
    /* ignore */
  }
  return "Error al guardar.";
}

function StatCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex min-h-[3.25rem] flex-col justify-center bg-app-surface px-2 py-2 text-center">
      <p className={statLabel}>{label}</p>
      <p className="mt-1 text-[17px] font-bold tabular-nums leading-none text-app-text">
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-[9px] font-medium text-app-muted">{sub}</p>
      ) : null}
    </div>
  );
}

export function PerfilScreen() {
  const { logout, hydrated, loggedIn } = useAuth();
  const { data: session } = useSession();
  const ingestionTick = useIngestionTick();
  const { user, state, setNotificationPreferences, updateProfile } =
    useAppState();
  const owned = useOwnedProdes();
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [profileSavedBanner, setProfileSavedBanner] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [serverUsername, setServerUsername] = useState<string | null>(null);
  const [profileHydrated, setProfileHydrated] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [prefsBusy, setPrefsBusy] = useState(false);

  const fetchServerProfile = useCallback(async () => {
    if (!loggedIn) {
      setProfileHydrated(false);
      return;
    }
    try {
      const res = await fetch("/api/me/profile");
      if (!res.ok) {
        const s = await getSession();
        setServerUsername(s?.user?.username ?? null);
        setProfileHydrated(true);
        return;
      }
      const data = (await res.json()) as {
        profile: {
          email: string | null;
          name: string | null;
          username: string | null;
          image: string | null;
          createdAt: string;
          notificationPreferences: {
            remindersEnabled: boolean;
            closingAlertEnabled: boolean;
          };
        };
      };
      const { profile } = data;
      updateProfile({
        displayName: profile.name?.trim() || "Usuario",
        username: profile.username ?? "",
        avatarUrl: profile.image ?? null,
      });
      setNotificationPreferences({
        matchReminders: profile.notificationPreferences.remindersEnabled,
        prodeDeadlineAlerts: profile.notificationPreferences.closingAlertEnabled,
      });
      setAccountEmail(profile.email ?? null);
      setMemberSince(profile.createdAt ?? null);
      setServerUsername(profile.username);
      setProfileHydrated(true);
    } catch {
      const s = await getSession();
      setServerUsername(s?.user?.username ?? null);
      setProfileHydrated(true);
    }
  }, [loggedIn, setNotificationPreferences, updateProfile]);

  useEffect(() => {
    void fetchServerProfile();
  }, [fetchServerProfile]);

  useEffect(() => {
    setAvatarBroken(false);
  }, [user.avatarUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("prodemix_profile_ok") === "1") {
      sessionStorage.removeItem("prodemix_profile_ok");
      void fetchServerProfile();
      setProfileSavedBanner(true);
      const t = window.setTimeout(() => setProfileSavedBanner(false), 4000);
      return () => window.clearTimeout(t);
    }
  }, [fetchServerProfile]);

  const showAvatar =
    Boolean(user.avatarUrl) &&
    !avatarBroken &&
    (/^https?:\/\//i.test(user.avatarUrl!) ||
      user.avatarUrl!.startsWith("data:image/"));

  const prefs = state.notificationPreferences;

  const patchNotificationPrefs = async (next: {
    matchReminders: boolean;
    prodeDeadlineAlerts: boolean;
  }) => {
    const revert = {
      matchReminders: prefs.matchReminders,
      prodeDeadlineAlerts: prefs.prodeDeadlineAlerts,
    };
    setNotificationPreferences(next);
    setPrefsError(null);
    setPrefsBusy(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationPreferences: {
            remindersEnabled: next.matchReminders,
            closingAlertEnabled: next.prodeDeadlineAlerts,
          },
        }),
      });
      if (!res.ok) {
        setNotificationPreferences(revert);
        setPrefsError(await readApiError(res));
        return;
      }
    } catch {
      setNotificationPreferences(revert);
      setPrefsError("No se pudo guardar las preferencias.");
    } finally {
      setPrefsBusy(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const { totalPoints, exactHits } = useMemo(() => {
    const preds = aggregateUserPredictionsByMatch(user.id, state);
    const { points, exactScores } = computePointsBreakdown(preds);
    return { totalPoints: points, exactHits: exactScores };
  }, [user.id, state]);

  const followedLabels = useMemo(() => {
    void ingestionTick;
    const items = getTorneoBrowseItems();
    const byId = new Map(items.map((t) => [t.id, t]));
    return state.followedTournamentIds
      .map((id) => byId.get(id))
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [state.followedTournamentIds, ingestionTick]);

  const joinedPools = useMemo((): PublicPool[] => {
    return state.joinedPublicPoolIds
      .map((id) => getPublicPoolById(id))
      .filter((p): p is PublicPool => Boolean(p));
  }, [state.joinedPublicPoolIds]);

  return (
    <div className="pb-2">
      <header className={pageHeader}>
        <p className={pageEyebrow}>ProdeMix</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Perfil</h1>
        <p className="mt-1 text-[11px] font-medium leading-snug text-app-muted">
          Primera · prodes por fecha
        </p>
      </header>

      {prefsError ?
        <p
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-900"
          role="alert"
        >
          {prefsError}
        </p>
      : null}

      {profileSavedBanner ?
        <p
          className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-900"
          role="status"
        >
          Perfil actualizado
        </p>
      : null}

      <section className="mt-4 flex gap-3">
        <div
          className="relative flex h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-app-text text-lg font-bold text-app-surface shadow-sm"
          aria-hidden
        >
          {showAvatar ?
            // eslint-disable-next-line @next/next/no-img-element -- URL definida por el usuario
            <img
              src={user.avatarUrl!}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setAvatarBroken(true)}
            />
          : (
            <span className="flex h-full w-full items-center justify-center">
              {initialsFromDisplayName(user.displayName)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="truncate text-[17px] font-semibold leading-tight text-app-text">
            {user.displayName}
          </h2>
          {!profileHydrated ?
            <p className="mt-0.5 text-[13px] text-app-muted">Cargando…</p>
          : (serverUsername ?? session?.user?.username) ?
            <p className="mt-0.5 font-mono text-[13px] font-medium text-app-primary">
              @{serverUsername ?? session?.user?.username}
            </p>
          : (
            <Link
              href="/onboarding/username"
              className="mt-0.5 inline-block text-[13px] font-semibold text-app-primary underline"
            >
              Completá tu usuario
            </Link>
          )}
          <p className="mt-1 text-[11px] leading-snug text-app-muted">
            {profileHydrated ?
              <>
                {accountEmail ?? "Sin correo en la cuenta"}
                {memberSince ?
                  ` · Desde ${new Date(memberSince).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}`
                : null}
              </>
            : null}
          </p>
        </div>
      </section>

      <section className="mt-3 space-y-1.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
          Resumen
        </h3>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-app-border bg-app-border-subtle shadow-[0_1px_0_rgba(15,23,42,0.04)]">
          <StatCell
            label="Pts totales"
            value={totalPoints}
            sub="vs resultados oficiales"
          />
          <StatCell
            label="Plenos"
            value={exactHits}
            sub="marcadores exactos"
          />
          <StatCell
            label="Fechas"
            value={joinedPools.length}
            sub="prodes de fecha"
          />
        </div>
      </section>

      {hydrated && loggedIn ?
        <MisProdesServerSection className="mt-3" showViewAllLink />
      : (
        <MisProdesSection
          className="mt-3"
          prodes={owned}
          userId={user.id}
          displayName={user.displayName}
          state={state}
        />
      )}

      <section className="mt-3 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
            Prodes por fecha
          </h3>
          <Link
            href="/torneos"
            className="text-[11px] font-semibold text-app-primary hover:underline"
          >
            Explorar
          </Link>
        </div>
        {joinedPools.length === 0 ? (
          <p className="rounded-lg border border-dashed border-app-border bg-app-bg/70 px-3 py-2.5 text-[11px] leading-snug text-app-muted">
            Todavía no entraste a ningún prode de fecha. Elegí una competición en{" "}
            <Link href="/torneos" className="font-semibold text-app-primary">
              Torneos
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-1.5">
            {joinedPools.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/torneos/${encodeURIComponent(p.tournamentId)}/fechas/${encodeURIComponent(p.matchdayId)}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-app-border bg-app-surface px-2.5 py-2 text-left shadow-[0_1px_0_rgba(15,23,42,0.03)] transition hover:bg-app-bg active:scale-[0.995]"
                >
                  <span className="min-w-0 truncate text-[12px] font-semibold text-app-text">
                    {formatPublicPoolLabel(p)}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-app-muted"
                    strokeWidth={2}
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-3 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
            Torneos que seguís
          </h3>
          <Link
            href="/torneos"
            className="text-[11px] font-semibold text-app-primary hover:underline"
          >
            Explorar
          </Link>
        </div>
        {followedLabels.length === 0 ? (
          <EmptyState
            variant="soft"
            layout="horizontal"
            icon={Star}
            title="Sin torneos seguidos"
            description="Explorá competiciones y tocá seguir para tenerlas a mano."
          >
            <EmptyStateButtonLink href="/torneos">Ir a Torneos</EmptyStateButtonLink>
          </EmptyState>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {followedLabels.map((t) => (
              <span
                key={t.id}
                className="inline-flex max-w-full items-center rounded-full border border-app-border bg-app-surface px-2.5 py-1 text-[11px] font-semibold text-app-text shadow-[0_1px_0_rgba(15,23,42,0.03)]"
              >
                {t.name.split("·")[0]?.trim() ?? t.name}
              </span>
            ))}
          </div>
        )}
        <p className="text-[10px] leading-snug text-app-muted">
          Tus seguimientos se guardan en este dispositivo.
        </p>
      </section>

      <section className="mt-3 space-y-1.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
          Actividad
        </h3>
        <Link
          href="/ranking"
          className="flex items-center justify-between gap-2 rounded-[10px] border border-app-border bg-app-surface px-3 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:bg-app-bg active:scale-[0.995]"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-app-bg text-app-primary">
              <Trophy className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <span>
              <span className="block text-[13px] font-semibold text-app-text">
                Ver ranking
              </span>
              <span className="mt-0.5 block text-[10px] text-app-muted">
                Global, fecha y torneo
              </span>
            </span>
          </span>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-app-muted"
            strokeWidth={2}
            aria-hidden
          />
        </Link>
      </section>

      <section className="mt-4 space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
          Cuenta
        </h3>
        <Link
          href="/perfil/editar"
          className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-app-border bg-app-surface px-3 py-2.5 text-left shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:bg-app-bg active:scale-[0.995]"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-app-bg text-app-primary">
              <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <span>
              <span className="block text-[13px] font-semibold text-app-text">
                Editar perfil
              </span>
              <span className="mt-0.5 block text-[10px] text-app-muted">
                Nombre, usuario e imagen
              </span>
            </span>
          </span>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-app-muted"
            strokeWidth={2}
            aria-hidden
          />
        </Link>
      </section>

      <section className="mt-4 space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
          Notificaciones
        </h3>
        <div className="rounded-[10px] border border-app-border bg-app-surface px-3 py-1 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-3 border-b border-app-border-subtle py-2.5 last:border-b-0">
            <div className="flex min-w-0 items-start gap-2">
              <Bell
                className="mt-0.5 h-4 w-4 shrink-0 text-app-primary"
                strokeWidth={2}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-app-text">
                  Recibir recordatorios
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.matchReminders}
              disabled={prefsBusy}
              onClick={() =>
                void patchNotificationPrefs({
                  matchReminders: !prefs.matchReminders,
                  prodeDeadlineAlerts: prefs.prodeDeadlineAlerts,
                })
              }
              className={cn(
                "relative h-7 w-11 shrink-0 overflow-hidden rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg disabled:opacity-50",
                prefs.matchReminders ? "bg-app-primary" : "bg-app-border",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 ease-out",
                  prefs.matchReminders ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-app-text">
                Avisar antes del cierre del prode
              </p>
              <p className="text-[10px] leading-snug text-app-muted">
                Aviso por correo antes del cierre del prode para completar
                pronósticos.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.prodeDeadlineAlerts}
              disabled={prefsBusy}
              onClick={() =>
                void patchNotificationPrefs({
                  matchReminders: prefs.matchReminders,
                  prodeDeadlineAlerts: !prefs.prodeDeadlineAlerts,
                })
              }
              className={cn(
                "relative h-7 w-11 shrink-0 overflow-hidden rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg disabled:opacity-50",
                prefs.prodeDeadlineAlerts ? "bg-app-primary" : "bg-app-border",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 ease-out",
                  prefs.prodeDeadlineAlerts ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </div>
      </section>

      <section className="mt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-app-border bg-app-surface px-3 py-2.5 text-[13px] font-semibold text-app-text shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:bg-red-50 hover:text-red-800 active:scale-[0.995]"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden />
          Cerrar sesión
        </button>
      </section>
    </div>
  );
}
