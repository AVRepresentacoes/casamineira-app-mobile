import { isCurrentUserSuperAdmin } from "@/lib/saas-admin";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

type GuardState = {
  checking: boolean;
  authenticated: boolean;
  superAdmin: boolean;
  webOnly: boolean;
};

export function useRequireSuperAdminWeb() {
  const [state, setState] = useState<GuardState>({
    checking: true,
    authenticated: false,
    superAdmin: false,
    webOnly: Platform.OS === "web",
  });

  useEffect(() => {
    let active = true;

    async function validate() {
      if (Platform.OS !== "web") {
        if (active) {
          setState({
            checking: false,
            authenticated: false,
            superAdmin: false,
            webOnly: false,
          });
        }
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;

        if (!session?.user) {
          setState({
            checking: false,
            authenticated: false,
            superAdmin: false,
            webOnly: true,
          });
          return;
        }

        const superAdmin = await isCurrentUserSuperAdmin().catch(() => false);
        if (!active) return;

        setState({
          checking: false,
          authenticated: true,
          superAdmin,
          webOnly: true,
        });
      } catch {
        if (!active) return;
        setState({
          checking: false,
          authenticated: false,
          superAdmin: false,
          webOnly: true,
        });
      }
    }

    void validate();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void validate();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
