import { BrandLogo } from "@/components/brand/BrandLogo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isCompact = width < 1120;
  const [email, setEmail] = useState("");

  function handleSubmit() {
    if (!email.trim()) {
      Alert.alert("Atenção", "Informe seu e-mail para receber o link de recuperação.");
      return;
    }

    Alert.alert(
      "Recuperação de senha",
      "Fluxo visual preparado. A integração real com recuperação de senha será conectada em uma etapa futura.",
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.pageContent, isMobile ? styles.pageContentMobile : null]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#08101f", "#050914", "#0b1221"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.shell}>
        <View style={[styles.mainPanel, isMobile ? styles.mainPanelMobile : null]}>
          {!isMobile ? (
            <View style={[styles.hero, isCompact ? styles.heroCompact : null]}>
              <View style={styles.logoRow}>
                <BrandLogo size="medium" showText={false} />
                <Text style={styles.logoText}>Casa Mineira <Text style={styles.logoAccent}>SaaS</Text></Text>
              </View>

              <View style={styles.heroCopy}>
                <View style={styles.kicker}>
                  <Ionicons name="shield-checkmark" size={13} color="#9b7cff" />
                  <Text style={styles.kickerText}>ACESSO SEGURO</Text>
                </View>
                <Text style={[styles.heroTitle, isCompact ? styles.heroTitleCompact : null]}>
                  Recupere o acesso à sua empresa digital.
                </Text>
                <Text style={styles.heroBody}>
                  Continue criando aplicativos, sites, sistemas e marketplaces com uma experiência protegida e profissional.
                </Text>
              </View>

              <View style={styles.signalPanel}>
                <View style={styles.signalIcon}>
                  <Ionicons name="key-outline" size={34} color="#dbe8ff" />
                </View>
                <Text style={styles.signalTitle}>Conta protegida</Text>
                <Text style={styles.signalText}>Recuperação visual pronta para conexão backend sem expor credenciais no frontend.</Text>
              </View>
            </View>
          ) : null}

          <View style={[styles.formColumn, isCompact ? styles.formColumnCompact : null, isMobile ? styles.formColumnMobile : null]}>
            {isMobile ? (
              <View style={styles.mobileBrand}>
                <BrandLogo size="small" showText={false} />
                <Text style={styles.mobileLogoText}>Casa Mineira <Text style={styles.logoAccent}>SaaS</Text></Text>
              </View>
            ) : null}

            <LinearGradient colors={["rgba(26, 38, 58, 0.96)", "rgba(13, 20, 34, 0.98)"]} style={[styles.card, isMobile ? styles.cardMobile : null]}>
              <Pressable style={styles.backButton} onPress={() => router.replace("/login")} accessibilityRole="link">
                <Ionicons name="arrow-back" size={18} color="#cbd5e1" />
                <Text style={styles.backText}>Voltar para login</Text>
              </Pressable>

              <View style={styles.cardHeader}>
                <Text style={[styles.title, isMobile ? styles.titleMobile : null]}>Recuperar senha</Text>
                <Text style={styles.subtitle}>
                  Informe seu e-mail para preparar o envio do link de recuperação da Casa Mineira SaaS.
                </Text>
              </View>

              <View style={styles.form}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  placeholder="seu@email.com"
                  placeholderTextColor="#7c8798"
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />

                <Pressable
                  style={(state) => [
                    styles.primaryButton,
                    Boolean((state as any).hovered) ? styles.primaryButtonHover : null,
                    state.pressed ? styles.primaryButtonPressed : null,
                  ]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.primaryText}>Enviar link de recuperação</Text>
                  <Ionicons name="arrow-forward" size={17} color="#ffffff" />
                </Pressable>
              </View>
            </LinearGradient>

            <View style={styles.securityBox}>
              <Ionicons name="lock-closed" size={24} color="#c4cedd" />
              <Text style={styles.securityText}>Ambiente preparado para segurança, LGPD e recuperação de acesso backend-only.</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#050914",
  },
  pageContent: {
    flexGrow: 1,
  },
  pageContentMobile: {
    minHeight: "100%",
  },
  shell: {
    flex: 1,
    minHeight: 760,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  mainPanel: {
    width: "100%",
    maxWidth: 1180,
    minHeight: 680,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(7, 11, 22, 0.78)",
    flexDirection: "row",
    overflow: "hidden",
  },
  mainPanelMobile: {
    minHeight: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  hero: {
    flex: 1.1,
    padding: 46,
    justifyContent: "space-between",
    borderRightWidth: 1,
    borderRightColor: "rgba(226, 232, 240, 0.1)",
  },
  heroCompact: {
    padding: 34,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoText: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  logoAccent: {
    color: "#8b6cff",
  },
  heroCopy: {
    gap: 18,
  },
  kicker: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(124, 92, 255, 0.32)",
    backgroundColor: "rgba(124, 92, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  kickerText: {
    color: "#c8bfff",
    fontSize: 11,
    fontWeight: "900",
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 54,
    lineHeight: 60,
    fontWeight: "900",
    maxWidth: 620,
  },
  heroTitleCompact: {
    fontSize: 40,
    lineHeight: 46,
  },
  heroBody: {
    color: "#b7c1d1",
    fontSize: 16,
    lineHeight: 26,
    maxWidth: 560,
  },
  signalPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.18)",
    backgroundColor: "rgba(11, 18, 33, 0.78)",
    padding: 22,
    gap: 10,
  },
  signalIcon: {
    width: 62,
    height: 62,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124, 92, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(124, 92, 255, 0.32)",
  },
  signalTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  signalText: {
    color: "#94a3b8",
    lineHeight: 22,
  },
  formColumn: {
    flex: 0.9,
    padding: 34,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  formColumnCompact: {
    padding: 24,
  },
  formColumnMobile: {
    width: "100%",
    padding: 0,
  },
  mobileBrand: {
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  mobileLogoText: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  card: {
    width: "100%",
    maxWidth: 430,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    padding: 28,
    gap: 22,
  },
  cardMobile: {
    maxWidth: "100%",
    padding: 22,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  backText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "800",
  },
  cardHeader: {
    gap: 8,
  },
  title: {
    color: "#f8fafc",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
  },
  titleMobile: {
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    color: "#aeb8c8",
    fontSize: 14,
    lineHeight: 22,
  },
  form: {
    gap: 12,
  },
  label: {
    color: "#d6deea",
    fontSize: 13,
    fontWeight: "900",
  },
  input: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2c3648",
    backgroundColor: "#111827",
    color: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#7c5cff",
    marginTop: 8,
    shadowColor: "#7c5cff",
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  primaryButtonHover: {
    backgroundColor: "#8b6cff",
    transform: [{ scale: 1.01 }],
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  securityBox: {
    width: "100%",
    maxWidth: 430,
    minHeight: 62,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "rgba(22, 32, 49, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  securityText: {
    flex: 1,
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
});
