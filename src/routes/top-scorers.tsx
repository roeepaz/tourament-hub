import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { topScorersQuery } from "@/lib/top-scorers.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/top-scorers")({
  head: () => ({
    meta: [
      { title: "מלך השערים — אליפות היחידה" },
      {
        name: "description",
        content: "השחקנים שכבשו הכי הרבה שערים בטורניר הכדורגל של אליפות היחידה.",
      },
      { property: "og:title", content: "מלך השערים — אליפות היחידה" },
      {
        property: "og:description",
        content: "מי מלך השערים של הטורניר? צפו ברשימת הכובשים המובילים.",
      },
    ],
  }),
  errorComponent: ({ error }) => <p role="alert">שגיאה בטעינת הנתונים: {error.message}</p>,
  pendingComponent: () => <p className="text-muted-foreground">טוען…</p>,
  component: TopScorers,
});

function TopScorers() {
  const { data: scorers, isLoading } = useQuery({
    queryKey: ["top-scorers"],
    queryFn: () => topScorersQuery({}),
  });

  const rows = scorers ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-black">מלך השערים</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          השחקנים שכבשו הכי הרבה שערים בטורניר הכדורגל.
        </p>
      </div>

      {isLoading || rows.length === 0 ? (
        <p className="surface-card px-4 py-8 text-center text-sm text-muted-foreground">
          עדיין אין נתוני כובשים.
        </p>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-md text-right text-sm">
            <thead className="border-b border-border/70 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">#</th>
                <th className="px-3 py-2 font-semibold">שחקן</th>
                <th className="px-3 py-2 font-semibold">שערים</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.scorer}
                  className={cn(
                    "border-b border-border/40 last:border-0",
                    i === 0 && "bg-gold/10",
                  )}
                >
                  <td className="px-3 py-3 tabular-nums text-muted-foreground">
                    {i < 3 ? (
                      <Trophy
                        className={cn(
                          "h-4 w-4",
                          i === 0 ? "text-gold" : i === 1 ? "text-muted-foreground" : "text-basketball",
                        )}
                      />
                    ) : (
                      i + 1
                    )}
                  </td>
                  <td className="px-3 py-3 font-bold">{r.scorer}</td>
                  <td className="px-3 py-3 font-black tabular-nums text-primary">{r.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
