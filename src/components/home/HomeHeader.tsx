import { pageEyebrow, pageTitle } from "@/lib/ui-styles";
import { initialsFromGreetingName } from "@/lib/user-display";
import { cn } from "@/lib/utils";

type HomeHeaderProps = {
  userName: string;
  className?: string;
  /** Product line under the title — fecha-first positioning. */
  tagline?: string;
};

export function HomeHeader({
  userName,
  className,
  tagline = "Futsal · Primera · prodes por fecha",
}: HomeHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-3 border-b border-app-border-subtle pb-3",
        className,
      )}
    >
      <div className="min-w-0">
        <p className={pageEyebrow}>ProdeMix</p>
        <h1 className={cn("truncate", pageTitle)}>Hola, {userName}</h1>
        <p className="mt-1 text-[11px] font-medium leading-snug text-app-muted">
          {tagline}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div
          className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-full bg-app-text text-[10px] font-bold text-app-surface shadow-sm ring-2 ring-app-border-subtle"
          aria-hidden
        >
          {initialsFromGreetingName(userName)}
        </div>
      </div>
    </header>
  );
}
