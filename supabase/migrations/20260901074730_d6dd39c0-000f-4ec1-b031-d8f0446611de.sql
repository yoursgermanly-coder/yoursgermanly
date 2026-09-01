CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit integer DEFAULT 25)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, total_xp integer, streak integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT lp.user_id,
         COALESCE(p.display_name, 'Learner') AS display_name,
         p.avatar_url,
         lp.total_xp,
         lp.streak
  FROM public.learning_progress lp
  LEFT JOIN public.profiles p ON p.id = lp.user_id
  WHERE auth.uid() IS NOT NULL
    AND lp.total_xp > 0
  ORDER BY lp.total_xp DESC, lp.streak DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 25), 1), 100);
$function$;

REVOKE ALL ON FUNCTION public.get_leaderboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated, service_role;