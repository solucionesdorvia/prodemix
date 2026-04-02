import type { Session } from "next-auth";

import type { User } from "@/domain";
import {
  getMockCurrentUser,
  MOCK_CURRENT_USER_ID,
} from "@/mocks/services/user.mock";

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
  const isMockUser = session.user.id === MOCK_CURRENT_USER_ID;
  return {
    id: session.user.id,
    username:
      p?.username?.trim() ||
      sessionUsername ||
      (isMockUser ? base.username : ""),
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
