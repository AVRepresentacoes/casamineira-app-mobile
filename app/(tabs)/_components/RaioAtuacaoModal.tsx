import { useEffect, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

export default function RaioAtuacaoModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [raio, setRaio] = useState("10");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    carregarRaio();
  }, []);

  const carregarRaio = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const { data } = await supabase
      .from("profissionais")
      .select("raio_km")
      .eq("user_id", auth.user.id)
      .single();

    if (data?.raio_km) {
      setRaio(String(data.raio_km));
    }
  };

  const salvarRaio = async () => {
    const valor = Number(raio);
    if (!valor || valor <= 0) {
      Alert.alert("Erro", "Informe um raio válido em km.");
      return;
    }

    setSaving(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const { error } = await supabase
      .from("profissionais")
      .update({ raio_km: valor })
      .eq("user_id", auth.user.id);

    setSaving(false);

    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      Alert.alert("Sucesso", "Raio de atuação atualizado.");
      onClose();
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>Raio de atuação</Text>

        <Text style={styles.label}>Atendo até quantos km?</Text>

        <TextInput
          style={styles.input}
          value={raio}
          onChangeText={setRaio}
          keyboardType="numeric"
          placeholder="Ex: 10"
          placeholderTextColor="#6b7280"
        />

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={salvarRaio}
          disabled={saving}
        >
          <Text style={styles.saveText}>
            {saving ? "Salvando..." : "Salvar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancel}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modal: {
    width: "90%",
    backgroundColor: "#071026",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#0b1220",
  },
  title: {
    color: "#facc15",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 16,
  },
  label: {
    color: "#9ca3af",
    fontWeight: "700",
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
  saveBtn: {
    backgroundColor: "#facc15",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
  },
  saveText: {
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
