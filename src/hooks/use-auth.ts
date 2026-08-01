import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

/** Single source of truth for the signed-in learner in client components. */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      setSession(sessionData.session);
      setIsLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const user: User | null = session?.user ?? null;

  return { session, user, isLoading, isSignedIn: Boolean(user), signOut };
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let isActive = true;
    void supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (isActive) setProfile((data as Profile | null) ?? null);
      });
    return () => {
      isActive = false;
    };
  }, [userId]);

  return profile;
}
