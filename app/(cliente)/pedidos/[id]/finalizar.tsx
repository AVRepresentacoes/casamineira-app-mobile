import { obterPagamentoPorPedido } from "@/lib/payments";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function FinalizarPedido() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [valor, setValor] = useState<number>(0);
  const [statusPagamento, setStatusPagamento] = useState<string>("pendente");

  const carregarDados = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        Alert.alert("Erro", "Sessão inválida.");
        return;
      }

      const { data, error } = await supabase
        .from("pedidos")
        .select("valor_final")
        .eq("id", id)
        .eq("cliente_id", session.user.id)
        .maybeSingle();

      if (error || !data) {
        Alert.alert("Erro", "Pedido não encontrado para sua conta.");
        return;
      }

      if (data?.valor_final) {
        setValor(Number(data.valor_final));
      }

      const pagamento = await obterPagamentoPorPedido(id);
      setStatusPagamento(pagamento?.status_pagamento || "pendente");
    } catch (error) {
      console.log("ERRO FINALIZAR CARREGAR:", error);
      Alert.alert("Erro", "Não foi possível carregar dados financeiros.");
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void carregarDados();
  }, [carregarDados, id]);

  async function finalizarServico() {
    if (statusPagamento !== "aprovada") {
      Alert.alert("Pagamento pendente", "Finalize o pagamento antes de concluir o serviço.");
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

      const { error } = await supabase
        .from("pedidos")
        .update({ status: "finalizado", updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("cliente_id", session.user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      router.replace(`/(cliente)/pedidos/${id}/avaliar`);
    } catch (error) {
      console.log("ERRO FINALIZAR SERVICO:", error);
      Alert.alert("Erro", "Não foi possível finalizar o pedido.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finalizar serviço</Text>

      <Text style={styles.label}>Valor do serviço</Text>
      <Text style={styles.valor}>R$ {Number(valor || 0).toFixed(2)}</Text>

      <Text style={styles.status}>
        {statusPagamento === "aprovada" ? "Pagamento aprovado" : "Pagamento aguardando"}
      </Text>

      <TouchableOpacity style={styles.secondary} onPress={carregarDados}>
        <Text style={styles.secondaryText}>Atualizar status</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={finalizarServico}>
        <Text style={styles.buttonText}>Finalizar pedido</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F1A",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FACC15",
    marginBottom: 24,
  },
  label: {
    color: "#9CA3AF",
    marginBottom: 6,
  },
  valor: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  status: {
    color: "#E5E7EB",
    marginBottom: 20,
    fontWeight: "700",
  },
  secondary: {
    backgroundColor: "#1F2937",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 14,
  },
  secondaryText: {
    color: "#fff",
    fontWeight: "800",
  },
  button: {
    backgroundColor: "#22C55E",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 16,
  },
});
