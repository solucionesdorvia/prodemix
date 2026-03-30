import type { Metadata } from "next";

import { ProdesDetailClient } from "@/components/prodes/ProdesDetailClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Prode",
    description: "Marcadores, puntos y ranking de tu prode.",
  };
}

export default async function ProdesDetailPage({ params }: Props) {
  const { id } = await params;
  return <ProdesDetailClient prodeId={id} />;
}
