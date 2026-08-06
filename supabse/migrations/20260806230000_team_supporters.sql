CREATE TABLE public.team_supporters (
  team_id uuid PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id)
);

CREATE INDEX team_supporters_points_idx ON public.team_supporters (points DESC);

ALTER TABLE public.team_supporters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_supporters_public_read" ON public.team_supporters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "team_supporters_admin_write" ON public.team_supporters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "team_supporters_admin_update" ON public.team_supporters FOR UPDATE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.touch_supporters_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER team_supporters_touch_updated_at BEFORE UPDATE ON public.team_supporters
FOR EACH ROW EXECUTE FUNCTION public.touch_supporters_updated_at();
