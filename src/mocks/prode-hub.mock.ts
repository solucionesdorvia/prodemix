/**
 * Mock social layer for prode hub until backend provides participants & feed.
 */

export function getMockParticipantCount(prodeId: string): number {
  let h = 0;
  for (let i = 0; i < prodeId.length; i++) {
    h = (h * 31 + prodeId.charCodeAt(i)) >>> 0;
  }
  return 6 + (h % 9);
}

export type ProdeActivityLine = {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
};

export function getMockProdeActivity(prodeName: string): ProdeActivityLine[] {
  return [
    {
      id: "a1",
      title: "Martín cargó 2 plenos",
      detail: `Actividad reciente en “${prodeName.slice(0, 28)}${prodeName.length > 28 ? "…" : ""}”.`,
      timeLabel: "Hace 2 h",
    },
    {
      id: "a2",
      title: "Lucía entró al prode",
      detail: "Sumate vos también con el link de invitación.",
      timeLabel: "Ayer",
    },
    {
      id: "a3",
      title: "Ranking actualizado",
      detail: "Se sumaron puntos de la última fecha.",
      timeLabel: "Lun",
    },
  ];
}
