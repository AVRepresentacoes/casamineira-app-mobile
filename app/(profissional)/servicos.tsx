import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";

/* =====================
   TIPOS (DECLARADOS UMA ÚNICA VEZ)
===================== */
type Servico = {
  id: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
};

/* =====================
   COMPONENTE
===================== */
export default function ServicosProfissional() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");

  useEffect(() => {
    carregarServicos();
  }, []);

  /* =====================
     CARREGAR SERVIÇOS
  ===================== */
  const carregarServicos = async () => {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("servicos")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      setServicos((data as Servico[]) || []);
    }

    setLoading(false);
  };

  /* =====================
     SALVAR SERVIÇO
  ===================== */
  const salvarServico = async () => {
    if (!titulo.trim()) {
      Alert.alert("Atenção", "Informe o título do serviço.");
      return;
    }

    const precoNumero =
      preco.trim() === "" ? null : Number(preco.replace(",", "."));

    if (precoNumero !== null && isNaN(precoNumero)) {
      Alert.alert("Erro", "Preço inválido.");
      return;
    }

    setSaving(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("servicos").insert({
      user_id: auth.user.id,
      titulo,
      descricao,
      preco: precoNumero,
    });

    setSaving(false);

    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      setTitulo("");
      setDescricao("");
      setPreco("");
      carregarServicos();
    }
  };

  /* =====================
     RENDER
  ===================== */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Serviços</Text>

      {/* FORMULÁRIO */}
      <View style={styles.card}>
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={descricao}
          onChangeText={setDescricao}
          multiline
        />

        <Text style={styles.label}>Preço (R$)</Text>
        <TextInput
          style={styles.input}
          value={preco}
          onChangeText={setPreco}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.btn, saving && { opacity: 0.6 }]}
          onPress={salvarServico}
          disabled={saving}
        >
          <Text style={styles.btnText}>
            {saving ? "Salvando..." : "Adicionar Serviço"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTA */}
      <FlatList
        data={servicos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemTitle}>{item.titulo}</Text>
            {item.descricao ? (
              <Text style={styles.itemDesc}>{item.descricao}</Text>
            ) : null}
            <Text style={styles.price}>
              R$ {(item.preco ?? 0).toFixed(2)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum serviço cadastrado.</Text>
        }
      />
    </View>
  );
}

/* =====================
   ESTILOS (PREMIUM ESCURO)
===================== */
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
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#071026",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#0b1220",
    marginBottom: 16,
  },
  label: {
    color: "#9ca3af",
    marginTop: 10,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#03040a",
    borderRadius: 12,
    padding: 12,
    color: "#e5e7eb",
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#0b1220",
  },
  btn: {
    backgroundColor: "#facc15",
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: {
    color: "#000",
    fontWeight: "900",
  },
  item: {
    backgroundColor: "#071026",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#0b1220",
    marginBottom: 10,
  },
  itemTitle: {
    color: "#facc15",
    fontWeight: "900",
    fontSize: 16,
  },
  itemDesc: {
    color: "#9ca3af",
    marginTop: 6,
  },
  price: {
    color: "#34d399",
    fontWeight: "900",
    marginTop: 8,
  },
  empty: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 20,
  },
});
