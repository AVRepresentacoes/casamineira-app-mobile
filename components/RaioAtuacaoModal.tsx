import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function RaioAtuacaoModal({ visible, onClose }: Props) {
  const [cep, setCep] = useState("");
  const [raio, setRaio] = useState("10");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) carregarConfiguracao();
  }, [visible]);

  const carregarConfiguracao = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const { data, error } = await supabase
      .from("profissionais_config")
      .select("*")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error) {
      console.log("Erro ao carregar config:", error.message);
      return;
    }

    if (data) {
      setCep(data.cep || "");
      setRaio(String(data.raio_km || 10));
    }
  };

  const salvar = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    setLoading(true);

    const { error } = await supabase.from("profissionais_config").upsert({
      user_id: auth.user.id,
      cep,
      raio_km: Number(raio) || 10,
      updated_at: new Date().toISOString(),
    });

    setLoading(false);

    if (error) {
      Alert.alert("Erro", error.message);
      return;
    }

    Alert.alert("Sucesso", "Raio de atuação atualizado.");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Raio de Atuação</Text>

          <Text style={styles.label}>CEP base</Text>
          <TextInput
            style={styles.input}
            value={cep}
            onChangeText={setCep}
            placeholder="Ex: 30110-012"
            placeholderTextColor="#6b7280"
          />

          <Text style={styles.label}>Raio (km)</Text>
          <TextInput
            style={styles.input}
            value={raio}
            onChangeText={setRaio}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={salvar}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? "Salvando..." : "Salvar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#03040a",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#0b1220",
  },
  title: {
    color: "#facc15",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  label: {
    color: "#9ca3af",
    marginTop: 12,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#071026",
    borderRadius: 12,
    padding: 12,
    color: "#e5e7eb",
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#0b1220",
  },
  btn: {
    backgroundColor: "#facc15",
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: {
    color: "#000",
    fontWeight: "900",
  },
  cancel: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 14,
    fontWeight: "700",
  },
});
