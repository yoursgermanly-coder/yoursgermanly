import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";
import { startCloudSync, stopCloudSync } from "@/hooks/use-progress";

/** Keeps device progress and cloud progress in step while a learner is signed in. */
export function CloudSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      stopCloudSync();
      return;
    }
    void startCloudSync(user.id);
    return () => stopCloudSync();
  }, [user]);

  return null;
}
