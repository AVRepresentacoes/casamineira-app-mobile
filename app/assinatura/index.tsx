import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Assinatura() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plano PRO</Text>
      <Text style={styles.desc}>
        Desbloqueie relatórios, cálculos automáticos e ferramentas avançadas.
      </Text>

      <TouchableOpacity style={styles.btn}>
        <Text style={styles.btnText}>Assinar Agora</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040a",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#facc15",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 12,
    textAlign: "center",
  },
  desc: {
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 24,
  },
  btn: {
    backgroundColor: "#facc15",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 16,
  },
});
