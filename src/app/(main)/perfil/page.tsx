import type { Metadata } from "next";

import { PerfilScreen } from "@/components/perfil/PerfilScreen";

export const metadata: Metadata = {
  title: "Perfil",
  description: "Tu cuenta, estadísticas y torneos seguidos en ProdeMix.",
};

export default function PerfilPage() {
  return <PerfilScreen />;
}
