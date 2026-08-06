import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Match, MatchEvent, Prediction, Team } from "./tournament";

const POLL = 12_000;

export const teamsQuery = queryOptions({
  queryKey: ["teams"],
  queryFn: async (): Promise<Team[]> => {
    const { data, error } = await supabase.from("teams").select("id, name").order("name");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 5 * 60_000,
});

export const matchesQuery = queryOptions({
  queryKey: ["matches"],
  queryFn: async (): Promise<Match[]> => {
    const { data, error } = await supabase
      .from("matches")
      .select("id, sport, team_a_id, team_b_id, starts_at, status, score_a, score_b")
      .order("starts_at");
    if (error) throw error;
    return (data ?? []) as Match[];
  },
  refetchInterval: POLL,
});

export const eventsQuery = queryOptions({
  queryKey: ["match_events"],
  queryFn: async (): Promise<MatchEvent[]> => {
    const { data, error } = await supabase
      .from("match_events")
      .select("id, match_id, text, scorer, minute, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw error;
    return (data ?? []) as MatchEvent[];
  },
  refetchInterval: POLL,
});

export const predictionsQuery = queryOptions({
  queryKey: ["predictions"],
  queryFn: async (): Promise<Prediction[]> => {
    const { data, error } = await supabase
      .from("predictions")
      .select("id, match_id, user_name, predicted_score_a, predicted_score_b, points_earned, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw error;
    return (data ?? []) as Prediction[];
  },
  refetchInterval: POLL,
});
