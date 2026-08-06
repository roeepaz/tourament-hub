import type { QueryClient } from "@tanstack/react-query";
import { eventsQuery, matchesQuery, predictionsQuery, teamsQuery } from "./queries";

export function preloadTournament(queryClient: QueryClient) {
  return Promise.all([
    queryClient.ensureQueryData(teamsQuery),
    queryClient.ensureQueryData(matchesQuery),
    queryClient.ensureQueryData(eventsQuery),
    queryClient.ensureQueryData(predictionsQuery),
  ]).then(() => undefined);
}
