import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MatchCard } from "@/components/tournament/MatchCard";
import { NameDialog } from "@/components/tournament/NameDialog";
import { Button } from "@/components/ui/button";
import { useTournament } from "@/hooks/use-tournament";
import { useUserName } from "@/hooks/use-user-name";
import { preloadTournament } from "@/lib/route-helpers";
import { SPORTS, type MatchStatus, type Sport } from "@/lib/tournament";

export const Route = createFileRoute("/schedule")({
  loader: ({ context }) => preloadTournament(context.queryClient),
  head: () => ({
    meta: [
      { title: "לוח משחקים ותוצאות — אליפות היחידה" },
      {
        name: "description",
        content: "כל משחקי הטורניר לפי ענף: עתידיים, חיים ומשחקים שהסתיימו עם התוצאה הסופית.",
      },
      { property: "og:title", content: "לוח משחקים ותוצאות — אליפות היחידה" },
      { property: "og:description", content: "סינון לפי ענף וסטטוס, כולל תוצאות מלאות." },
    ],
  }),
  errorComponent: ({ error }) => <p role="alert">שגיאה בטעינת הנתונים: {error.message}</p>,
  pendingComponent: () => <p className="text-muted-foreground">טוען…</p>,
  component: Schedule,
});

const STATUS_TABS: { id: MatchStatus | "all"; label: string }[] = [
  { id: "all", label: "הכול" },
  { id: "live", label: "חי" },
  { id: "upcoming", label: "עתידיים" },
  { id: "finished", label: "הסתיימו" },
];

function Schedule() {
  const { matches, teamMap, eventsByMatch, predictions } = useTournament();
  const { name } = useUserName();
  const [sport, setSport] = useState<Sport | "all">("all");
  const [status, setStatus] = useState<MatchStatus | "all">("all");
  const [nameOpen, setNameOpen] = useState(false);

  const mine = new Map(predictions.filter((p) => p.user_name === name).map((p) => [p.match_id, p]));
  const filtered = matches.filter(
    (m) => (sport === "all" || m.sport === sport) && (status === "all" || m.status === status),
  );

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-black">לוח משחקים ותוצאות</h1>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <FilterBtn active={sport === "all"} onClick={() => setSport("all")}>
            כל הענפים
          </FilterBtn>
          {SPORTS.map((s) => (
            <FilterBtn key={s.id} active={sport === s.id} onClick={() => setSport(s.id)}>
              {s.label}
            </FilterBtn>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <FilterBtn key={t.id} active={status === t.id} onClick={() => setStatus(t.id)}>
              {t.label}
            </FilterBtn>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="surface-card px-4 py-8 text-center text-sm text-muted-foreground">
          אין משחקים שתואמים לסינון.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((m) => (
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
        </div>
      )}
      <NameDialog open={nameOpen} onOpenChange={setNameOpen} />
    </div>
  );
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button variant={active ? "default" : "secondary"} size="sm" onClick={onClick}>
      {children}
    </Button>
  );
}
