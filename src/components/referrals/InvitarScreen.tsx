"use client";

import { Check, Copy, MessageCircle, Send, Share2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { REFERRAL_TARGET_FREE } from "@/lib/referrals/constants";
import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

type ReferralApi = {
  referralCode: string;
  shareUrl: string;
  referralCount: number;
  targetFree: number;
  remainingForFree: number;
  hasFreeEntry: boolean;
  milestones: { at3: boolean; at5: boolean; at10: boolean };
};

function buildShareMessage(shareUrl: string): string {
  return `Estoy jugando este prode\n\nSumate y competí conmigo\n\n👉 ${shareUrl}`;
}

export function InvitarScreen() {
  const [data, setData] = useState<ReferralApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/me/referral", { credentials: "include" })
      .then(async (res) => {
        const j = (await res.json()) as {
          error?: { message?: string };
        } & Partial<ReferralApi>;
        if (!res.ok) {
          throw new Error(
            typeof j.error?.message === "string" ?
              j.error.message
            : "No se pudo cargar tu invitación.",
          );
        }
        return j as ReferralApi;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error al cargar.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const shareMessage = data ? buildShareMessage(data.shareUrl) : "";

  async function copyLink() {
    if (!data?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function openWhatsApp() {
    if (!shareMessage) return;
    const u = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(u, "_blank", "noopener,noreferrer");
  }

  function openTelegram() {
    if (!shareMessage || !data?.shareUrl) return;
    const u = `https://t.me/share/url?url=${encodeURIComponent(data.shareUrl)}&text=${encodeURIComponent(
      `Estoy jugando este prode\n\nSumate y competí conmigo`,
    )}`;
    window.open(u, "_blank", "noopener,noreferrer");
  }

  async function nativeShare() {
    if (!data?.shareUrl || !shareMessage) return;
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title: "ProdeMix",
        text: shareMessage,
        url: data.shareUrl,
      });
    } catch {
      /* user cancelled */
    }
  }

  const target = data?.targetFree ?? REFERRAL_TARGET_FREE;
  const count = data?.referralCount ?? 0;
  const pct = Math.min(100, Math.round((count / target) * 100));
  const remaining = data?.remainingForFree ?? Math.max(0, target - count);

  return (
    <div className="pb-6">
      <header className={pageHeader}>
        <p className={pageEyebrow}>ProdeMix</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Invitar amigos</h1>
        <p className="mt-1 text-[12px] leading-relaxed text-app-muted">
          Invitá amigos con tu enlace. Cuando se registren, suman a tu progreso.
        </p>
      </header>

      <Link
        href="/perfil"
        className="mt-3 inline-flex text-[12px] font-semibold text-app-primary hover:underline"
      >
        ← Volver al perfil
      </Link>

      {loading ?
        <p className="mt-6 text-center text-[13px] text-app-muted">Cargando…</p>
      : error ?
        <p
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-900"
          role="alert"
        >
          {error}
        </p>
      : data ?
        <>
          <section className="mt-5 space-y-3">
            <div className="rounded-2xl border border-app-border bg-app-surface p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                Tu enlace
              </p>
              <p className="mt-2 break-all font-mono text-[13px] font-medium text-app-text">
                {data.shareUrl}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-app-border bg-app-bg px-3 py-2 text-[12px] font-semibold text-app-text shadow-sm active:scale-[0.99]"
                >
                  {copied ?
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                  : <Copy className="h-4 w-4 text-app-muted" aria-hidden />}
                  {copied ? "Copiado" : "Copiar enlace"}
                </button>
                {typeof navigator !== "undefined" && "share" in navigator ?
                  <button
                    type="button"
                    onClick={() => void nativeShare()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-app-border bg-app-bg px-3 py-2 text-[12px] font-semibold text-app-text shadow-sm active:scale-[0.99]"
                  >
                    <Share2 className="h-4 w-4 text-app-muted" aria-hidden />
                    Compartir
                  </button>
                : null}
              </div>
            </div>

            <div className="rounded-2xl border border-app-border bg-app-surface p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                Tu código
              </p>
              <p className="mt-2 font-mono text-[22px] font-bold tracking-wide text-app-text">
                {data.referralCode}
              </p>
            </div>
          </section>

          <section className="mt-5">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                  Progreso
                </p>
                <p className="mt-1 text-[20px] font-bold tabular-nums text-app-text">
                  {count} / {target} invitados
                </p>
              </div>
              {data.hasFreeEntry ?
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-900">
                  Entrada gratis desbloqueada
                </span>
              : (
                <p className="max-w-[12rem] text-right text-[11px] font-semibold leading-snug text-app-primary">
                  Te faltan {remaining} para jugar gratis
                </p>
              )}
            </div>
            <div
              className="mt-3 h-3 overflow-hidden rounded-full bg-app-border"
              role="progressbar"
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={target}
              aria-label="Progreso de invitaciones"
            >
              <div
                className="h-full rounded-full bg-app-primary transition-[width] duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-app-muted">
              Invitá {target} amigos y jugás gratis el próximo prode pago.
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-app-muted">
              <li className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                    data.milestones.at3 ?
                      "bg-emerald-500 text-white"
                    : "bg-app-border text-app-muted",
                  )}
                >
                  {data.milestones.at3 ? "✓" : "3"}
                </span>
                3 invitados — beneficio menor (próximamente)
              </li>
              <li className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                    data.milestones.at5 ?
                      "bg-emerald-500 text-white"
                    : "bg-app-border text-app-muted",
                  )}
                >
                  {data.milestones.at5 ? "✓" : "5"}
                </span>
                5 invitados — extra (próximamente)
              </li>
              <li className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                    data.milestones.at10 ?
                      "bg-emerald-500 text-white"
                    : "bg-app-border text-app-muted",
                  )}
                >
                  {data.milestones.at10 ? "✓" : "10"}
                </span>
                10 invitados — entrada gratis al próximo prode pago
              </li>
            </ul>
          </section>

          <section className="mt-6 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
              Compartir por
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={openWhatsApp}
                className="flex items-center justify-center gap-2 rounded-xl border border-app-border bg-[#25D366]/10 px-3 py-3 text-[12px] font-semibold text-app-text active:scale-[0.99]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={openTelegram}
                className="flex items-center justify-center gap-2 rounded-xl border border-app-border bg-sky-500/10 px-3 py-3 text-[12px] font-semibold text-app-text active:scale-[0.99]"
              >
                <Send className="h-4 w-4" aria-hidden />
                Telegram
              </button>
            </div>
          </section>
        </>
      : null}
    </div>
  );
}
