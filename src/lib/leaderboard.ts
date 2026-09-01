import { getLeaderboard, type LeaderboardEntry } from "./leaderboard.functions";

export type { LeaderboardEntry };

/** Top learners by total XP. Signed-in only — enforced by the server function. */
export async function fetchLeaderboard(limit = 25): Promise<LeaderboardEntry[]> {
  return getLeaderboard({ data: { limit } });
}
