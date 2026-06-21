import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type Props = {
  mode: "buscando" | "disparado" | "aceito" | "expirado";
};

const CONFIG = {
  buscando: {
    icon: "sync-outline" as const,
    color: "#facc15",
    title: "Buscando profissionais próximos...",
    description: "Estamos identificando profissionais elegíveis perto de você.",
    loading: true,
  },
  disparado: {
    icon: "flash-outline" as const,
    color: "#38bdf8",
    title: "Chamado enviado com sucesso",
    description: "Aguardando aceite do primeiro profissional disponível.",
    loading: false,
  },
  aceito: {
    icon: "checkmark-circle-outline" as const,
    color: "#22c55e",
    title: "Profissional confirmado",
    description: "Seu chamado rápido foi aceito e está em andamento.",
    loading: false,
  },
  expirado: {
    icon: "time-outline" as const,
    color: "#facc15",
    title: "Tempo de busca expirado",
    description: "Você pode reenviar no modo rápido ou receber propostas.",
    loading: false,
  },
};

export default function StatusChamadoRapido({ mode }: Props) {
  const cfg = CONFIG[mode];

  return (
    <View style={[styles.card, { borderColor: `${cfg.color}55` }]}> 
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${cfg.color}22` }]}> 
          <Ionicons name={cfg.icon} size={18} color={cfg.color} />
        </View>
        <Text style={[styles.title, { color: cfg.color }]}>{cfg.title}</Text>
      </View>

      <Text style={styles.description}>{cfg.description}</Text>

      {cfg.loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color="#facc15" />
          <Text style={styles.loaderText}>Sincronizando disponibilidade...</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    flexShrink: 1,
  },
  description: {
    marginTop: 8,
    color: "#cbd5e1",
    lineHeight: 20,
    fontSize: 13,
  },
  loaderWrap: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loaderText: {
    color: "#94a3b8",
    fontSize: 12,
  },
});
