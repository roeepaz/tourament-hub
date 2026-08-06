import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AdminSession = { unlocked?: boolean };

export async function isAdminUser(userName: string): Promise<boolean> {
  if (!userName) return false;
  const ADMIN_USERNAME = process.env["ADMIN_USERNAME"] || "admin";
  if (userName !== ADMIN_USERNAME) return false;
  return true;
}

export async function requireAdmin(userName: string): Promise<void> {
  if (!(await isAdminUser(userName))) throw new Error("נדרשת התחברות מנהל");
}
