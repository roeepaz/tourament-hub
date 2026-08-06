import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, LockOpen, Trophy } from "lucide-react";
import { MatchCard } from "@/components/tournament/MatchCard";
import { NameDialog } from "@/components/tournament/NameDialog";
import { Button } from "@/components/ui/button";
import { useTournament } from "@/hooks/use-tournament";
import { useUserName } from "@/hooks/use-user-name";
import { preloadTournament } from "@/lib/route-helpers";
import { isLocked } from "@/lib/tournament";

export const Route = createFileRoute("/predictions")({
  loader: ({ context }) => preloadTournament(context.queryClient),
  head: () => ({
    meta: [
      { title: "הניחושים שלי — אליפות היחידה" },
      {
        name: "description",
        content: "כל הניחושים שלך: מה עדיין פתוח, מה ננעל, וכמה נקודות צברת על כל משחק.",
      },
      { property: "og:title", content: "הניחושים שלי — אליפות היחידה" },
      { property: "og:description", content: "מעקב אחרי הניחושים והנקודות שלך בטורניר." },
    ],
  }),
  errorComponent: ({ error }) => <p role="alert">שגיאה בטעינת הנתונים: {error.message}</p>,
  pendingComponent: () => <p className="text-muted-foreground">טוען…</p>,
  component: MyPredictions,
});

function MyPredictions() {
  const { matches, teamMap, predictions } = useTournament();
  const { name } = useUserName();
  const [nameOpen, setNameOpen] = useState(false);

  const mineList = predictions.filter((p) => p.user_name === name);
  const mine = new Map(mineList.map((p) => [p.match_id, p]));
  const matchById = new Map(matches.map((m) => [m.id, m]));
  const totalPoints = mineList.reduce((s, p) => s + p.points_earned, 0);
  const openMatches = matches.filter((m) => !isLocked(m) && !mine.has(m.id));

  if (!name) {
    return (
      <div className="surface-card flex flex-col items-center gap-3 px-4 py-10 text-center">
        <h1 className="text-xl font-black">כדי לנחש צריך להתחבר</h1>
        <p className="text-sm text-muted-foreground">
          צור משתמש עם סיסמה או התחבר עם שם משתמש קיים.
        </p>
        <Button onClick={() => setNameOpen(true)}>התחברות / הרשמה</Button>
        <NameDialog open={nameOpen} onOpenChange={setNameOpen} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="hero-panel flex flex-wrap items-center justify-between gap-3 px-5 py-5">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black">הניחושים של {name}</h1>
          <p className="text-sm text-muted-foreground">
            תוצאה מדויקת = 3 נקודות · מנצח נכון בלבד = נקודה אחת
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-gold/15 px-4 py-2 text-gold">
          <Trophy className="h-5 w-5" />
          <span className="text-2xl font-black tabular-nums">{totalPoints}</span>
          <span className="text-sm font-semibold">נק׳</span>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <Lock className="h-4 w-4" /> הניחושים שלי ({mineList.length})
        </h2>
        {mineList.length === 0 ? (
          <p className="surface-card px-4 py-6 text-center text-sm text-muted-foreground">
            עדיין לא ניחשת אף משחק.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {mineList
              .map((p) => matchById.get(p.match_id))
              .filter((m): m is NonNullable<typeof m> => Boolean(m))
              .map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  teams={teamMap}
                  myPrediction={mine.get(m.id)}
                  userName={name}
                  compact
                />
              ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <LockOpen className="h-4 w-4" /> משחקים פתוחים לניחוש ({openMatches.length})
        </h2>
        {openMatches.length === 0 ? (
          <p className="surface-card px-4 py-6 text-center text-sm text-muted-foreground">
            אין כרגע משחקים פתוחים לניחוש.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {openMatches.map((m) => (
              <MatchCard key={m.id} match={m} teams={teamMap} userName={name} compact />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
