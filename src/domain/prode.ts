import type { UserId } from "./user";

export type ProdeId = string;

export type ProdeVisibility = "public" | "private";

/**
 * User-created prediction pool combining matches from multiple tournaments.
 */
export interface Prode {
  id: ProdeId;
  ownerId: UserId;
  name: string;
  visibility: ProdeVisibility;
  createdAt: string;
  updatedAt?: string;
  /** Invite link slug / code */
  inviteCode?: string | null;
}

/**
 * Lightweight row for lists (home, dashboards).
 */
export interface ProdeSummary {
  id: ProdeId;
  name: string;
  matchCount: number;
  nextDeadline: string;
  progressLabel: string;
}
