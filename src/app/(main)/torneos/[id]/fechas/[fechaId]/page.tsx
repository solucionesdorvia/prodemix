import { FechaPublicPoolClient } from "@/components/torneos/FechaPublicPoolClient";

type PageProps = {
  params: Promise<{ id: string; fechaId: string }>;
};

export default async function FechaPoolPage({ params }: PageProps) {
  const { id, fechaId } = await params;
  return (
    <FechaPublicPoolClient tournamentId={id} fechaId={decodeURIComponent(fechaId)} />
  );
}
