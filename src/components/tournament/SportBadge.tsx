import { Trophy, Volleyball, Dribbble } from "lucide-react";
import type { Sport } from "@/lib/tournament";
import { sportLabel } from "@/lib/tournament";
import { cn } from "@/lib/utils";

const styles: Record<Sport, string> = {
  football: "bg-football/15 text-football border-football/30",
  basketball: "bg-basketball/15 text-basketball border-basketball/30",
  manhaim: "bg-manhaim/15 text-manhaim border-manhaim/30",
};

const icons: Record<Sport, typeof Trophy> = {
  football: Volleyball,
  basketball: Dribbble,
  manhaim: Trophy,
};

export function SportBadge({ sport, className }: { sport: Sport; className?: string }) {
  const Icon = icons[sport];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
        styles[sport],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {sportLabel(sport)}
    </span>
  );
}
