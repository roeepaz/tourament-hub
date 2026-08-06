CREATE TYPE public.sport AS ENUM ('football','basketball','manhaim');
CREATE TYPE public.match_status AS ENUM ('upcoming','live','finished');

CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.teams TO anon, authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_public_read" ON public.teams FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport public.sport NOT NULL,
  team_a_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  team_b_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  status public.match_status NOT NULL DEFAULT 'upcoming',
  score_a integer NOT NULL DEFAULT 0,
  score_b integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.matches TO anon, authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_public_read" ON public.matches FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  text text NOT NULL,
  scorer text,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  minute integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.match_events TO anon, authenticated;
GRANT ALL ON public.match_events TO service_role;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "match_events_public_read" ON public.match_events FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  predicted_score_a integer NOT NULL,
  predicted_score_b integer NOT NULL,
  points_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, user_name)
);
CREATE INDEX predictions_user_name_idx ON public.predictions (user_name);
GRANT SELECT, INSERT ON public.predictions TO anon, authenticated;
GRANT ALL ON public.predictions TO service_role;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "predictions_public_read" ON public.predictions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "predictions_public_insert" ON public.predictions FOR INSERT TO anon, authenticated WITH CHECK (
  points_earned = 0
  AND length(btrim(user_name)) BETWEEN 2 AND 40
  AND predicted_score_a BETWEEN 0 AND 200
  AND predicted_score_b BETWEEN 0 AND 200
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id AND m.status = 'upcoming' AND m.starts_at > now()
  )
);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER matches_touch_updated_at BEFORE UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.score_predictions()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'finished' THEN
    UPDATE public.predictions p
    SET points_earned = CASE
      WHEN p.predicted_score_a = NEW.score_a AND p.predicted_score_b = NEW.score_b THEN 3
      WHEN sign(p.predicted_score_a - p.predicted_score_b) = sign(NEW.score_a - NEW.score_b) THEN 1
      ELSE 0 END
    WHERE p.match_id = NEW.id;
  ELSE
    UPDATE public.predictions p SET points_earned = 0 WHERE p.match_id = NEW.id AND p.points_earned <> 0;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER matches_score_predictions AFTER UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.score_predictions();

INSERT INTO public.teams (name) VALUES
  ('פרויקטי הגנא'),('פעמון'),('רימון'),('רקיע'),('קרן אור'),('לפיד');

ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_events;