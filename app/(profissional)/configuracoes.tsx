import Slider from "@react-native-community/slider";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function ConfiguracoesProfissional() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [ativo, setAtivo] = useState(true);
  const [disponivel, setDisponivel] = useState(true);
  const [raio, setRaio] = useState(10);

  useEffect(() => {
    carregarConfig();
  }, []);

  const carregarConfig = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const { data } = await supabase
      .from("profissionais")
      .select("ativo, disponivel, raio_km")
      .eq("user_id", auth.user.id)
      .single();

    if (data) {
      setAtivo(data.ativo ?? true);
      setDisponivel(data.disponivel ?? true);
      setRaio(data.raio_km ?? 10);
    }

    setLoading(false);
  };

  const salvarConfig = async () => {
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const { error } = await supabase.from("profissionais").upsert({
      user_id: auth.user.id,
      ativo,
      disponivel,
      raio_km: raio,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);

    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      Alert.alert("Sucesso", "Configurações salvas.");
    }
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
      <Text style={styles.title}>Configurações</Text>

      {/* STATUS */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Perfil ativo</Text>
          <Switch
            value={ativo}
            onValueChange={setAtivo}
            thumbColor={ativo ? "#facc15" : "#374151"}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Disponível para pedidos</Text>
          <Switch
            value={disponivel}
            onValueChange={setDisponivel}
            thumbColor={disponivel ? "#22c55e" : "#374151"}
          />
        </View>
      </View>

      {/* RAIO */}
      <View style={styles.card}>
        <Text style={styles.label}>
          Raio de atendimento: {raio} km
        </Text>

        <Slider
          minimumValue={1}
          maximumValue={100}
          step={1}
          value={raio}
          onValueChange={setRaio}
          minimumTrackTintColor="#facc15"
          maximumTrackTintColor="#374151"
          thumbTintColor="#facc15"
        />
      </View>

      {/* BOTÃO */}
      <TouchableOpacity
        style={[styles.btn, saving && { opacity: 0.6 }]}
        onPress={salvarConfig}
        disabled={saving}
      >
        <Text style={styles.btnText}>
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Text>
      </TouchableOpacity>
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
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#071026",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#0b1220",
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    color: "#9ca3af",
    fontWeight: "700",
  },
  btn: {
    backgroundColor: "#facc15",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    color: "#000",
    fontWeight: "900",
  },
});
