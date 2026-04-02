import { AdminProdeDetailClient } from "@/components/admin/AdminProdeDetailClient";

type Props = { params: Promise<{ id: string }> };

export default async function AdminProdeDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminProdeDetailClient prodeId={id} />;
}
