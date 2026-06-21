import { StyleSheet, Text, View } from "react-native";

export default function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    color: "#e5e7eb",
    fontWeight: "900",
    fontSize: 16,
  },
  subtitle: {
    color: "#9ca3af",
    marginTop: 6,
    textAlign: "center",
  },
});
