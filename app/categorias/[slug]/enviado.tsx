import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Enviado() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(tabs)/pedidos");
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pedido enviado com sucesso!</Text>
      <Text style={styles.subtitle}>
        Profissionais irão entrar em contato em breve.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617", justifyContent: "center", alignItems: "center", padding: 25 },
  title: { color: "#22c55e", fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  subtitle: { color: "#9ca3af", textAlign: "center" },
});
