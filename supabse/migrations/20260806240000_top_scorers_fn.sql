CREATE OR REPLACE FUNCTION public.get_top_scorers()
RETURNS TABLE(scorer text, goals bigint)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT me.scorer, count(*)::bigint as goals
  FROM public.match_events me
  WHERE me.scorer IS NOT NULL AND btrim(me.scorer) <> ''
  GROUP BY me.scorer
  ORDER BY goals DESC;
$$;
