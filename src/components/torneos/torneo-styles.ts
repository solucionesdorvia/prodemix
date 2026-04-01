import type { TorneoBrowseItem } from "@/domain";

export function accentByCategory(
  categoryId: TorneoBrowseItem["categoryId"],
): string {
  switch (categoryId) {
    case "futsal":
      return "border-l-emerald-500";
    default:
      return "border-l-app-muted";
  }
}

export function pillByCategory(
  categoryId: TorneoBrowseItem["categoryId"],
): string {
  switch (categoryId) {
    case "futsal":
      return "bg-emerald-50 text-emerald-900 ring-emerald-200/80";
    default:
      return "bg-app-bg text-app-text ring-app-border";
  }
}
