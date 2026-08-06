-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE public.sport AS ENUM ('football','basketball','manhaim');
CREATE TYPE public.match_status AS ENUM ('upcoming','live','finished');

-- Teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Matches table
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

-- Match events table
CREATE TABLE public.match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  text text NOT NULL,
  scorer text,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  minute integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Predictions table
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

-- Users table for authentication
CREATE TABLE public.users (
  user_name text PRIMARY KEY,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX predictions_user_name_idx ON public.predictions (user_name);
CREATE INDEX matches_sport_status_idx ON public.matches (sport, status);
CREATE INDEX match_events_match_id_idx ON public.match_events (match_id);

-- RLS Policies
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Teams: public read, authenticated insert/update
CREATE POLICY "teams_public_read" ON public.teams FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "teams_authenticated_write" ON public.teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "teams_authenticated_update" ON public.teams FOR UPDATE TO authenticated USING (true);

-- Matches: public read, authenticated insert/update
CREATE POLICY "matches_public_read" ON public.matches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "matches_authenticated_write" ON public.matches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "matches_authenticated_update" ON public.matches FOR UPDATE TO authenticated USING (true);

-- Match events: public read, authenticated insert/update
CREATE POLICY "match_events_public_read" ON public.match_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "match_events_authenticated_write" ON public.match_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "match_events_authenticated_update" ON public.match_events FOR UPDATE TO authenticated USING (true);

-- Predictions: public read, authenticated insert
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

-- Users: public read, authenticated insert/update
CREATE POLICY "users_public_read" ON public.users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "users_public_insert" ON public.users FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "users_public_update" ON public.users FOR UPDATE TO anon, authenticated USING (true);

-- Triggers and functions
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

-- Sample data
INSERT INTO public.teams (name) VALUES
  ('פרויקטי הגנא'),('פעמון'),('רימון'),('רקיע'),('קרן אור'),('לפיד');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_events;
