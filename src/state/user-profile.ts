import type { Session } from "next-auth";

import type { User } from "@/domain";
import { getMockCurrentUser } from "@/mocks/services/user.mock";

import type { PersistedAppState, UserProfilePersisted } from "./types";

export function defaultUserProfileFromMock(): UserProfilePersisted {
  const u = getMockCurrentUser();
  return {
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl ?? null,
  };
}

/**
 * Usuario de la app: sesión Auth.js + overrides locales (perfil editado).
 */
export function resolveUser(
  state: PersistedAppState,
  session: Session | null,
): User {
  const base = getMockCurrentUser();
  if (!session?.user?.id) {
    return base;
  }
  const p = state.userProfile;
  const email = session.user.email ?? null;
  const name = session.user.name?.trim() || null;
  const image = session.user.image ?? null;
  const sessionUsername = session.user.username?.trim() || null;
  return {
    id: session.user.id,
    username: p?.username?.trim() || sessionUsername || base.username,
    displayName: p?.displayName?.trim() || name || base.displayName,
    avatarUrl:
      p?.avatarUrl?.trim() ? p.avatarUrl.trim()
      : image ?
        image
      : null,
    email,
    createdAt: base.createdAt,
    authProviderId: null,
  };
}

export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "");
}
