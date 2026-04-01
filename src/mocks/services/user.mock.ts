import type { User } from "@/domain";

/** Until auth: single provisional user id used across mocks. */
export const MOCK_CURRENT_USER_ID = "user-valentin-1";

export const MOCK_USER_DISPLAY_NAME = "Valentín";

export function getMockCurrentUser(): User {
  return {
    id: MOCK_CURRENT_USER_ID,
    username: "valentin.d",
    displayName: "Valentín Díaz",
    avatarUrl: null,
    email: null,
    createdAt: "2025-08-01T12:00:00.000Z",
    authProviderId: null,
  };
}
