import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

type Profissional = {
  id: string;
  nome: string;
};

export function useRequireProfissional() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profissional, setProfissional] = useState<Profissional | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setLoading(false);
          router.replace("/(auth)/login");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("id, role, name")
          .eq("id", user.id)
          .maybeSingle();

        if (error || !data || data.role !== "profissional") {
          setLoading(false);
          router.replace("/(tabs)/index");
          return;
        }

        setProfissional({
          id: data.id,
          nome: data.name ?? "Profissional",
        });
        setLoading(false);
      } catch (err) {
        console.log("ERRO useRequireProfissional:", err);
        setLoading(false);
        router.replace("/(auth)/login");
      }
    }

    carregar();
  }, []);

  return { loading, profissional };
}
