import { useEffect, useState } from "react";
import {
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

type Portfolio = {
  id: string;
  titulo: string;
  descricao: string;
  imagem_url: string | null;
};

export default function PortfolioProfissional() {
  const [lista, setLista] = useState<Portfolio[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagem, setImagem] = useState("");
  const [editando, setEditando] = useState<Portfolio | null>(null);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const { data } = await supabase
      .from("portfolio")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    setLista(data || []);
  }

  async function salvar() {
    if (!titulo || !descricao) {
      Alert.alert("Atenção", "Preencha título e descrição");
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const payload: any = {
      titulo,
      descricao,
      imagem_url: imagem || null,
      user_id: auth.user.id,
    };

    if (editando) payload.id = editando.id;

    const { error } = await supabase.from("portfolio").upsert(payload);

    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      setModal(false);
      setEditando(null);
      setTitulo("");
      setDescricao("");
      setImagem("");
      carregar();
    }
  }

  async function excluir(id: string) {
    await supabase.from("portfolio").delete().eq("id", id);
    carregar();
  }

  function abrirEdicao(item: Portfolio) {
    setEditando(item);
    setTitulo(item.titulo);
    setDescricao(item.descricao);
    setImagem(item.imagem_url || "");
    setModal(true);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portfólio</Text>

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => {
          setEditando(null);
          setTitulo("");
          setDescricao("");
          setImagem("");
          setModal(true);
        }}
      >
        <Text style={styles.addText}>+ Novo Trabalho</Text>
      </TouchableOpacity>

      <FlatList
        data={lista}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <Text style={styles.desc}>{item.descricao}</Text>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.edit}
                onPress={() => abrirEdicao(item)}
              >
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.delete}
                onPress={() => excluir(item.id)}
              >
                <Text style={styles.deleteText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editando ? "Editar Trabalho" : "Novo Trabalho"}
            </Text>

            <TextInput
              placeholder="Título"
              placeholderTextColor="#6b7280"
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
            />

            <TextInput
              placeholder="Descrição"
              placeholderTextColor="#6b7280"
              style={[styles.input, { height: 100 }]}
              value={descricao}
              onChangeText={setDescricao}
              multiline
            />

            <TextInput
              placeholder="URL da imagem (opcional)"
              placeholderTextColor="#6b7280"
              style={styles.input}
              value={imagem}
              onChangeText={setImagem}
            />

            <TouchableOpacity style={styles.save} onPress={salvar}>
              <Text style={styles.saveText}>Salvar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModal(false)}>
              <Text style={styles.cancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a", padding: 20 },
  title: { color: "#facc15", fontSize: 26, fontWeight: "900" },
  addBtn: {
    backgroundColor: "#facc15",
    padding: 14,
    borderRadius: 14,
    marginVertical: 20,
    alignItems: "center",
  },
  addText: { color: "#000", fontWeight: "900" },
  card: {
    backgroundColor: "#071026",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { color: "#e5e7eb", fontWeight: "900", fontSize: 16 },
  desc: { color: "#9ca3af", marginTop: 6 },
  row: { flexDirection: "row", gap: 10, marginTop: 14 },
  edit: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#facc15",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  editText: { color: "#facc15", fontWeight: "800" },
  delete: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  deleteText: { color: "#ef4444", fontWeight: "800" },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#03040a",
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    color: "#facc15",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#071026",
    borderRadius: 12,
    padding: 12,
    color: "#e5e7eb",
    marginTop: 10,
  },
  save: {
    backgroundColor: "#facc15",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  saveText: { color: "#000", fontWeight: "900" },
  cancel: { color: "#9ca3af", textAlign: "center", marginTop: 12 },
});
