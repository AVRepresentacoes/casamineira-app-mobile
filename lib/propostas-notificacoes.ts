import { supabase } from "@/lib/supabase";

export async function contarPropostasNaoLidasCliente() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return 0;
  }

  const { count, error } = await supabase
    .from("propostas")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("lida_cliente", false);

  if (error) {
    console.log("ERRO CONTAR PROPOSTAS NAO LIDAS:", error);
    return 0;
  }

  return Number(count || 0);
}
