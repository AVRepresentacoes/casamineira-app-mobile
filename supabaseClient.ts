import "react-native-url-polyfill/auto";
import "react-native-get-random-values";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uinrmrclgzztilrtxboq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbnJtcmNsZ3p6dGlscnR4Ym9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMzM2MDAsImV4cCI6MjA4MDgwOTYwMH0.xL7P6e0quEfAjV4oOLwWLicQgPG7TXkZ1-hmA75IWuA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
