import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin.server";
import type { Match, Sport } from "./tournament";

export const supportersQuery = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("team_supporters")
      .select("team_id, points, updated_at")
      .order("points", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addSupportPoints = createServerFn({ method: "POST" })
  .validator((d) =>
    z.object({
      userName: z.string().min(1).max(40),
      team_id: z.string().uuid(),
      points: z.number().int().min(1).max(1000),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.userName);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("team_supporters")
      .select("points")
      .eq("team_id", data.team_id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw new Error(fetchError.message);
    }

    const newPoints = (existing?.points ?? 0) + data.points;

    const { error: upsertError } = await supabaseAdmin
      .from("team_supporters")
      .upsert({ team_id: data.team_id, points: newPoints });

    if (upsertError) throw new Error(upsertError.message);
    return { ok: true as const, newPoints };
  });

export const resetSupportPoints = createServerFn({ method: "POST" })
  .validator((d) =>
    z.object({
      userName: z.string().min(1).max(40),
      team_id: z.string().uuid(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.userName);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("team_supporters")
      .update({ points: 0 })
      .eq("team_id", data.team_id);

    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
