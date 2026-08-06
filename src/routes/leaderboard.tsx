import { createFileRoute } from "@tanstack/react-router";
import { Medal } from "lucide-react";
import { useTournament } from "@/hooks/use-tournament";
import { useUserName } from "@/hooks/use-user-name";
import { preloadTournament } from "@/lib/route-helpers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  loader: ({ context }) => preloadTournament(context.queryClient),
  head: () => ({
    meta: [
      { title: "טבלת המנחשים — אליפות היחידה" },
      {
        name: "description",
        content: "דירוג כל המנחשים בטורניר לפי נקודות, תוצאות מדויקות וניחושי מנצח.",
      },
      { property: "og:title", content: "טבלת המנחשים — אליפות היחידה" },
      { property: "og:description", content: "מי מוביל בניחושים של הטורניר?" },
    ],
  }),
  errorComponent: ({ error }) => <p role="alert">שגיאה בטעינת הנתונים: {error.message}</p>,
  pendingComponent: () => <p className="text-muted-foreground">טוען…</p>,
  component: Leaderboard,
});

function Leaderboard() {
  const { predictions } = useTournament();
  const { name } = useUserName();

  const byUser = new Map<
    string,
    { name: string; points: number; total: number; exact: number; correct: number }
  >();
  for (const p of predictions) {
    const row = byUser.get(p.user_name) ?? {
      name: p.user_name,
      points: 0,
      total: 0,
      exact: 0,
      correct: 0,
    };
    row.total++;
    row.points += p.points_earned;
    if (p.points_earned === 3) row.exact++;
    if (p.points_earned > 0) row.correct++;
    byUser.set(p.user_name, row);
  }
  const rows = [...byUser.values()].sort(
    (a, b) => b.points - a.points || b.exact - a.exact || a.name.localeCompare(b.name, "he"),
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-black">טבלת המנחשים</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          תוצאה מדויקת = 3 נקודות · מנצח/תיקו נכון = נקודה אחת
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="surface-card px-4 py-8 text-center text-sm text-muted-foreground">
          עדיין אין ניחושים. תהיו הראשונים!
        </p>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-md text-right text-sm">
            <thead className="border-b border-border/70 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">#</th>
                <th className="px-3 py-2 font-semibold">שם</th>
                <th className="px-2 py-2 font-semibold">ניחושים</th>
                <th className="px-2 py-2 font-semibold">מדויקים</th>
                <th className="px-2 py-2 font-semibold">נקודות</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.name}
                  className={cn(
                    "border-b border-border/40 last:border-0",
                    r.name === name && "bg-primary/10",
                  )}
                >
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">
                    {i < 3 ? (
                      <Medal
                        className={cn(
                          "h-4 w-4",
                          i === 0 ? "text-gold" : i === 1 ? "text-muted-foreground" : "text-basketball",
                        )}
                      />
                    ) : (
                      i + 1
                    )}
                  </td>
                  <td className="px-3 py-2 font-bold">{r.name}</td>
                  <td className="px-2 py-2 tabular-nums">{r.total}</td>
                  <td className="px-2 py-2 tabular-nums">{r.exact}</td>
                  <td className="px-2 py-2 font-black tabular-nums text-primary">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
