import { StyleSheet, Text, View } from "react-native";

type Props = {
  path: string;
};

export default function EditScreenInfo({ path }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tela</Text>

      <View style={styles.separator} />

      <Text style={styles.description}>
        Edite o arquivo:
      </Text>

      <Text style={styles.path}>{path}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#facc15",
  },
  separator: {
    marginVertical: 16,
    height: 1,
    width: "80%",
    backgroundColor: "#1f2933",
  },
  description: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 6,
  },
  path: {
    fontSize: 13,
    color: "#e5e7eb",
    fontFamily: "monospace",
  },
});