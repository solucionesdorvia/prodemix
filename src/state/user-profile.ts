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

export function resolveUser(state: PersistedAppState): User {
  const base = getMockCurrentUser();
  const p = state.userProfile;
  if (!p) {
    return base;
  }
  return {
    ...base,
    username: p.username.trim() || base.username,
    displayName: p.displayName.trim() || base.displayName,
    avatarUrl: p.avatarUrl?.trim() ? p.avatarUrl.trim() : null,
  };
}

export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "");
}
