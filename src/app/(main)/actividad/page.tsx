import type { Metadata } from "next";

import { ActivityCenterClient } from "@/components/activity/ActivityCenterClient";

export const metadata: Metadata = {
  title: "Actividad",
  description: "Centro de actividad y novedades en ProdeMix.",
};

export default function ActividadPage() {
  return <ActivityCenterClient />;
}
