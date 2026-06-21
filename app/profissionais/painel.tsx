import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";

export default function PainelProfissional() {
  const [pedidos, setPedidos] = useState<any[]>([]);

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("id, servico, status")
        .eq("status", "aguardando_profissionais")
        .order("created_at", { ascending: false });

      if (!ativo) return;
      if (error) {
        setPedidos([]);
        return;
      }

      setPedidos(data ?? []);
    };

    void carregar();
    const timer = setInterval(() => void carregar(), 8000);

    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <FlatList
      data={pedidos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ backgroundColor: "#111827", margin: 15, padding: 15 }}>
          <Text style={{ color: "#fff" }}>{item.servico}</Text>
        </View>
      )}
    />
  );
}
