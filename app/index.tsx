import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { getRole, getUser } from "../lib/auth";

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const user = await getUser();

        if (!active) return;

        if (!user) {
          router.replace("/(auth)/login");
          return;
        }

        const role = await getRole(user.id);

        if (role === "profissional") {
          router.replace("/(profissional)");
          return;
        }

        // default: cliente
        router.replace("/(tabs)/dashboard");
      } catch (e) {
        router.replace("/(auth)/login");
      } finally {
        setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
        <Text style={styles.txt}>Carregando...</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: "#03040a", justifyContent: "center", alignItems: "center" },
  txt: { color: "#9ca3af", marginTop: 12, fontWeight: "800" },
});
