import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ActiveRole = "cliente" | "profissional" | "fornecedor";

/**
 * Busca o papel do usuário no banco
 */
export async function getRole(
  userId: string
): Promise<"cliente" | "profissional" | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.log("Erro ao buscar role:", error.message);
      return null;
    }

    if (!data?.role) {
      console.log("Usuário sem role definida");
      return null;
    }

    return data.role as "cliente" | "profissional";
  } catch (err) {
    console.log("Erro inesperado:", err);
    return null;
  }
}

/**
 * Salva qual perfil o usuário escolheu usar
 */
export async function setActiveRole(
  role: ActiveRole
) {
  await AsyncStorage.setItem("@active_role", role);
}

/**
 * Recupera o perfil ativo
 */
export async function getActiveRole(): Promise<
  ActiveRole | null
> {
  return (await AsyncStorage.getItem("@active_role")) as ActiveRole | null;
}

/**
 * Limpa sessão local
 */
export async function logout() {
  await AsyncStorage.removeItem("@active_role");
  await supabase.auth.signOut();
}
