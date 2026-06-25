import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getSupabasePublicConfig, validateSupabasePublicConfig } from "@/lib/supabase-config";

const publicConfig = getSupabasePublicConfig();
const bootValidation = validateSupabasePublicConfig(publicConfig);

if (!bootValidation.ok || bootValidation.warnings.length) {
  console.warn("[supabase:boot]", {
    status: bootValidation.status,
    errors: bootValidation.errors,
    warnings: bootValidation.warnings,
    source: publicConfig.source,
  });
}

const SUPABASE_URL = publicConfig.url || "https://invalid.supabase.co";
const SUPABASE_ANON_KEY = publicConfig.anonKey || "invalid-anon-key";
const isStaticRender = typeof window === "undefined";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: !isStaticRender && Platform.OS !== "web" ? AsyncStorage : undefined,
    autoRefreshToken: !isStaticRender,
    persistSession: !isStaticRender,
    detectSessionInUrl: false,
  },
});
