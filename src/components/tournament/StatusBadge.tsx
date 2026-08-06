import type { MatchStatus } from "@/lib/tournament";
import { STATUS_LABEL } from "@/lib/tournament";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: MatchStatus; className?: string }) {
  if (status === "live") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-live px-2.5 py-1 text-xs font-bold text-live-foreground",
          className,
        )}
      >
        <span className="live-pulse h-2 w-2 rounded-full bg-live-foreground" />
        משחק חי
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        status === "finished"
          ? "border-border bg-secondary text-muted-foreground"
          : "border-gold/30 bg-gold/10 text-gold",
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
