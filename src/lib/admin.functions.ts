import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isAdminUser, requireAdmin } from "./admin.server";

const sportEnum = z.enum(["football", "basketball", "manhaim"]);
const statusEnum = z.enum(["upcoming", "live", "finished"]);

export const adminStatus = createServerFn({ method: "GET" })
  .validator((d) => z.object({ userName: z.string().min(1).max(40) }).parse(d))
  .handler(async ({ data }) => ({
    unlocked: await isAdminUser(data.userName),
  }));

export const adminLogin = createServerFn({ method: "POST" })
  .validator((d) => z.object({ userName: z.string().min(1).max(40), password: z.string().min(1).max(72) }).parse(d))
  .handler(async ({ data }) => {
    const isAdmin = await isAdminUser(data.userName);
    if (!isAdmin) return { ok: false as const, reason: "invalid_user" as const };
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" })
  .validator((d) => z.object({ userName: z.string().min(1).max(40) }).parse(d))
  .handler(async () => {
    return { ok: true as const };
  });

export const saveMatch = createServerFn({ method: "POST" })
  .validator((d) =>
    z.object({
      userName: z.string().min(1).max(40),
      id: z.string().uuid().optional(),
      sport: sportEnum,
      team_a_id: z.string().uuid(),
      team_b_id: z.string().uuid(),
      starts_at: z.string().min(4),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.userName);
    if (data.team_a_id === data.team_b_id) throw new Error("יש לבחור שתי קבוצות שונות");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      sport: data.sport,
      team_a_id: data.team_a_id,
      team_b_id: data.team_b_id,
      starts_at: new Date(data.starts_at).toISOString(),
    };
    const { error } = data.id
      ? await supabaseAdmin.from("matches").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("matches").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const updateMatchResult = createServerFn({ method: "POST" })
  .validator((d) =>
    z.object({
      userName: z.string().min(1).max(40),
      id: z.string().uuid(),
      status: statusEnum,
      score_a: z.number().int().min(0).max(200),
      score_b: z.number().int().min(0).max(200),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.userName);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("matches")
      .update({ status: data.status, score_a: data.score_a, score_b: data.score_b })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteMatch = createServerFn({ method: "POST" })
  .validator((d) => z.object({ userName: z.string().min(1).max(40), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.userName);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("matches").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const addMatchEvent = createServerFn({ method: "POST" })
  .validator((d) =>
    z.object({
      userName: z.string().min(1).max(40),
      match_id: z.string().uuid(),
      text: z.string().min(1).max(200),
      scorer: z.string().max(60).optional().nullable(),
      minute: z.number().int().min(0).max(300).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.userName);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("match_events").insert({
      match_id: data.match_id,
      text: data.text,
      scorer: data.scorer ?? null,
      minute: data.minute ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteMatchEvent = createServerFn({ method: "POST" })
  .validator((d) => z.object({ userName: z.string().min(1).max(40), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.userName);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("match_events").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
