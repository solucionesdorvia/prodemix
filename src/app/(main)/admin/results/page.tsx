import type { Metadata } from "next";

import { AdminProdeResultsClient } from "@/components/admin/AdminProdeResultsClient";

export const metadata: Metadata = {
  title: "Admin · Resultados",
  robots: { index: false, follow: false },
};

export default function AdminResultsPage() {
  return <AdminProdeResultsClient />;
}
