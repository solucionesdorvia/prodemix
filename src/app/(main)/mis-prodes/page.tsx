import type { Metadata } from "next";

import { MisProdesScreen } from "@/components/prodes/MisProdesScreen";

export const metadata: Metadata = {
  title: "Mis prodes",
  description:
    "Prodes en los que participás, estado, pronósticos y puntos.",
};

export default function MisProdesPage() {
  return <MisProdesScreen />;
}
