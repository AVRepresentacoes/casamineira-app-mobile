import { StyleSheet, Text, View } from "react-native";

type Status = "aberto" | "em_andamento" | "concluido";

export default function StatusBadge({ status }: { status: Status }) {
  const labelMap: Record<Status, string> = {
    aberto: "Aberto",
    em_andamento: "Em andamento",
    concluido: "Concluído",
  };

  return (
    <View style={[styles.badge, styles[status]]}>
      <Text style={styles.text}>{labelMap[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: "900",
    color: "#000",
  },
  aberto: { backgroundColor: "#facc15" },
  em_andamento: { backgroundColor: "#22c55e" },
  concluido: { backgroundColor: "#60a5fa" },
});
