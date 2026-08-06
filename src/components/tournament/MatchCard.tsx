import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, MessageSquare, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SportBadge } from "./SportBadge";
import { StatusBadge } from "./StatusBadge";
import {
  formatDateTime,
  isLocked,
  sportScoreWord,
  type Match,
  type MatchEvent,
  type Prediction,
  type Team,
} from "@/lib/tournament";
import { cn } from "@/lib/utils";

type Props = {
  match: Match;
  teams: Map<string, Team>;
  events?: MatchEvent[] | undefined;
  myPrediction?: Prediction | undefined;
  userName: string;
  onNeedName?: (() => void) | undefined;
  compact?: boolean | undefined;
};

export function MatchCard({
  match,
  teams,
  events = [],
  myPrediction,
  userName,
  onNeedName,
  compact,
}: Props) {
  const queryClient = useQueryClient();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const locked = isLocked(match);
  const teamA = teams.get(match.team_a_id)?.name ?? "—";
  const teamB = teams.get(match.team_b_id)?.name ?? "—";
  const showScore = match.status !== "upcoming";

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("predictions").insert({
        match_id: match.id,
        user_name: userName.trim(),
        predicted_score_a: Number(a),
        predicted_score_b: Number(b),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("הניחוש נשמר. בהצלחה!");
      setA("");
      setB("");
      void queryClient.invalidateQueries({ queryKey: ["predictions"] });
    },
    onError: (e: { code?: string; message?: string; details?: string }) => {
      const isDuplicateName = e.details?.includes("(user_name)=") && !e.details?.includes("match_id");
      toast.error(
        isDuplicateName
          ? "שם המשתמש כבר תפוס, בחר שם אחר"
          : e.code === "23505"
            ? "כבר ניחשת את המשחק הזה"
            : "לא ניתן לשמור את הניחוש כרגע",
      );
    },
  });

  const canSubmit = a !== "" && b !== "" && Number(a) >= 0 && Number(b) >= 0;

  return (
    <article className="surface-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-2.5">
        <SportBadge sport={match.sport} />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {formatDateTime(match.starts_at)}
        </div>
        <StatusBadge status={match.status} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-5">
        <h3 className="truncate text-center text-base font-bold sm:text-lg">{teamA}</h3>
        <div
          className={cn(
            "min-w-20 rounded-xl px-3 py-1.5 text-center text-2xl font-black tabular-nums",
            match.status === "live" ? "bg-live/15 text-live" : "bg-secondary text-foreground",
          )}
        >
          {showScore ? `${match.score_a} : ${match.score_b}` : "VS"}
        </div>
        <h3 className="truncate text-center text-base font-bold sm:text-lg">{teamB}</h3>
      </div>

      {myPrediction && (
        <div className="flex items-center justify-between gap-2 border-t border-border/70 bg-secondary/40 px-4 py-2 text-sm">
          <span className="text-muted-foreground">
            הניחוש שלך: {myPrediction.predicted_score_a} : {myPrediction.predicted_score_b}
          </span>
          {match.status === "finished" && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                myPrediction.points_earned > 0
                  ? "bg-gold/15 text-gold"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              <Trophy className="h-3.5 w-3.5" />
              {myPrediction.points_earned} נק׳
            </span>
          )}
        </div>
      )}

      {!compact && events.length > 0 && (
        <ul className="border-t border-border/70 px-4 py-3 text-sm">
          {events.slice(0, 6).map((e) => (
            <li key={e.id} className="flex items-start gap-2 py-1 text-muted-foreground">
              <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="text-foreground">
                {e.minute != null && <span className="font-bold text-primary">{e.minute}׳ </span>}
                {e.text}
                {e.scorer && <span className="text-muted-foreground"> — {e.scorer}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!locked && !myPrediction && (
        <div className="border-t border-border/70 px-4 py-3">
          {userName ? (
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) submit.mutate();
              }}
            >
              <span className="text-sm text-muted-foreground">
                נחש {sportScoreWord(match.sport)}:
              </span>
              <Input
                inputMode="numeric"
                aria-label={`תוצאה ${teamA}`}
                className="h-9 w-16 text-center"
                value={a}
                onChange={(e) => setA(e.target.value.replace(/\D/g, "").slice(0, 3))}
              />
              <span className="font-bold">:</span>
              <Input
                inputMode="numeric"
                aria-label={`תוצאה ${teamB}`}
                className="h-9 w-16 text-center"
                value={b}
                onChange={(e) => setB(e.target.value.replace(/\D/g, "").slice(0, 3))}
              />
              <Button type="submit" size="sm" disabled={!canSubmit || submit.isPending}>
                שלח ניחוש
              </Button>
            </form>
          ) : (
            <Button variant="secondary" size="sm" onClick={onNeedName}>
              הזן את שמך כדי לנחש
            </Button>
          )}
        </div>
      )}

      {locked && !myPrediction && match.status === "upcoming" && (
        <p className="border-t border-border/70 px-4 py-2 text-xs text-muted-foreground">
          הניחושים נסגרו
        </p>
      )}
    </article>
  );
}
