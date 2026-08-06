import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { useTournament } from "@/hooks/use-tournament";
import { useUserName } from "@/hooks/use-user-name";
import { supportersQuery } from "@/lib/supporters.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/supporters")({
  head: () => ({
    meta: [
      { title: "אלופי העידוד — אליפות היחידה" },
      {
        name: "description",
        content: "טבלת עידוד הקבוצות: הצביעו לקבוצה האהובה עליכם ועזרו לה לזכות בתואר אלופי העידוד.",
      },
      { property: "og:title", content: "אלופי העידוד — אליפות היחידה" },
      {
        property: "og:description",
        content: "מי הקבוצה עם הכי הרבה עידוד? צפו בטבלה ועדכנו את הנקודות.",
      },
    ],
  }),
  errorComponent: ({ error }) => <p role="alert">שגיאה בטעינת הנתונים: {error.message}</p>,
  pendingComponent: () => <p className="text-muted-foreground">טוען…</p>,
  component: Supporters,
});

function Supporters() {
  const { teamMap } = useTournament();
  const { data: supporters, isLoading } = useQuery({
    queryKey: ["supporters"],
    queryFn: () => supportersQuery({}),
  });

  const rows = (supporters ?? [])
    .map((s) => ({
      teamId: s.team_id,
      name: teamMap.get(s.team_id)?.name ?? "—",
      points: s.points,
    }))
    .sort((a, b) => b.points - a.points);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-black">אלופי העידוד</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          נקודות עידוד מצטברות לפי קבוצה. המנחה יכול להוסיף נקודות עידוד לכל קבוצה.
        </p>
      </div>

      {isLoading || rows.length === 0 ? (
        <p className="surface-card px-4 py-8 text-center text-sm text-muted-foreground">
          עדיין אין נקודות עידוד.
        </p>
      ) : (
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
              {rows.map((r, i) => (
                <tr
                  key={r.teamId}
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
                  <td className="px-3 py-3 font-bold">{r.name}</td>
                  <td className="px-3 py-3 font-black tabular-nums text-primary">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
