import BadgeUrgencia from "@/components/rapid/BadgeUrgencia";
import DistanceBadge from "@/components/rapid/DistanceBadge";
import PressableScale from "@/components/PressableScale";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type Props = {
  categoria: string;
  servico: string;
  descricao: string;
  bairro: string;
  cidade: string;
  distanciaKm: number | null;
  tempoRestante: string;
  processando: boolean;
  onAceitar: () => void;
  onRecusar: () => void;
};

export default function ChamadoRapidoCard({
  categoria,
  servico,
  descricao,
  bairro,
  cidade,
  distanciaKm,
  tempoRestante,
  processando,
  onAceitar,
  onRecusar,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.categoria}>{categoria}</Text>
        <BadgeUrgencia />
      </View>

      <Text style={styles.servico}>{servico}</Text>

      <View style={styles.metaRow}>
        <View style={styles.timerChip}>
          <Ionicons name="time-outline" size={12} color="#facc15" />
          <Text style={styles.timerText}>Expira em {tempoRestante}</Text>
        </View>
      </View>

      <Text style={styles.localizacao}>📍 {bairro} - {cidade}</Text>
      <DistanceBadge km={distanciaKm} />

      <Text style={styles.descricao} numberOfLines={2}>
        {descricao}
      </Text>

      <View style={styles.actionsRow}>
        <PressableScale
          style={[styles.btnAceitar, processando && styles.disabled]}
          onPress={onAceitar}
          disabled={processando}
        >
          {processando ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <Text style={styles.btnAceitarText}>Aceitar agora</Text>
          )}
        </PressableScale>

        <PressableScale
          style={[styles.btnRecusar, processando && styles.disabled]}
          onPress={onRecusar}
          disabled={processando}
        >
          <Text style={styles.btnRecusarText}>Recusar</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0b1220",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 14,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoria: {
    color: "#cbd5e1",
    fontWeight: "800",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  servico: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  timerChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4b3b00",
    backgroundColor: "#1f2937",
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timerText: {
    color: "#facc15",
    fontWeight: "800",
    fontSize: 12,
  },
  localizacao: {
    color: "#cbd5e1",
    marginBottom: 6,
    fontSize: 13,
  },
  descricao: {
    color: "#94a3b8",
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 12,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  btnAceitar: {
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  btnAceitarText: {
    color: "#111827",
    fontWeight: "900",
  },
  btnRecusar: {
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  btnRecusarText: {
    color: "#cbd5e1",
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.7,
  },
});
