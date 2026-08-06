import { createServerFn } from "@tanstack/react-start";

export const topScorersQuery = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("get_top_scorers");

    if (error) throw new Error(error.message);
    return (data ?? []) as { scorer: string; goals: number }[];
  });
