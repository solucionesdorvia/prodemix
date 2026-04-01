"use client";

import { OfficialProdeCard } from "@/components/prodes/OfficialProdeCard";
import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import { getOfficialProdesList } from "@/mocks/official-prodes.mock";
import { cn } from "@/lib/utils";

export function OfficialProdesClient() {
  const all = getOfficialProdesList();
  const featured = all.find((p) => p.featured) ?? all[0];
  const rest = all.filter((p) => p.id !== featured?.id);

  return (
    <div className="pb-3">
      <header className={pageHeader}>
        <p className={pageEyebrow}>Competencias oficiales</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Prodes</h1>
        <p className="mt-1.5 text-[12px] font-medium leading-snug text-app-text">
          Pozos en efectivo, cierres por fecha y ranking en vivo.{" "}
          <span className="text-app-muted">
            Entrá antes del cierre y competí con el resto.
          </span>
        </p>
      </header>

      {featured ?
        <section className="mt-4">
          <OfficialProdeCard prode={featured} variant="featured" />
        </section>
      : null}

      <section className="mt-5">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-app-muted">
          Más competencias
        </p>
        <ul className="mt-2.5 space-y-2.5">
          {rest.map((p) => (
            <li key={p.id}>
              <OfficialProdeCard prode={p} variant="compact" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
