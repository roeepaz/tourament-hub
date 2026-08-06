export type Sport = "football" | "basketball" | "manhaim";
export type MatchStatus = "upcoming" | "live" | "finished";

export const SPORTS: { id: Sport; label: string; scoreWord: string }[] = [
  { id: "football", label: "כדורגל", scoreWord: "שערים" },
  { id: "basketball", label: "כדורסל", scoreWord: "נקודות" },
  { id: "manhaim", label: "מחניים", scoreWord: "נקודות" },
];

export const sportLabel = (s: Sport) => SPORTS.find((x) => x.id === s)?.label ?? s;
export const sportScoreWord = (s: Sport) => SPORTS.find((x) => x.id === s)?.scoreWord ?? "נקודות";

export const STATUS_LABEL: Record<MatchStatus, string> = {
  upcoming: "עתידי",
  live: "חי",
  finished: "הסתיים",
};

export type Team = { id: string; name: string };

export type Match = {
  id: string;
  sport: Sport;
  team_a_id: string;
  team_b_id: string;
  starts_at: string;
  status: MatchStatus;
  score_a: number;
  score_b: number;
};

export type MatchEvent = {
  id: string;
  match_id: string;
  text: string;
  scorer: string | null;
  minute: number | null;
  created_at: string;
};

export type Prediction = {
  id: string;
  match_id: string;
  user_name: string;
  predicted_score_a: number;
  predicted_score_b: number;
  points_earned: number;
  created_at: string;
};

export type StandingRow = {
  teamId: string;
  name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  scored: number;
  conceded: number;
  diff: number;
  points: number;
};

/** 3 points for a win, 1 for a draw, 0 for a loss. */
export function computeStandings(teams: Team[], matches: Match[], sport: Sport): StandingRow[] {
  const rows = new Map<string, StandingRow>(
    teams.map((t) => [
      t.id,
      {
        teamId: t.id,
        name: t.name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        scored: 0,
        conceded: 0,
        diff: 0,
        points: 0,
      },
    ]),
  );

  for (const m of matches) {
    if (m.sport !== sport || m.status !== "finished") continue;
    const a = rows.get(m.team_a_id);
    const b = rows.get(m.team_b_id);
    if (!a || !b) continue;
    a.played++;
    b.played++;
    a.scored += m.score_a;
    a.conceded += m.score_b;
    b.scored += m.score_b;
    b.conceded += m.score_a;
    if (m.score_a > m.score_b) {
      a.wins++;
      b.losses++;
      a.points += 3;
    } else if (m.score_a < m.score_b) {
      b.wins++;
      a.losses++;
      b.points += 3;
    } else {
      a.draws++;
      b.draws++;
      a.points++;
      b.points++;
    }
  }

  return [...rows.values()]
    .map((r) => ({ ...r, diff: r.scored - r.conceded }))
    .sort((x, y) => y.points - x.points || y.diff - x.diff || y.scored - x.scored || x.name.localeCompare(y.name, "he"));
}

export function predictionPoints(
  match: Pick<Match, "score_a" | "score_b">,
  p: Pick<Prediction, "predicted_score_a" | "predicted_score_b">,
): number {
  if (p.predicted_score_a === match.score_a && p.predicted_score_b === match.score_b) return 3;
  const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);
  return sign(p.predicted_score_a - p.predicted_score_b) === sign(match.score_a - match.score_b) ? 1 : 0;
}

export function isLocked(match: Match): boolean {
  return match.status !== "upcoming" || new Date(match.starts_at).getTime() <= Date.now();
}

const HE_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `יום ${HE_DAYS[d.getDay()]} · ${d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })} · ${d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.toDateString() === n.toDateString();
}

export function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
