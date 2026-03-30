/**
 * Core user model. Maps to future `users` table + auth provider ids.
 */
export type UserId = string;

export interface User {
  id: UserId;
  /** Unique handle without @ */
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  email?: string | null;
  createdAt: string;
  /** Auth provider subject (Clerk, Auth0, etc.) — optional until auth */
  authProviderId?: string | null;
}
