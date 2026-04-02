import { auth } from "@/auth";
import { apiError } from "@/lib/api-errors";

/** Admin APIs: sesión NextAuth + `User.role === "admin"`. */
export async function requireAdminApi() {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError(401, "UNAUTHORIZED", "Tenés que iniciar sesión.");
  }
  if (session.user.role !== "admin") {
    return apiError(403, "FORBIDDEN", "Se requiere rol administrador.");
  }
  return null;
}
