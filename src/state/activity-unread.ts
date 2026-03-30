import type { PersistedAppState } from "./types";

/** Count of activity items newer than last “seen” (for badge). */
export function countUnreadActivity(state: PersistedAppState): number {
  const { activity, activityLastSeenAt } = state;
  if (activity.length === 0) return 0;
  if (!activityLastSeenAt) return activity.length;
  const t = new Date(activityLastSeenAt).getTime();
  return activity.filter((a) => new Date(a.createdAt).getTime() > t).length;
}
