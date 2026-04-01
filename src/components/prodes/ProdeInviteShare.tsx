"use client";

import { Copy, Link2, Share2 } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type ProdeInviteShareProps = {
  prodeName: string;
  inviteCode: string;
  /** Full URL to this prode (for native share / clipboard). */
  prodeUrl: string;
  className?: string;
};

export function ProdeInviteShare({
  prodeName,
  inviteCode,
  prodeUrl,
  className,
}: ProdeInviteShareProps) {
  const [copied, setCopied] = useState<"code" | "msg" | null>(null);

  const shareText = useMemo(
    () =>
      `Prode: ${prodeName}\nCódigo: ${inviteCode}\n${prodeUrl}`,
    [prodeName, inviteCode, prodeUrl],
  );

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied("code");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  const shareProde = async () => {
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav?.share) {
      try {
        await nav.share({
          title: `Prode · ${prodeName}`,
          text: shareText,
          url: prodeUrl,
        });
        return;
      } catch {
        /* dismissed or failed */
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied("msg");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* noop */
    }
  };

  const btnClass =
    "inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-app-border bg-app-surface text-[12px] font-semibold text-app-text shadow-[0_1px_0_rgba(15,23,42,0.04)] transition active:scale-[0.99]";

  return (
    <section
      className={cn(
        "rounded-lg border border-app-border bg-app-surface px-2.5 py-2 shadow-[0_1px_0_rgba(15,23,42,0.04)]",
        className,
      )}
      aria-label="Invitación al prode"
    >
      <div className="flex items-center gap-1.5">
        <Link2
          className="h-3.5 w-3.5 shrink-0 text-app-muted"
          strokeWidth={2}
          aria-hidden
        />
        <p className="text-[10px] font-medium uppercase tracking-wide text-app-muted">
          Invitación
        </p>
      </div>
      <p className="mt-0.5 text-[11px] leading-snug text-app-muted">
        Mismo código para todos los integrantes.
      </p>

      <div className="mt-2 rounded-lg border border-app-border bg-app-surface px-2 py-1.5 text-center">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-app-muted">
          Código
        </p>
        <p className="mt-0.5 font-mono text-[15px] font-bold tracking-[0.08em] text-app-text">
          {inviteCode}
        </p>
      </div>

      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={() => void copyCode()}
          className={cn(btnClass, copied === "code" && "border-emerald-300 bg-emerald-50")}
        >
          <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {copied === "code" ? "Copiado" : "Copiar código"}
        </button>
        <button
          type="button"
          onClick={() => void shareProde()}
          className={cn(btnClass, copied === "msg" && "border-emerald-300 bg-emerald-50")}
        >
          <Share2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {copied === "msg" ? "Texto copiado" : "Compartir prode"}
        </button>
      </div>
    </section>
  );
}
