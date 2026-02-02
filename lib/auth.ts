import { supabase } from "./supabase";

export type UserRole = "cliente" | "profissional";

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

export async function getRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return (data?.role as UserRole) || null;
}

export async function setRole(userId: string, role: UserRole) {
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      role,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}
