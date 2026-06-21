import { StyleSheet, Text, View } from "react-native";

export function AdminEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Sem dados</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(9, 15, 31, 0.86)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.20)",
    padding: 22,
  },
  eyebrow: {
    color: "#67e8f9",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 10,
  },
  description: {
    color: "#93aac7",
    marginTop: 8,
    lineHeight: 22,
  },
});
