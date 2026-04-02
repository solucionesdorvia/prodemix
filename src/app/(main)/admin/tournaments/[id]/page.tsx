import { AdminTournamentDetailClient } from "@/components/admin/AdminTournamentDetailClient";

type Props = { params: Promise<{ id: string }> };

export default async function AdminTournamentDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminTournamentDetailClient tournamentId={id} />;
}
