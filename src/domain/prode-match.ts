import type { MatchId } from "./match";
import type { ProdeId } from "./prode";

/**
 * Join table: which matches belong to a prode (order matters for UX).
 */
export interface ProdeMatch {
  id: string;
  prodeId: ProdeId;
  matchId: MatchId;
  sortOrder: number;
  createdAt: string;
}
