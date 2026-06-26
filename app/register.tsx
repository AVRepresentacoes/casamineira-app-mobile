import { BrandLogo } from "@/components/brand/BrandLogo";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

const BENEFITS = ["Business DNA™", "IA integrada", "Marketplace", "White Label", "Publicação Web + Mobile"] as const;

export default function Register() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const layout = useMemo(() => {
    const mobile = width < 768;
    return {
      mobile,
      compact: width < 1120,
    };
  }, [width]);

  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    if (!nome.trim() || !email.trim() || !telefone.trim() || !senha || !confirmarSenha) {
      Alert.alert("Atenção", "Preencha os campos obrigatórios.");
      return;
    }
    if (senha.length < 6) {
      Alert.alert("Atenção", "A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert("Atenção", "As senhas não conferem.");
      return;
    }
    if (!acceptedTerms) {
      Alert.alert("Atenção", "Aceite os Termos para criar sua conta.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: {
          data: {
            name: nome.trim(),
            role: "cliente",
            company: empresa.trim(),
            phone: telefone.trim(),
          },
        },
      });
      if (error) throw error;

      Alert.alert("Conta criada", "Agora faça login.");
      router.replace("/login");
    } catch (e: any) {
      Alert.alert("Erro ao criar conta", e?.message || "Falha no cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.pageContent, layout.mobile ? styles.pageContentMobile : null]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#08101f", "#050914", "#0b1221"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.shell}>
        <View style={[styles.mainPanel, layout.mobile ? styles.mainPanelMobile : null]}>
          {!layout.mobile ? <RegisterHero compact={layout.compact} /> : null}

          <View style={[styles.registerColumn, layout.compact ? styles.registerColumnCompact : null, layout.mobile ? styles.registerColumnMobile : null]}>
            {layout.mobile ? (
              <View style={styles.mobileBrand}>
                <BrandLogo size="small" showText={false} />
                <Text style={styles.mobileLogoText}>Casa Mineira <Text style={styles.logoAccent}>SaaS</Text></Text>
              </View>
            ) : null}

            <LinearGradient colors={["rgba(26, 38, 58, 0.96)", "rgba(13, 20, 34, 0.98)"]} style={[styles.registerCard, layout.mobile ? styles.registerCardMobile : null]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, layout.mobile ? styles.cardTitleMobile : null]}>Crie sua conta</Text>
                <Text style={styles.cardSubtitle}>Comece pelo seu Business DNA™ e evolua com IA.</Text>
              </View>

              <View style={styles.form}>
                <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome completo" />
                <Field label="Empresa (opcional)" value={empresa} onChangeText={setEmpresa} placeholder="Nome da empresa" />
                <Field label="Email" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" />
                <Field label="Telefone" value={telefone} onChangeText={setTelefone} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
                <Field label="Senha" value={senha} onChangeText={setSenha} placeholder="Crie uma senha" secureTextEntry />
                <Field label="Confirmar senha" value={confirmarSenha} onChangeText={setConfirmarSenha} placeholder="Repita sua senha" secureTextEntry />

                <Pressable style={styles.termsRow} onPress={() => setAcceptedTerms((value) => !value)}>
                  <Ionicons name={acceptedTerms ? "checkbox" : "square-outline"} size={20} color="#8b6cff" />
                  <Text style={styles.termsText}>Aceito os Termos</Text>
                </Pressable>

                <PremiumButton label="Criar conta" icon="arrow-forward" loading={loading} onPress={() => void onRegister()} />
              </View>

              <View style={styles.loginBlock}>
                <Text style={styles.loginText}>Já possui conta?</Text>
                <Pressable onPress={() => router.push("/login")} accessibilityRole="link">
                  <Text style={styles.loginLink}>Entrar</Text>
                </Pressable>
              </View>
            </LinearGradient>

            <View style={styles.securityBox}>
              <Ionicons name="shield-checkmark" size={24} color="#c4cedd" />
              <Text style={styles.securityText}>Ambiente preparado para segurança, LGPD, multiempresa e publicação assistida.</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

