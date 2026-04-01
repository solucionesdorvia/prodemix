"use client";

import { OfficialProdeCard } from "@/components/prodes/OfficialProdeCard";
import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import {
  getOfficialProdesElite,
  getOfficialProdesGratis,
} from "@/mocks/official-prodes.mock";
import { cn } from "@/lib/utils";

function sectionTitleClass(): string {
  return cn(
    "text-[11px] font-extrabold uppercase tracking-[0.08em] text-app-muted",
  );
}

export function OfficialProdesClient() {
  const gratis = getOfficialProdesGratis();
  const eliteAll = getOfficialProdesElite();
  const eliteFeatured = eliteAll.find((p) => p.featured) ?? eliteAll[0];
  const eliteRest = eliteAll.filter((p) => p.id !== eliteFeatured?.id);

  return (
    <div className="pb-3">
      <header className={pageHeader}>
        <p className={pageEyebrow}>Competencias oficiales</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Prodes</h1>
        <p className="mt-1.5 text-[12px] font-medium leading-snug text-app-text">
          Qué podés jugar y qué ganás.{" "}
          <span className="text-app-muted">
            Entrá antes del cierre y sumate a la tabla.
          </span>
        </p>
      </header>

      <section className="mt-5 space-y-2.5">
        <h2 className={sectionTitleClass()}>Prodes Gratis</h2>
        <ul className="space-y-2.5">
          {gratis.map((p) => (
            <li key={p.id}>
              <OfficialProdeCard prode={p} variant="compact" />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-7 space-y-3">
        <h2 className={sectionTitleClass()}>Prode Élite</h2>
        {eliteFeatured ?
          <OfficialProdeCard prode={eliteFeatured} variant="featured" />
        : null}
        {eliteRest.length > 0 ?
          <ul className="space-y-2.5">
            {eliteRest.map((p) => (
              <li key={p.id}>
                <OfficialProdeCard prode={p} variant="compact" />
              </li>
            ))}
          </ul>
        : null}
      </section>
    </div>
  );
}
