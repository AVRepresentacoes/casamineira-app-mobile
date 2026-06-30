import { logout } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";

export const HOSPEDAGENS_PROFILE_CACHE_KEY = "@hospedagens_cliente_profile_v1";

type AuthUser = Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"];

function encodeParamValue(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  const text = String(value ?? "").trim();
  return text ? [text] : [];
}

function buildCurrentPath(pathname: string, params: Record<string, unknown>) {
  const searchParams = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(params)) {
    for (const value of encodeParamValue(rawValue)) {
      searchParams.append(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getSafeHospedagensRedirect(value: unknown) {
  const redirectTo = String(value || "").trim();
  if (!redirectTo.startsWith("/") || redirectTo.startsWith("//") || redirectTo.startsWith("/(auth)/login")) {
    return "";
  }

  return redirectTo;
}

export async function clearHospedagensInvalidSessionCache() {
  await AsyncStorage.removeItem(HOSPEDAGENS_PROFILE_CACHE_KEY);
}

export async function getValidHospedagensUser(): Promise<AuthUser | null> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    await clearHospedagensInvalidSessionCache();
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    await logout();
    await clearHospedagensInvalidSessionCache();
    return null;
  }

  return data.user;
}

export function useRequireHospedagensAuth(explicitRedirectTo?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const paramsKey = JSON.stringify(params);

  const redirectTo = useMemo(
    () => explicitRedirectTo || buildCurrentPath(pathname, params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [explicitRedirectTo, paramsKey, pathname],
  );

  useEffect(() => {
    let mounted = true;

    async function requireAuth() {
      const validUser = await getValidHospedagensUser();
      if (!mounted) return;

      if (!validUser) {
        router.replace({
          pathname: "/(auth)/login",
          params: { redirectTo },
        });
        return;
      }

      setUser(validUser);
      setCheckingAuth(false);
    }

    void requireAuth();
    return () => {
      mounted = false;
    };
  }, [redirectTo, router]);

  return { checkingAuth, user };
}
