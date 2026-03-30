import type { Metadata } from "next";

import { TournamentDetailClient } from "@/components/torneos/TournamentDetailClient";
import { getTournamentDetailById } from "@/mocks/services/tournament-detail.mock";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const detail = getTournamentDetailById(id);
  return {
    title: detail?.browse.name ?? "Torneo",
    description: detail?.browse.subtitle,
  };
}

export default async function TournamentDetailPage({ params }: Props) {
  const { id } = await params;
  return <TournamentDetailClient tournamentId={id} />;
}