function RegisterHero({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.hero, compact ? styles.heroCompact : null]}>
      <View style={styles.heroTop}>
        <View style={styles.logoRow}>
          <BrandLogo size="medium" showText={false} />
          <Text style={styles.logoText}>Casa Mineira <Text style={styles.logoAccent}>SaaS</Text></Text>
        </View>
        <View style={styles.webBadge}>
          <Ionicons name="sparkles" size={15} color="#37f5a5" />
          <Text style={styles.webBadgeText}>Premium SaaS</Text>
        </View>
      </View>

      <View style={styles.heroCopy}>
        <View style={styles.kicker}>
          <Ionicons name="flash" size={13} color="#9b7cff" />
          <Text style={styles.kickerText}>FÁBRICA DE EMPRESAS DIGITAIS</Text>
        </View>
        <Text style={[styles.heroTitle, compact ? styles.heroTitleCompact : null]}>
          Crie sua conta e comece sua empresa digital.
        </Text>
        <Text style={styles.heroBody}>
          Uma experiência web-first para transformar modelos inteligentes em apps, sites, sistemas, marketplaces e operações digitais completas.
        </Text>
        <View style={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <Benefit key={benefit} label={benefit} />
          ))}
        </View>
      </View>

      <AiArtwork compact={compact} />
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  secureTextEntry = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#7c8798"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

function PremiumButton({
  label,
  icon,
  loading,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={(state) => [
        styles.primaryButton,
        Boolean((state as any).hovered) ? styles.primaryButtonHover : null,
        state.pressed ? styles.primaryButtonPressed : null,
        loading ? styles.disabled : null,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <>
          <Text style={styles.primaryButtonText}>{label}</Text>
          <Ionicons name={icon} size={18} color="#ffffff" />
        </>
      )}
    </Pressable>
  );
}

function Benefit({ label }: { label: string }) {
  return (
    <View style={styles.benefitRow}>
      <Ionicons name="checkmark-circle" size={18} color="#7f63ff" />
      <Text style={styles.benefitText}>{label}</Text>
    </View>
  );
}

function AiArtwork({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.artWrap, compact ? styles.artWrapCompact : null]}>
      <View style={styles.orbitLine} />
      <View style={[styles.floatingCard, styles.floatingCardLeft]}>
        <Ionicons name="business-outline" size={28} color="#5fb4ff" />
      </View>
      <View style={[styles.floatingCard, styles.floatingCardRight]}>
        <Ionicons name="code-slash-outline" size={26} color="#6d7cff" />
      </View>
      <View style={[styles.floatingCard, styles.floatingCardSmall]}>
        <Ionicons name="rocket-outline" size={22} color="#38d6ff" />
      </View>
      <LinearGradient colors={["rgba(55, 214, 255, 0.22)", "rgba(124, 92, 255, 0.08)"]} style={styles.platformBase}>
        <View style={styles.platformLayer} />
        <LinearGradient colors={["#8b6cff", "#37d6ff"]} style={styles.aiChipGlow}>
          <View style={styles.aiChip}>
            <Text style={styles.aiText}>AI</Text>
          </View>
        </LinearGradient>
      </LinearGradient>
    </View>
  );
}

