import { supabase } from "@/integrations/supabase/client";

export type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
  streak: number;
};

/** Top learners by total XP. Signed-in only — the database function hides private fields. */
export async function fetchLeaderboard(limit = 25): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc("get_leaderboard", { _limit: limit });
  if (error) throw new Error(error.message);
  return (data ?? []) as LeaderboardEntry[];
}
