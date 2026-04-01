import type { ActivityEntry } from "@/domain";

export function getRecentActivity(): ActivityEntry[] {
  return [...ACTIVITY_FIXTURE];
}

const ACTIVITY_FIXTURE: ActivityEntry[] = [
  {
    id: "a1",
    title: "Pleno: 2-1 en Primera A",
    detail: "3 pts · AFA Futsal · Premio",
    timeLabel: "Hace 2 h",
    kind: "prediction",
  },
  {
    id: "a2",
    title: 'Te uniste al prode "Premio A · Fecha 1"',
    detail: "Competencia oficial · 128 participantes",
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