const webMotion = {
  transitionProperty: "transform, box-shadow, background-color, border-color, opacity",
  transitionDuration: "180ms",
  transitionTimingFunction: "ease",
} as any;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#020611" },
  pageContent: { minHeight: "100%", padding: 18 },
  pageContentMobile: { padding: 10 },
  shell: { width: "100%", maxWidth: 1440, alignSelf: "center", borderRadius: 16, borderWidth: 1, borderColor: "rgba(128, 151, 190, 0.22)", overflow: "hidden", shadowColor: "#1c2d66", shadowOpacity: 0.26, shadowRadius: 38, shadowOffset: { width: 0, height: 18 } },
  mainPanel: { minHeight: 900, flexDirection: "row" },
  mainPanelMobile: { minHeight: 0, flexDirection: "column" },
  hero: { flex: 1.08, padding: 48, justifyContent: "space-between", gap: 24 },
  heroCompact: { padding: 30 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoText: { color: "#ffffff", fontSize: 25, fontWeight: "900" },
  logoAccent: { color: "#765cff" },
  webBadge: { flexDirection: "row", alignItems: "center", gap: 8 },
  webBadgeText: { color: "#37f5a5", fontSize: 13, fontWeight: "800" },
  heroCopy: { gap: 18, maxWidth: 650 },
  kicker: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, backgroundColor: "rgba(108, 78, 255, 0.22)", paddingHorizontal: 14, paddingVertical: 8 },
  kickerText: { color: "#a88cff", fontSize: 12, fontWeight: "900" },
  heroTitle: { color: "#ffffff", fontSize: 54, lineHeight: 61, fontWeight: "900" },
  heroTitleCompact: { fontSize: 38, lineHeight: 45 },
  heroBody: { color: "#d7dce8", fontSize: 17, lineHeight: 27, maxWidth: 600 },
  benefits: { gap: 10 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  artWrap: { height: 300, alignItems: "center", justifyContent: "center" },
  artWrapCompact: { height: 240 },
  orbitLine: { position: "absolute", width: 390, maxWidth: "88%", height: 190, borderRadius: 36, borderWidth: 1, borderColor: "rgba(67, 103, 255, 0.26)", transform: [{ rotate: "-18deg" }] },
  platformBase: { width: 260, height: 150, borderRadius: 34, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(72, 203, 255, 0.5)", shadowColor: "#37d6ff", shadowOpacity: 0.42, shadowRadius: 30, shadowOffset: { width: 0, height: 18 } },
  platformLayer: { position: "absolute", width: 210, height: 96, borderRadius: 28, borderWidth: 2, borderColor: "rgba(68, 218, 255, 0.68)", transform: [{ rotate: "-28deg" }] },
  aiChipGlow: { width: 116, height: 116, borderRadius: 20, padding: 2, shadowColor: "#7a65ff", shadowOpacity: 0.6, shadowRadius: 32, shadowOffset: { width: 0, height: 16 } },
  aiChip: { flex: 1, borderRadius: 18, backgroundColor: "rgba(31, 36, 88, 0.96)", alignItems: "center", justifyContent: "center" },
  aiText: { color: "#ffffff", fontSize: 52, fontWeight: "900" },
  floatingCard: { position: "absolute", width: 72, height: 86, borderRadius: 12, borderWidth: 1, borderColor: "rgba(73, 111, 255, 0.5)", backgroundColor: "rgba(12, 24, 58, 0.58)", alignItems: "center", justifyContent: "center" },
  floatingCardLeft: { left: 26, bottom: 36, transform: [{ rotate: "14deg" }] },
  floatingCardRight: { right: 36, top: 26, transform: [{ rotate: "14deg" }] },
  floatingCardSmall: { width: 48, height: 48, right: 160, top: 68 },
  registerColumn: { width: 600, alignItems: "center", justifyContent: "center", gap: 24, padding: 42, backgroundColor: "rgba(8, 13, 24, 0.58)", borderLeftWidth: 1, borderLeftColor: "rgba(128, 151, 190, 0.14)" },
  registerColumnCompact: { width: 500, padding: 24 },
  registerColumnMobile: { width: "100%", minHeight: "100%", padding: 14, borderLeftWidth: 0, backgroundColor: "transparent" },
  mobileBrand: { width: "100%", flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 4 },
  mobileLogoText: { color: "#ffffff", fontSize: 14, fontWeight: "900" },
  registerCard: { width: "100%", maxWidth: 520, borderRadius: 16, borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.23)", padding: 34, gap: 20 },
  registerCardMobile: { maxWidth: "100%", borderRadius: 12, padding: 22 },
  cardHeader: { gap: 8, alignItems: "center" },
  cardTitle: { color: "#ffffff", fontSize: 31, lineHeight: 38, fontWeight: "900", textAlign: "center" },
  cardTitleMobile: { fontSize: 23, lineHeight: 30 },
  cardSubtitle: { color: "#d4d9e5", fontSize: 15, lineHeight: 22, textAlign: "center" },
  form: { gap: 12 },
  field: { gap: 7 },
  fieldLabel: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  input: { minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: "rgba(134, 151, 180, 0.34)", backgroundColor: "rgba(3, 8, 18, 0.62)", color: "#ffffff", paddingHorizontal: 15, ...webMotion },
  termsRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 4 },
  termsText: { color: "#c9d0de", fontSize: 13, fontWeight: "800" },
  primaryButton: { minHeight: 56, borderRadius: 8, backgroundColor: "#7b55ff", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, marginTop: 8, shadowColor: "#7b55ff", shadowOpacity: 0.38, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, ...webMotion },
  primaryButtonHover: { transform: [{ translateY: -2 }, { scale: 1.01 }], shadowOpacity: 0.52, backgroundColor: "#8767ff" },
  primaryButtonPressed: { transform: [{ translateY: 0 }, { scale: 0.99 }] },
  primaryButtonText: { color: "#ffffff", fontWeight: "900", fontSize: 16 },
  loginBlock: { borderTopWidth: 1, borderTopColor: "rgba(148, 163, 184, 0.16)", paddingTop: 24, alignItems: "center", gap: 8 },
  loginText: { color: "#cbd5e1", fontSize: 14 },
  loginLink: { color: "#8c72ff", fontSize: 15, fontWeight: "900" },
  securityBox: { width: "100%", maxWidth: 390, minHeight: 62, borderRadius: 10, borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.18)", backgroundColor: "rgba(22, 32, 49, 0.82)", flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 18, paddingVertical: 12 },
  securityText: { flex: 1, color: "#cbd5e1", fontSize: 12, lineHeight: 17, textAlign: "center" },
  disabled: { opacity: 0.65 },
});
