import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AvaliarPedido() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");

  async function enviarAvaliacao() {
    if (nota === 0) {
      Alert.alert("Avaliação obrigatória", "Selecione uma nota.");
      return;
    }

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        Alert.alert("Erro", "Sessão inválida.");
        return;
      }

      const avaliadorId = session.user.id;

      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", id)
        .eq("cliente_id", avaliadorId)
        .maybeSingle();

      if (pedidoError || !pedido) {
        console.log("ERRO BUSCAR PEDIDO AVALIACAO:", pedidoError);
        Alert.alert("Erro", "Pedido não encontrado.");
        return;
      }

      if (pedido.status !== "finalizado") {
        Alert.alert("Aviso", "Só é possível avaliar pedidos finalizados.");
        return;
      }

      const profissionalId =
        (pedido as any)?.profissional_id ?? (pedido as any)?.prestador_id ?? null;

      if (!profissionalId) {
        Alert.alert("Erro", "Pedido sem profissional vinculado para avaliação.");
        return;
      }

      const avaliadoId =
        pedido.cliente_id === avaliadorId
          ? profissionalId
          : pedido.cliente_id;

      const { data: avaliacaoExistente, error: avaliacaoExistenteError } = await supabase
        .from("avaliacoes")
        .select("id")
        .eq("pedido_id", id)
        .eq("avaliador_id", avaliadorId)
        .maybeSingle();

      if (avaliacaoExistenteError) {
        console.log("ERRO BUSCAR AVALIACAO EXISTENTE:", avaliacaoExistenteError);
      }

      if (avaliacaoExistente?.id) {
        Alert.alert("Aviso", "Você já avaliou este pedido.");
        return;
      }

      const { error: insertError } = await supabase
        .from("avaliacoes")
        .insert({
          pedido_id: id,
          avaliador_id: avaliadorId,
          avaliado_id: avaliadoId,
          nota,
          comentario: comentario || null,
        })
        .select()
        .single();

      if (insertError) {
        console.log("ERRO INSERIR AVALIACAO:", insertError);
        Alert.alert("Erro", "Não foi possível enviar avaliação.");
        return;
      }

      const { data: resumo, error: resumoError } = await supabase
        .from("avaliacoes")
        .select("nota")
        .eq("avaliado_id", avaliadoId);

      if (resumoError) {
        console.log("ERRO RESUMO AVALIACAO:", resumoError);
      } else {
        const total = resumo?.length || 0;
        const media =
          total > 0
            ? Number(
                (
                  resumo.reduce((acc, item) => acc + Number(item.nota || 0), 0) /
                  total
                ).toFixed(2)
              )
            : 0;

        const { error: updatePerfilError } = await supabase
          .from("profiles")
          .update({
            media_avaliacao: media,
            media_avaliacoes: media,
            total_avaliacoes: total,
          })
          .eq("id", avaliadoId)
          .select()
          .single();

        if (updatePerfilError) {
          console.log("ERRO ATUALIZAR PERFIL AVALIACAO:", updatePerfilError);
        }
      }

      Alert.alert("Obrigado ⭐", "Avaliação enviada com sucesso!", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/pedidos"),
        },
      ]);
    } catch (error) {
      console.log("ERRO ENVIAR AVALIACAO:", error);
      Alert.alert("Erro", "Não foi possível enviar avaliação.");
    }
  }

  function renderStars() {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setNota(star)}>
            <Ionicons
              name={star <= nota ? "star" : "star-outline"}
              size={36}
              color="#facc15"
              style={{ marginHorizontal: 6 }}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Avalie o serviço</Text>

      <Text style={styles.subtitle}>
        Sua opinião ajuda outros clientes e melhora a qualidade da plataforma.
      </Text>

      {renderStars()}

      <TextInput
        placeholder="Deixe um comentário (opcional)"
        placeholderTextColor="#6B7280"
        style={styles.input}
        multiline
        numberOfLines={4}
        value={comentario}
        onChangeText={setComentario}
      />

      <TouchableOpacity style={styles.button} onPress={enviarAvaliacao}>
        <Text style={styles.buttonText}>Enviar avaliação</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040a",
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#facc15",
    marginBottom: 12,
  },

  subtitle: {
    color: "#9ca3af",
    marginBottom: 30,
  },

  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },

  input: {
    backgroundColor: "#0b1220",
    color: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    textAlignVertical: "top",
  },

  button: {
    backgroundColor: "#facc15",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  buttonText: {
    fontWeight: "900",
    color: "#000",
  },
});
