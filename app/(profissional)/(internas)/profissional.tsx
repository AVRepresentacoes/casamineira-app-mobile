import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WelcomeProfissional() {
  const router = useRouter();

  const logoAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [buttonAnim, contentAnim, logoAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: logoAnim,
          transform: [
            {
              translateY: logoAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        }}
      >
        <Image source={require("../../../assets/images/icons/icon.png")} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      <Animated.View style={{ opacity: contentAnim }}>
        <Text style={styles.title}>
          Trabalhe por conta própria.
          {"\n"}Ganhe mais. Sem enrolação.
        </Text>

        <Text style={styles.subtitle}>
          Receba pedidos, organize serviços,
          receba pagamentos com segurança e saque direto no PIX.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.buttons, { opacity: buttonAnim }]}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/register?role=profissional")}>
          <Text style={styles.primaryText}>Quero trabalhar pela Casa Mineira</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryText}>Voltar</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  logo: { width: 130, height: 130, marginBottom: 26 },
  title: { color: "#facc15", fontSize: 22, fontWeight: "900", textAlign: "center", marginBottom: 14, lineHeight: 30 },
  subtitle: { color: "#e5e7eb", fontSize: 15, textAlign: "center", marginBottom: 24, lineHeight: 22 },
  buttons: { width: "100%", gap: 14 },
  primaryButton: { backgroundColor: "#facc15", paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  primaryText: { color: "#000", fontSize: 15, fontWeight: "900", textAlign: "center" },
  secondaryButton: { borderColor: "#374151", borderWidth: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  secondaryText: { color: "#9ca3af", fontSize: 14, fontWeight: "700" },
});
