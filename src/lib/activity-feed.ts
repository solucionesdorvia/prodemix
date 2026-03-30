import type { ActivityEntry } from "@/domain";

import type { ActivityLogEntry } from "@/state/types";

export function activityLogToEntry(a: ActivityLogEntry): ActivityEntry {
  return {
    id: a.id,
    title: a.title,
    detail: a.detail,
    timeLabel: a.timeLabel,
    kind: a.kind,
  };
}

export function sortActivityByCreatedDesc(
  entries: ActivityLogEntry[],
): ActivityLogEntry[] {
  return [...entries].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Merge persisted + fallback entries, deduping by id (persisted first).
 */
export function mergeActivityEntries(
  persisted: ActivityLogEntry[],
  fallback: ActivityEntry[],
): ActivityEntry[] {
  const merged = [
    ...sortActivityByCreatedDesc(persisted).map(activityLogToEntry),
    ...fallback,
  ];
  const seen = new Set<string>();
  const out: ActivityEntry[] = [];
  for (const a of merged) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    out.push(a);
  }
  return out;
}
