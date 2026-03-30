import type { TorneoBrowseItem } from "@/domain";

export function accentByCategory(
  categoryId: TorneoBrowseItem["categoryId"],
): string {
  switch (categoryId) {
    case "futsal":
      return "border-l-emerald-500";
    case "futbol-8":
      return "border-l-sky-500";
    case "amateur":
      return "border-l-amber-500";
    case "barrial":
      return "border-l-violet-500";
    case "club-local":
      return "border-l-blue-600";
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
    case "futbol-8":
      return "bg-sky-50 text-sky-950 ring-sky-200/80";
    case "amateur":
      return "bg-amber-50 text-amber-950 ring-amber-200/80";
    case "barrial":
      return "bg-violet-50 text-violet-950 ring-violet-200/80";
    case "club-local":
      return "bg-blue-50 text-blue-950 ring-blue-200/80";
    default:
      return "bg-app-bg text-app-text ring-app-border";
  }
}
