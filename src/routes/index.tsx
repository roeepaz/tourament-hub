import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Radio, Users, Trophy, Goal } from "lucide-react";
import { MatchCard } from "@/components/tournament/MatchCard";
import { NameDialog } from "@/components/tournament/NameDialog";
import { Button } from "@/components/ui/button";
import { useTournament } from "@/hooks/use-tournament";
import { useUserName } from "@/hooks/use-user-name";
import { preloadTournament } from "@/lib/route-helpers";
import { isToday } from "@/lib/tournament";
import { supportersQuery } from "@/lib/supporters.functions";
import { topScorersQuery } from "@/lib/top-scorers.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  loader: ({ context }) => preloadTournament(context.queryClient),
  head: () => ({
    meta: [
      { title: "אליפות היחידה — משחקי היום ותוצאות חיות" },
      {
        name: "description",
        content: "כל משחקי היום בכדורגל, כדורסל ומחניים, כולל תוצאות חיות ועדכונים מהמגרש.",
      },
      { property: "og:title", content: "אליפות היחידה — משחקי היום" },
      { property: "og:description", content: "תוצאות חיות ועדכונים מכל שלושת הענפים." },
      { property: "og:image", content: "/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "אליפות היחידה - לוגו" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://tourament-hub.roeepaz.com" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "אליפות היחידה — משחקי היום" },
      { name: "twitter:description", content: "תוצאות חיות ועדכונים מכל שלושת הענפים." },
      { name: "twitter:image", content: "/og-image.png" },
    ],
  }),
  errorComponent: ({ error }) => <p role="alert">שגיאה בטעינת הנתונים: {error.message}</p>,
  pendingComponent: () => <p className="text-muted-foreground">טוען…</p>,
  component: Home,
});

function Home() {
  const { matches, teamMap, eventsByMatch, predictions } = useTournament();
  const { data: supporters } = useQuery({
    queryKey: ["supporters"],
    queryFn: () => supportersQuery({}),
  });
  const { data: scorers } = useQuery({
    queryKey: ["top-scorers"],
    queryFn: () => topScorersQuery({}),
  });
  const { name } = useUserName();
  const [nameOpen, setNameOpen] = useState(false);

  const live = matches.filter((m) => m.status === "live");
  const today = matches.filter((m) => isToday(m.starts_at) && m.status !== "live");
  const next = matches
    .filter((m) => m.status === "upcoming" && new Date(m.starts_at).getTime() > Date.now())
    .slice(0, 3);

  const mine = new Map(predictions.filter((p) => p.user_name === name).map((p) => [p.match_id, p]));

  const topSupporters = (supporters ?? [])
    .map((s) => ({
      teamId: s.team_id,
      name: teamMap.get(s.team_id)?.name ?? "—",
      points: s.points,
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  const topScorersList = (scorers ?? []).slice(0, 3);

  return (
    <div className="flex flex-col gap-8">
      {topSupporters.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold" />
            <h2 className="text-xl font-black">אלופי העידוד</h2>
          </div>
          <div className="surface-card overflow-x-auto">
            <table className="w-full min-w-md text-right text-sm">
              <thead className="border-b border-border/70 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-semibold">#</th>
                  <th className="px-3 py-2 font-semibold">קבוצה</th>
                  <th className="px-3 py-2 font-semibold">נקודות עידוד</th>
                </tr>
              </thead>
              <tbody>
                {topSupporters.map((r, i) => (
                  <tr
                    key={r.teamId}
                    className={cn(
                      "border-b border-border/40 last:border-0",
                      i === 0 && "bg-gold/10",
                    )}
                  >
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2 font-bold">{r.name}</td>
                    <td className="px-3 py-2 font-black tabular-nums text-primary">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {topScorersList.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Goal className="h-5 w-5 text-live" />
            <h2 className="text-xl font-black">מלך השערים</h2>
          </div>
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
                {topScorersList.map((r, i) => (
                  <tr
                    key={r.scorer}
                    className={cn(
                      "border-b border-border/40 last:border-0",
                      i === 0 && "bg-gold/10",
                    )}
                  >
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2 font-bold">{r.scorer}</td>
                    <td className="px-3 py-2 font-black tabular-nums text-primary">{r.goals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Section
        title="משחקים חיים"
        icon={<Radio className="h-5 w-5 text-live" />}
        empty="אין כרגע משחקים חיים."
        count={live.length}
      >
        {live.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            teams={teamMap}
            events={eventsByMatch.get(m.id)}
            myPrediction={mine.get(m.id)}
            userName={name}
            onNeedName={() => setNameOpen(true)}
          />
        ))}
      </Section>

      <Section title="משחקי היום" empty="אין משחקים נוספים היום." count={today.length}>
        {today.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            teams={teamMap}
            events={eventsByMatch.get(m.id)}
            myPrediction={mine.get(m.id)}
            userName={name}
            onNeedName={() => setNameOpen(true)}
          />
        ))}
      </Section>

      <Section title="המשחקים הבאים" empty="טרם נקבעו משחקים." count={next.length}>
        {next.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            teams={teamMap}
            myPrediction={mine.get(m.id)}
            userName={name}
            onNeedName={() => setNameOpen(true)}
            compact
          />
        ))}
      </Section>

      <NameDialog open={nameOpen} onOpenChange={setNameOpen} />
    </div>
  );
}

function Section({
  title,
  icon,
  empty,
  count,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  empty: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-xl font-black">
        {icon}
        {title}
      </h2>
      {count === 0 ? (
        <p className="surface-card px-4 py-6 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="flex flex-col gap-3">{children}</div>
      )}
    </section>
  );
}
