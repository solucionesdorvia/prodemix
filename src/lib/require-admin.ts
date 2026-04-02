import { cookies } from "next/headers";

import { apiError } from "@/lib/api-errors";

/** Admin UI uses cookie `prodemix_admin` + env ADMIN_SECRET (same as /admin/login). */
export async function requireAdminApi() {
  if (!process.env.ADMIN_SECRET) {
    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Admin is not configured (ADMIN_SECRET).",
    );
  }
  const store = await cookies();
  if (store.get("prodemix_admin")?.value !== "1") {
    return apiError(
      401,
      "UNAUTHORIZED",
      "Admin authentication required.",
    );
  }
  return null;
}
