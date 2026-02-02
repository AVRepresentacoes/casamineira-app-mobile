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

type Contrato = {
  id: string;
  titulo: string;
  valor: number;
  prazo: string;
  status: string;
};

export default function Contratos() {
  const [lista, setLista] = useState<Contrato[]>([]);
  const [titulo, setTitulo] = useState("");
  const [valor, setValor] = useState("");
  const [prazo, setPrazo] = useState("");
  const [modal, setModal] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const { data } = await supabase
      .from("contratos")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    setLista(data || []);
  }

  async function salvar() {
    if (!titulo || !valor) {
      Alert.alert("Erro", "Preencha os campos");
      return;
    }

    const v = Number(valor.replace(",", "."));
    if (isNaN(v)) {
      Alert.alert("Erro", "Valor inválido");
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const { error } = await supabase.from("contratos").insert({
      titulo,
      valor: v,
      prazo,
      status: "rascunho",
      user_id: auth.user.id,
    });

    if (error) Alert.alert("Erro", error.message);
    else {
      setModal(false);
      setTitulo("");
      setValor("");
      setPrazo("");
      carregar();
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contratos</Text>

      <TouchableOpacity style={styles.add} onPress={() => setModal(true)}>
        <Text style={styles.addText}>+ Novo Contrato</Text>
      </TouchableOpacity>

      <FlatList
        data={lista}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <Text style={styles.text}>Valor: R$ {item.valor.toFixed(2).replace(".", ",")}</Text>
            <Text style={styles.text}>Prazo: {item.prazo || "—"}</Text>
            <Text style={styles.status}>{item.status.toUpperCase()}</Text>
          </View>
        )}
      />

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Novo Contrato</Text>

            <TextInput
              placeholder="Título"
              placeholderTextColor="#6b7280"
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
            />

            <TextInput
              placeholder="Valor (ex: 150,00)"
              placeholderTextColor="#6b7280"
              style={styles.input}
              keyboardType="numeric"
              value={valor}
              onChangeText={setValor}
            />

            <TextInput
              placeholder="Prazo / Observações"
              placeholderTextColor="#6b7280"
              style={styles.input}
              value={prazo}
              onChangeText={setPrazo}
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
  add: {
    backgroundColor: "#facc15",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginVertical: 20,
  },
  addText: { color: "#000", fontWeight: "900" },
  card: {
    backgroundColor: "#071026",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { color: "#e5e7eb", fontWeight: "900", fontSize: 16 },
  text: { color: "#9ca3af", marginTop: 4 },
  status: { color: "#22c55e", marginTop: 6, fontWeight: "800" },
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
