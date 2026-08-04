ALTER TABLE public.learning_progress
  ADD COLUMN IF NOT EXISTS today_correct integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS today_quizzes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS today_translations integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS claimed_missions text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS streak_freezes integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS freezes_used integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit integer DEFAULT 25)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  total_xp integer,
  streak integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lp.user_id,
         COALESCE(p.display_name, 'Learner') AS display_name,
         p.avatar_url,
         lp.total_xp,
         lp.streak
  FROM public.learning_progress lp
  LEFT JOIN public.profiles p ON p.id = lp.user_id
  WHERE lp.total_xp > 0
  ORDER BY lp.total_xp DESC, lp.streak DESC
  LIMIT LEAST(GREATEST(_limit, 1), 100);
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated;