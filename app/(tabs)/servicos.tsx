import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Servico = {
  id: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
};

function formatarPreco(valor: number | null) {
  if (valor === null || isNaN(valor)) return "0,00";
  return valor.toFixed(2).replace(".", ",");
}

export default function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Servico | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setLoading(true);
    const { data } = await supabase.from("servicos").select("*");
    setServicos(data || []);
    setLoading(false);
  }

  async function salvar() {
    const valor = Number(preco.replace(",", "."));
    if (!titulo || isNaN(valor)) {
      Alert.alert("Erro", "Preencha título e preço corretamente");
      return;
    }

    const payload = {
      titulo,
      descricao,
      preco: valor,
    };

    const { error } = editando
      ? await supabase.from("servicos").update(payload).eq("id", editando.id)
      : await supabase.from("servicos").insert(payload);

    if (error) Alert.alert("Erro", error.message);
    else {
      setModal(false);
      setEditando(null);
      setTitulo("");
      setDescricao("");
      setPreco("");
      carregar();
    }
  }

  async function excluir(id: string) {
    Alert.alert("Excluir", "Deseja remover este serviço?", [
      { text: "Cancelar" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await supabase.from("servicos").delete().eq("id", id);
          carregar();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#facc15" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Serviços</Text>

      <TouchableOpacity
        style={styles.add}
        onPress={() => {
          setEditando(null);
          setTitulo("");
          setDescricao("");
          setPreco("");
          setModal(true);
        }}
      >
        <Text style={styles.addText}>+ Novo Serviço</Text>
      </TouchableOpacity>

      <FlatList
        data={servicos}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.itemTitle}>{item.titulo}</Text>
            {item.descricao ? (
              <Text style={styles.desc}>{item.descricao}</Text>
            ) : null}
            <Text style={styles.price}>R$ {formatarPreco(item.preco)}</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => {
                  setEditando(item);
                  setTitulo(item.titulo);
                  setDescricao(item.descricao || "");
                  setPreco(formatarPreco(item.preco));
                  setModal(true);
                }}
              >
                <Text style={styles.edit}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => excluir(item.id)}>
                <Text style={styles.delete}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modal} animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>
            {editando ? "Editar Serviço" : "Novo Serviço"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Título"
            value={titulo}
            onChangeText={setTitulo}
          />

          <TextInput
            style={styles.input}
            placeholder="Descrição"
            value={descricao}
            onChangeText={setDescricao}
          />

          <TextInput
            style={styles.input}
            placeholder="Preço (ex: 150,00)"
            keyboardType="numeric"
            value={preco}
            onChangeText={setPreco}
          />

          <TouchableOpacity style={styles.btn} onPress={salvar}>
            <Text style={styles.btnText}>Salvar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModal(false)}>
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { color: "#facc15", fontSize: 24, fontWeight: "900", marginBottom: 12 },
  add: {
    backgroundColor: "#facc15",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  addText: { fontWeight: "900", textAlign: "center" },
  card: {
    backgroundColor: "#071026",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  itemTitle: { color: "#facc15", fontWeight: "900", fontSize: 16 },
  desc: { color: "#9ca3af", marginTop: 4 },
  price: { color: "#e5e7eb", marginTop: 6, fontWeight: "900" },
  actions: { flexDirection: "row", gap: 20, marginTop: 10 },
  edit: { color: "#38bdf8", fontWeight: "700" },
  delete: { color: "#f87171", fontWeight: "700" },

  modal: { flex: 1, padding: 20, backgroundColor: "#03040a" },
  modalTitle: { color: "#facc15", fontSize: 22, fontWeight: "900" },
  input: {
    backgroundColor: "#071026",
    borderRadius: 12,
    padding: 12,
    color: "#e5e7eb",
    marginTop: 12,
  },
  btn: {
    backgroundColor: "#facc15",
    padding: 14,
    borderRadius: 14,
    marginTop: 20,
    alignItems: "center",
  },
  btnText: { fontWeight: "900" },
  cancel: { color: "#9ca3af", marginTop: 14, textAlign: "center" },
});
