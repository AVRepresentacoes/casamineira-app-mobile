import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type Perfil = {
  nome: string;
  media_avaliacoes: number;
  total_avaliacoes: number;
  badge: string;
};

export default function PerfilProfissional() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  useEffect(() => {
    async function carregarPerfil() {
      const { data } = await supabase
        .from("perfis")
        .select("nome, media_avaliacoes, total_avaliacoes, badge")
        .eq("id", id)
        .single();

      setPerfil(data);
    }

    if (id) carregarPerfil();
  }, [id]);

  if (!perfil) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.nome}>{perfil.nome}</Text>

      <Text style={styles.badge}>
        {perfil.badge.toUpperCase()}
      </Text>

      <Text style={styles.info}>
        ⭐ {perfil.media_avaliacoes?.toFixed(1) || "0.0"} (
        {perfil.total_avaliacoes} avaliações)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F1A",
    padding: 20,
    alignItems: "center",
  },
  nome: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  badge: {
    backgroundColor: "#FACC15",
    color: "#000",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  info: {
    color: "#D1D5DB",
  },
});
