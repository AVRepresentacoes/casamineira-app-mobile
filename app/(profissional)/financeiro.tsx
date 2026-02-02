import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Financeiro = {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
  created_at: string;
};

export default function FinanceiroProfissional() {
  const [loading, setLoading] = useState(true);
  const [saldo, setSaldo] = useState(0);
  const [bloqueado, setBloqueado] = useState(0);
  const [lista, setLista] = useState<Financeiro[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    // carteira
    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", auth.user.id)
      .single();

    if (wallet) {
      setSaldo(wallet.saldo || 0);
      setBloqueado(wallet.bloqueado || 0);
    }

    // extrato
    const { data: extrato } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setLista(extrato || []);
    setLoading(false);
  };

  const solicitarSaqueSimulado = async () => {
    if (saldo <= 0) {
      Alert.alert("Info", "Saldo indisponível para saque.");
      return;
    }

    setProcessing(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const novoSaldo = 0;
    const novoBloqueado = bloqueado + saldo;

    await supabase
      .from("wallets")
      .update({ saldo: novoSaldo, bloqueado: novoBloqueado })
      .eq("user_id", auth.user.id);

    await supabase.from("wallet_transactions").insert({
      user_id: auth.user.id,
      tipo: "saque_pendente",
      valor: saldo,
      descricao: "Solicitação de saque (simulado)",
    });

    setProcessing(false);
    Alert.alert("Saque solicitado", "Saque entrou como PENDENTE.");
    carregarDados();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Financeiro</Text>

      {/* RESUMO */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Saldo disponível</Text>
          <Text style={styles.value}>R$ {saldo.toFixed(2)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Bloqueado</Text>
          <Text style={[styles.value, { color: "#f87171" }]}>
            R$ {bloqueado.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            (processing || saldo <= 0) && { opacity: 0.6 },
          ]}
          disabled={processing || saldo <= 0}
          onPress={solicitarSaqueSimulado}
        >
          <Text style={styles.primaryText}>
            {processing ? "Processando..." : "Solicitar Saque"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* EXTRATO */}
      <Text style={styles.subtitle}>Últimas movimentações</Text>

      <FlatList
        data={lista}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipo}>{item.tipo}</Text>
              <Text style={styles.desc}>{item.descricao}</Text>
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleString("pt-BR")}
              </Text>
            </View>
            <Text style={styles.valor}>R$ {item.valor.toFixed(2)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhuma movimentação ainda.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040a",
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#03040a",
  },
  title: {
    color: "#facc15",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
  },
  subtitle: {
    color: "#e5e7eb",
    fontWeight: "900",
    marginVertical: 10,
  },
  card: {
    backgroundColor: "#071026",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#0b1220",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    color: "#9ca3af",
    fontWeight: "700",
  },
  value: {
    color: "#22c55e",
    fontWeight: "900",
  },
  primaryBtn: {
    backgroundColor: "#facc15",
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: {
    color: "#000",
    fontWeight: "900",
  },
  item: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#071026",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#0b1220",
    marginBottom: 10,
  },
  tipo: {
    color: "#facc15",
    fontWeight: "900",
  },
  desc: {
    color: "#9ca3af",
    marginTop: 2,
  },
  date: {
    color: "#6b7280",
    marginTop: 4,
    fontSize: 12,
  },
  valor: {
    color: "#e5e7eb",
    fontWeight: "900",
  },
  empty: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 20,
  },
});
