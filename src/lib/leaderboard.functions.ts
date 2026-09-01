import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
  streak: number;
};

const LeaderboardInput = z.object({
  limit: z.number().int().min(1).max(100).default(25),
});

/**
 * Top learners by total XP. Auth is enforced server-side; only the public
 * leaderboard fields (display name, avatar, XP, streak) ever leave the server.
 */
export const getLeaderboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LeaderboardInput.parse(input ?? {}))
  .handler(async ({ data }): Promise<LeaderboardEntry[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("learning_progress")
      .select("user_id, total_xp, streak, profiles:profiles(display_name, avatar_url)")
      .gt("total_xp", 0)
      .order("total_xp", { ascending: false })
      .order("streak", { ascending: false })
      .limit(data.limit);

    if (error) {
      console.error("[leaderboard]", error.message);
      throw new Error("Could not load the leaderboard right now.");
    }

    type Row = {
      user_id: string;
      total_xp: number | null;
      streak: number | null;
      profiles: { display_name: string | null; avatar_url: string | null } | null;
    };

    return ((rows ?? []) as unknown as Row[]).map((row) => ({
      user_id: row.user_id,
      display_name: row.profiles?.display_name ?? "Learner",
      avatar_url: row.profiles?.avatar_url ?? null,
      total_xp: row.total_xp ?? 0,
      streak: row.streak ?? 0,
    }));
  });
