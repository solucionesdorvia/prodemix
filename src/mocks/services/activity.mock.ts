import type { ActivityEntry } from "@/domain";

export function getRecentActivity(): ActivityEntry[] {
  return [...ACTIVITY_FIXTURE];
}

const ACTIVITY_FIXTURE: ActivityEntry[] = [
  {
    id: "a1",
    title: "Pleno: 2-1 en Liga Núñez",
    detail: "3 pts · Deportivo Núñez vs Colegiales",
    timeLabel: "Hace 2 h",
    kind: "prediction",
  },
  {
    id: "a2",
    title: 'Te uniste al prode "Zona Norte"',
    detail: "Copa Zona Norte · 12 participantes",
    timeLabel: "Ayer",
    kind: "prode",
  },
  {
    id: "a3",
    title: "Subiste al podio del ranking",
    detail: "44 pts · 7 plenos exactos",
    timeLabel: "Lun",
    kind: "ranking",
  },
];
