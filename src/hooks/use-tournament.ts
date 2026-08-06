import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { eventsQuery, matchesQuery, predictionsQuery, teamsQuery } from "@/lib/queries";
import type { MatchEvent, Team } from "@/lib/tournament";

export function useTournament() {
  const teams = useSuspenseQuery(teamsQuery).data;
  const matches = useSuspenseQuery(matchesQuery).data;
  const events = useSuspenseQuery(eventsQuery).data;
  const predictions = useSuspenseQuery(predictionsQuery).data;

  const teamMap = useMemo(() => new Map<string, Team>(teams.map((t) => [t.id, t])), [teams]);
  const eventsByMatch = useMemo(() => {
    const map = new Map<string, MatchEvent[]>();
    for (const e of events) {
      const list = map.get(e.match_id) ?? [];
      list.push(e);
      map.set(e.match_id, list);
    }
    return map;
  }, [events]);

  return { teams, teamMap, matches, events, eventsByMatch, predictions };
}
