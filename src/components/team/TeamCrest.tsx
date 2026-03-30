"use client";

import { useState } from "react";

import {
  getTeamCrestUrl,
  isLibreTeam,
  teamInitials,
} from "@/lib/team-crests";
import { cn } from "@/lib/utils";

type TeamCrestProps = {
  teamName: string;
  /** Tamaño del contenedor (px). */
  size?: number;
  className?: string;
};

function hashHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function TeamCrest({
  teamName,
  size = 28,
  className,
}: TeamCrestProps) {
  const url = getTeamCrestUrl(teamName);
  const libre = isLibreTeam(teamName);
  const [failed, setFailed] = useState(false);
  const initials = teamInitials(teamName);
  const hue = hashHue(teamName);

  const shellClass = cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-app-border bg-app-bg shadow-[0_1px_0_rgba(15,23,42,0.05)]",
    className,
  );

  if (libre) {
    return (
      <span
        className={shellClass}
        style={{ width: size, height: size }}
        role="img"
        aria-label="Libre (sin partido esta fecha)"
      >
        <span className="text-[11px] font-bold tabular-nums text-app-muted">
          —
        </span>
      </span>
    );
  }

  if (url && !failed) {
    return (
      <span
        className={shellClass}
        style={{ width: size, height: size }}
        role="img"
        aria-label={teamName}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Commons; onError → iniciales */}
        <img
          src={url}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-contain p-0.5"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={shellClass}
      style={{ width: size, height: size }}
      role="img"
      aria-label={teamName}
    >
      <span
        className="flex items-center justify-center rounded-md text-[10px] font-bold leading-none tracking-tight text-white"
        style={{
          width: size - 6,
          height: size - 6,
          background: `linear-gradient(135deg, hsl(${hue}, 42%, 38%), hsl(${(hue + 40) % 360}, 48%, 28%))`,
        }}
      >
        {initials}
      </span>
    </span>
  );
}
