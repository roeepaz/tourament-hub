import { createFileRoute } from "@tanstack/react-router";
import { useTournament } from "@/hooks/use-tournament";
import { preloadTournament } from "@/lib/route-helpers";
import { SPORTS, computeStandings } from "@/lib/tournament";
import { SportBadge } from "@/components/tournament/SportBadge";

export const Route = createFileRoute("/standings")({
  loader: ({ context }) => preloadTournament(context.queryClient),
  head: () => ({
    meta: [
      { title: "טבלאות ליגה — אליפות היחידה" },
      {
        name: "description",
        content: "טבלת ליגה לכל ענף: ניצחונות, תיקו, הפסדים, הפרש ונקודות, מחושב אוטומטית.",
      },
      { property: "og:title", content: "טבלאות ליגה — אליפות היחידה" },
      { property: "og:description", content: "דירוג שש הקבוצות בכדורגל, כדורסל ומחניים." },
    ],
  }),
  errorComponent: ({ error }) => <p role="alert">שגיאה בטעינת הנתונים: {error.message}</p>,
  pendingComponent: () => <p className="text-muted-foreground">טוען…</p>,
  component: Standings,
});

function Standings() {
  const { teams, matches } = useTournament();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black">טבלאות ליגה</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ניצחון = 3 נקודות · תיקו = 1 · הפסד = 0. מחושב ממשחקים שהסתיימו בלבד.
        </p>
      </div>

      {SPORTS.map((s) => {
        const rows = computeStandings(teams, matches, s.id);
        return (
          <section key={s.id} className="flex flex-col gap-3">
            <SportBadge sport={s.id} className="self-start text-sm" />
            <div className="surface-card overflow-x-auto">
              <table className="w-full min-w-md text-right text-sm">
                <thead className="border-b border-border/70 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-semibold">#</th>
                    <th className="px-3 py-2 font-semibold">קבוצה</th>
                    <th className="px-2 py-2 font-semibold">מש׳</th>
                    <th className="px-2 py-2 font-semibold">נצ׳</th>
                    <th className="px-2 py-2 font-semibold">תק׳</th>
                    <th className="px-2 py-2 font-semibold">הפ׳</th>
                    <th className="px-2 py-2 font-semibold">הפרש</th>
                    <th className="px-2 py-2 font-semibold">נק׳</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.teamId} className="border-b border-border/40 last:border-0">
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2 font-bold">{r.name}</td>
                      <td className="px-2 py-2 tabular-nums">{r.played}</td>
                      <td className="px-2 py-2 tabular-nums">{r.wins}</td>
                      <td className="px-2 py-2 tabular-nums">{r.draws}</td>
                      <td className="px-2 py-2 tabular-nums">{r.losses}</td>
                      <td className="px-2 py-2 tabular-nums">
                        {r.diff > 0 ? `+${r.diff}` : r.diff}
                      </td>
                      <td className="px-2 py-2 font-black tabular-nums text-primary">{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
