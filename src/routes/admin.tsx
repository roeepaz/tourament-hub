import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { LogOut, Plus, Send, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SportBadge } from "@/components/tournament/SportBadge";
import { StatusBadge } from "@/components/tournament/StatusBadge";
import { useTournament } from "@/hooks/use-tournament";
import { useUserName } from "@/hooks/use-user-name";
import { preloadTournament } from "@/lib/route-helpers";
import {
  addMatchEvent,
  adminLogin,
  adminLogout,
  adminStatus,
  deleteMatch,
  deleteMatchEvent,
  saveMatch,
  updateMatchResult,
} from "@/lib/admin.functions";
import { addSupportPoints, resetSupportPoints } from "@/lib/supporters.functions";
import {
  SPORTS,
  formatDateTime,
  toLocalInputValue,
  type Match,
  type MatchStatus,
  type Sport,
} from "@/lib/tournament";

export const Route = createFileRoute("/admin")({
  ssr: false,
  loader: ({ context }) => preloadTournament(context.queryClient),
  head: () => ({
    meta: [
      { title: "פאנל ניהול — אליפות היחידה" },
      { name: "description", content: "ניהול לוח המשחקים, התוצאות והעדכונים החיים של הטורניר." },
      { property: "og:title", content: "פאנל ניהול — אליפות היחידה" },
      { property: "og:description", content: "אזור מוגן בקוד למנהל הטורניר." },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: ({ error }) => <p role="alert">שגיאה: {error.message}</p>,
  pendingComponent: () => <p className="text-muted-foreground">טוען…</p>,
  component: Admin,
});

function Admin() {
  const { name } = useUserName();
  const status = useServerFn(adminStatus);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-status", name],
    queryFn: () => status({ data: { userName: name || "" } }),
  });

  if (isLoading) return <p className="text-muted-foreground">טוען…</p>;
  if (!name) {
    return (
      <div className="surface-card mx-auto flex max-w-sm flex-col gap-4 px-5 py-8 text-center">
        <Shield className="h-12 w-12 text-destructive mx-auto" />
        <h1 className="text-xl font-black">נדרש משתמש מנהל</h1>
        <p className="text-sm text-muted-foreground">
          התחבר עם שם משתמש מנהל כדי לגשת לפאנל הניהול.
        </p>
      </div>
    );
  }
  if (!data?.unlocked) {
    return (
      <div className="surface-card mx-auto flex max-w-sm flex-col gap-4 px-5 py-8 text-center">
        <Shield className="h-12 w-12 text-destructive mx-auto" />
        <h1 className="text-xl font-black">אין הרשאה</h1>
        <p className="text-sm text-muted-foreground">
          המשתמש &quot;{name}&quot; אינו מ� hed murdered מנהל.
        </p>
      </div>
    );
  }
  return <AdminPanel userName={name} />;
}

function AdminPanel({ userName }: { userName: string }) {
  const queryClient = useQueryClient();
  const { matches, teams, teamMap, eventsByMatch } = useTournament();
  const logout = useServerFn(adminLogout);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["matches"] });
    void queryClient.invalidateQueries({ queryKey: ["match_events"] });
    void queryClient.invalidateQueries({ queryKey: ["predictions"] });
    void queryClient.invalidateQueries({ queryKey: ["supporters"] });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">פאנל ניהול</h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            await logout({ data: { userName } });
            void queryClient.invalidateQueries({ queryKey: ["admin-status"] });
          }}
        >
          <LogOut className="h-4 w-4" />
          יציאה
        </Button>
      </div>

      <MatchForm userName={userName} teams={teams} onSaved={refresh} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-black">משחקים ({matches.length})</h2>
        {matches.length === 0 && (
          <p className="surface-card px-4 py-6 text-center text-sm text-muted-foreground">
            עדיין לא נוצרו משחקים.
          </p>
        )}
        {matches.map((m) => (
          <AdminMatchRow
            key={m.id}
            userName={userName}
            match={m}
            teamAName={teamMap.get(m.team_a_id)?.name ?? "—"}
            teamBName={teamMap.get(m.team_b_id)?.name ?? "—"}
            eventCount={eventsByMatch.get(m.id)?.length ?? 0}
            onChanged={refresh}
          />
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-black">אלופי העידוד</h2>
        <SupportersAdmin userName={userName} teams={teams} onChanged={refresh} />
      </section>
    </div>
  );
}

function SupportersAdmin({
  userName,
  teams,
  onChanged,
}: {
  userName: string;
  teams: { id: string; name: string }[];
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const addFn = useServerFn(addSupportPoints);
  const resetFn = useServerFn(resetSupportPoints);
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id ?? "");
  const [points, setPoints] = useState("1");

  const addMutation = useMutation({
    mutationFn: () =>
      addFn({ data: { userName, team_id: selectedTeam, points: Number(points) || 0 } }),
    onSuccess: () => {
      toast.success("נקודות העידוד עודכנו");
      onChanged();
      setPoints("1");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetFn({ data: { userName, team_id: selectedTeam } }),
    onSuccess: () => {
      toast.success("נקודות העידוד אופסו");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="surface-card flex flex-col gap-3 px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <Label>קבוצה</Label>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger>
              <SelectValue placeholder="בחר קבוצה" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label>נקודות להוסיף</Label>
          <Input
            type="number"
            inputMode="numeric"
            value={points}
            onChange={(e) => setPoints(e.target.value.replace(/\D/g, "").slice(0, 4))}
            min={1}
            max={1000}
          />
        </div>
        <div className="flex flex-col gap-1 sm:self-end">
          <Button size="sm" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
            הוסף נקודות עידוד
          </Button>
        </div>
      </div>
      <div>
        <Button variant="ghost" size="sm" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>
          אפס נקודות עידוד לקבוצה
        </Button>
      </div>
    </div>
  );
}

function MatchForm({ userName, teams, onSaved }: { userName: string; teams: { id: string; name: string }[]; onSaved: () => void }) {
  const save = useServerFn(saveMatch);
  const [sport, setSport] = useState<Sport>("football");
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [startsAt, setStartsAt] = useState(toLocalInputValue(new Date().toISOString()));

  const mutation = useMutation({
    mutationFn: () =>
      save({ data: { userName, sport, team_a_id: teamA, team_b_id: teamB, starts_at: startsAt } }),
    onSuccess: () => {
      toast.success("המשחק נוסף");
      setTeamA("");
      setTeamB("");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      className="surface-card flex flex-col gap-3 px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (teamA && teamB) mutation.mutate();
      }}
    >
      <h2 className="flex items-center gap-2 text-lg font-black">
        <Plus className="h-4 w-4" /> משחק חדש
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>ענף</Label>
          <Select value={sport} onValueChange={(v) => setSport(v as Sport)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPORTS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>תאריך ושעה</Label>
          <Input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>קבוצה א׳</Label>
          <Select value={teamA} onValueChange={setTeamA}>
            <SelectTrigger>
              <SelectValue placeholder="בחר קבוצה" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>קבוצה ב׳</Label>
          <Select value={teamB} onValueChange={setTeamB}>
            <SelectTrigger>
              <SelectValue placeholder="בחר קבוצה" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={!teamA || !teamB || mutation.isPending} className="self-start">
        הוסף משחק
      </Button>
    </form>
  );
}

const STATUSES: MatchStatus[] = ["upcoming", "live", "finished"];

function AdminMatchRow({
  userName,
  match,
  teamAName,
  teamBName,
  eventCount,
  onChanged,
}: {
  userName: string;
  match: Match;
  teamAName: string;
  teamBName: string;
  eventCount: number;
  onChanged: () => void;
}) {
  const update = useServerFn(updateMatchResult);
  const remove = useServerFn(deleteMatch);
  const addEvent = useServerFn(addMatchEvent);
  const deleteEvent = useServerFn(deleteMatchEvent);
  const [scoreA, setScoreA] = useState(String(match.score_a));
  const [scoreB, setScoreB] = useState(String(match.score_b));
  const [status, setStatus] = useState<MatchStatus>(match.status);
  const [eventText, setEventText] = useState("");
  const [scorer, setScorer] = useState("");
  const [minute, setMinute] = useState("");

  const saveResult = useMutation({
    mutationFn: () =>
      update({ data: { userName, id: match.id, status, score_a: Number(scoreA || 0), score_b: Number(scoreB || 0) } }),
    onSuccess: () => {
      toast.success("התוצאה עודכנה");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const postEvent = useMutation({
    mutationFn: () =>
      addEvent({ data: { userName, match_id: match.id, text: eventText, scorer: scorer || null, minute: minute ? Number(minute) : null } }),
    onSuccess: () => {
      toast.success("העדכון פורסם");
      setEventText("");
      setScorer("");
      setMinute("");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMatch = useMutation({
    mutationFn: () => remove({ data: { userName, id: match.id } }),
    onSuccess: () => {
      toast.success("המשחק נמחק");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="surface-card flex flex-col gap-3 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <SportBadge sport={match.sport} />
          <span className="truncate font-bold">
            {teamAName} נגד {teamBName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={match.status} />
          <Button
            variant="ghost"
            size="icon"
            aria-label="מחק משחק"
            onClick={() => {
              if (confirm("למחוק את המשחק? כל הניחושים עליו יימחקו.")) removeMatch.mutate();
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {formatDateTime(match.starts_at)} · {eventCount} עדכונים
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">{teamAName}</Label>
          <Input
            className="h-9 w-16 text-center"
            inputMode="numeric"
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value.replace(/\D/g, "").slice(0, 3))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">{teamBName}</Label>
          <Input
            className="h-9 w-16 text-center"
            inputMode="numeric"
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value.replace(/\D/g, "").slice(0, 3))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">סטטוס</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as MatchStatus)}>
            <SelectTrigger className="h-9 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "upcoming" ? "עתידי" : s === "live" ? "חי" : "הסתיים"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => saveResult.mutate()} disabled={saveResult.isPending}>
          שמור תוצאה
        </Button>
      </div>

      <form
        className="flex flex-wrap items-end gap-2 border-t border-border/60 pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (eventText.trim()) postEvent.mutate();
        }}
      >
        <div className="flex min-w-40 flex-1 flex-col gap-1">
          <Label className="text-xs">עדכון מהמגרש</Label>
          <Input
            value={eventText}
            onChange={(e) => setEventText(e.target.value)}
            placeholder="שער ללפיד"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">כובש</Label>
          <Input
            className="w-28"
            value={scorer}
            onChange={(e) => setScorer(e.target.value)}
            placeholder="שם"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">דקה</Label>
          <Input
            className="w-16 text-center"
            inputMode="numeric"
            value={minute}
            onChange={(e) => setMinute(e.target.value.replace(/\D/g, "").slice(0, 3))}
          />
        </div>
        <Button type="submit" size="sm" variant="secondary" disabled={postEvent.isPending}>
          <Send className="h-4 w-4" />
          פרסם
        </Button>
      </form>
    </div>
  );
}
