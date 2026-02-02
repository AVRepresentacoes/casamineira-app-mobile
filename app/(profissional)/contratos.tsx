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

type Contrato = {
  id: string;
  titulo: string;
  descricao: string;
  valor: number;
  status: "pendente" | "em_andamento" | "concluido" | "cancelado";
};

export default function ContratosProfissional() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [lista, setLista] = useState<Contrato[]>([]);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    carregarContratos();
  }, []);

  const carregarContratos = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const { data, error } = await supabase
      .from("contratos")
      .select("*")
      .eq("profissional_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (!error) setLista(data || []);
    setLoading(false);
  };

  const salvarContrato = async () => {
    if (!titulo || !valor) {
      Alert.alert("Atenção", "Informe título e valor.");
      return;
    }

    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const payload = {
      profissional_id: auth.user.id,
      titulo,
      descricao,
      valor: Number(valor),
      status: "pendente",
      updated_at: new Date().toISOString(),
    };

    let error;

    if (editId) {
      ({ error } = await supabase
        .from("contratos")
        .update(payload)
        .eq("id", editId));
    } else {
      ({ error } = await supabase.from("contratos").insert(payload));
    }

    setSaving(false);

    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      limpar();
      carregarContratos();
    }
  };

  const limpar = () => {
    setTitulo("");
    setDescricao("");
    setValor("");
    setEditId(null);
  };

  const editar = (c: Contrato) => {
    setTitulo(c.titulo);
    setDescricao(c.descricao || "");
    setValor(String(c.valor));
    setEditId(c.id);
  };

  const alterarStatus = async (id: string, status: Contrato["status"]) => {
    await supabase.from("contratos").update({ status }).eq("id", id);
    carregarContratos();
  };

  const badge = (status: Contrato["status"]) => {
    const cores: any = {
      pendente: "#facc15",
      em_andamento: "#38bdf8",
      concluido: "#22c55e",
      cancelado: "#f87171",
    };
    return { color: cores[status] || "#9ca3af" };
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
      <Text style={styles.title}>Contratos</Text>

      {/* FORM */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {editId ? "Editar Contrato" : "Nova Proposta"}
        </Text>

        <TextInput
          placeholder="Título do serviço"
          placeholderTextColor="#6b7280"
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
        />

        <TextInput
          placeholder="Descrição"
          placeholderTextColor="#6b7280"
          style={[styles.input, { height: 80 }]}
          value={descricao}
          onChangeText={setDescricao}
          multiline
        />

        <TextInput
          placeholder="Valor (ex: 150)"
          placeholderTextColor="#6b7280"
          style={styles.input}
          value={valor}
          onChangeText={setValor}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
          onPress={salvarContrato}
          disabled={saving}
        >
          <Text style={styles.primaryText}>
            {saving ? "Salvando..." : editId ? "Atualizar" : "Criar Proposta"}
          </Text>
        </TouchableOpacity>

        {editId && (
          <TouchableOpacity onPress={limpar}>
            <Text style={styles.cancel}>Cancelar edição</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* LISTA */}
      <FlatList
        data={lista}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.itemTitle}>{item.titulo}</Text>
            <Text style={styles.desc}>{item.descricao || "—"}</Text>

            <Text style={[styles.status, badge(item.status)]}>
              {item.status.replace("_", " ").toUpperCase()}
            </Text>

            <Text style={styles.valor}>R$ {item.valor.toFixed(2)}</Text>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => editar(item)}
              >
                <Text style={styles.secondaryText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => alterarStatus(item.id, "em_andamento")}
              >
                <Text style={styles.secondaryText}>Iniciar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => alterarStatus(item.id, "concluido")}
              >
                <Text style={styles.secondaryText}>Concluir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryBtn,
                  { borderColor: "#f87171" },
                ]}
                onPress={() => alterarStatus(item.id, "cancelado")}
              >
                <Text style={styles.secondaryText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  card: {
    backgroundColor: "#071026",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#0b1220",
    marginBottom: 12,
  },
  cardTitle: {
    color: "#e5e7eb",
    fontWeight: "900",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#03040a",
    borderRadius: 12,
    padding: 12,
    color: "#e5e7eb",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#0b1220",
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
  cancel: {
    marginTop: 10,
    textAlign: "center",
    color: "#9ca3af",
  },
  itemTitle: {
    color: "#e5e7eb",
    fontWeight: "900",
    fontSize: 16,
  },
  desc: {
    color: "#9ca3af",
    marginTop: 4,
  },
  status: {
    marginTop: 6,
    fontWeight: "900",
  },
  valor: {
    color: "#e5e7eb",
    fontWeight: "900",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#374151",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryText: {
    color: "#e5e7eb",
    fontWeight: "800",
  },
});
