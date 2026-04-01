import type { Metadata } from "next";

import { ProdesDetailClient } from "@/components/prodes/ProdesDetailClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Prode",
    description: "Pronósticos, puntos y ranking de la competencia oficial.",
  };
}

export default async function ProdesDetailPage({ params }: Props) {
  const { id } = await params;
  return <ProdesDetailClient prodeId={id} />;
}
