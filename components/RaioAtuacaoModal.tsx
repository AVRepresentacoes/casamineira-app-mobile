import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function RaioAtuacaoModal({ visible, onClose }: Props) {
  const [cep, setCep] = useState("");
  const [raio, setRaio] = useState("10");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) carregar();
  }, [visible]);

  const carregar = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const { data } = await supabase
      .from("profissionais_config")
      .select("*")
      .eq("user_id", auth.user.id)
      .single();

    if (data) {
      setCep(data.cep || "");
      setRaio(String(data.raio_km || 10));
    }
  };

  const salvar = async () => {
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    await supabase.from("profissionais_config").upsert({
      user_id: auth.user.id,
      cep,
      raio_km: Number(raio) || 10,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Raio de atuação</Text>

          <Text style={styles.label}>CEP base</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 30110-012"
            placeholderTextColor="#6b7280"
            value={cep}
            onChangeText={setCep}
          />

          <Text style={styles.label}>Raio (km)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={raio}
            onChangeText={setRaio}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.save}
              onPress={salvar}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.saveText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
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
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },
  label: {
    color: "#9ca3af",
    marginTop: 10,
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
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancel: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
  },
  cancelText: {
    color: "#9ca3af",
    fontWeight: "800",
  },
  save: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#facc15",
    alignItems: "center",
  },
  saveText: {
    color: "#000",
    fontWeight: "900",
  },
});
