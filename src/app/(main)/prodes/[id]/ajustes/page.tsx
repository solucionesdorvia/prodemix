import type { Metadata } from "next";

import { ProdeAjustesClient } from "@/components/prodes/ProdeAjustesClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Ajustes del prode",
    description: `Ajustes del prode ${id}.`,
  };
}

export default async function ProdeAjustesPage({ params }: Props) {
  const { id } = await params;
  return <ProdeAjustesClient prodeId={id} />;
}
