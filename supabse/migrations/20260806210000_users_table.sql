CREATE TABLE IF NOT EXISTS public.users (
  user_name text PRIMARY KEY,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.users TO anon, authenticated;
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_public_read" ON public.users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "users_public_insert" ON public.users FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "users_public_update" ON public.users FOR UPDATE TO anon, authenticated USING (true);
