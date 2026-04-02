import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }
  if (session.user.role !== "admin") {
    redirect("/?error=forbidden");
  }
  return <AdminShell>{children}</AdminShell>;
}
