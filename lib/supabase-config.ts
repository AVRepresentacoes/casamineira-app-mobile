import Constants from "expo-constants";

type SupabaseExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as SupabaseExtra;

export const SUPABASE_ENV_KEYS = {
  url: ["NEXT_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_URL", "SUPABASE_URL"],
  anonKey: ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "EXPO_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"],
  appUrl: ["APP_URL", "PUBLIC_APP_URL", "EXPO_PUBLIC_APP_URL", "NEXT_PUBLIC_APP_URL"],
};

function firstEnv(keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

export function getSupabasePublicConfig() {
  return {
    url: firstEnv(SUPABASE_ENV_KEYS.url) || extra.supabaseUrl || "",
    anonKey: firstEnv(SUPABASE_ENV_KEYS.anonKey) || extra.supabaseAnonKey || "",
    appUrl: firstEnv(SUPABASE_ENV_KEYS.appUrl) || "",
    source: {
      url: firstEnv(["NEXT_PUBLIC_SUPABASE_URL"])
        ? "NEXT_PUBLIC_SUPABASE_URL"
        : firstEnv(["EXPO_PUBLIC_SUPABASE_URL"])
          ? "EXPO_PUBLIC_SUPABASE_URL"
          : firstEnv(["SUPABASE_URL"])
            ? "SUPABASE_URL"
            : extra.supabaseUrl
              ? "expoConfig.extra.supabaseUrl"
              : "missing",
      anonKey: firstEnv(["NEXT_PUBLIC_SUPABASE_ANON_KEY"])
        ? "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        : firstEnv(["EXPO_PUBLIC_SUPABASE_ANON_KEY"])
          ? "EXPO_PUBLIC_SUPABASE_ANON_KEY"
          : firstEnv(["SUPABASE_ANON_KEY"])
            ? "SUPABASE_ANON_KEY"
            : extra.supabaseAnonKey
              ? "expoConfig.extra.supabaseAnonKey"
              : "missing",
    },
  };
}

export function validateSupabasePublicConfig(config = getSupabasePublicConfig()) {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!config.url) {
    errors.push("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL/EXPO_PUBLIC_SUPABASE_URL ausente.");
  } else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url)) {
    warnings.push("URL do Supabase fora do formato esperado https://<project-ref>.supabase.co.");
  }

  if (!config.anonKey) {
    errors.push("SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY/EXPO_PUBLIC_SUPABASE_ANON_KEY ausente.");
  } else if (!config.anonKey.startsWith("eyJ")) {
    warnings.push("Anon key nao parece um JWT Supabase.");
  }

  return {
    ok: errors.length === 0,
    status: errors.length ? "red" : warnings.length ? "yellow" : "green",
    errors,
    warnings,
  };
}
