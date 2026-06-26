import { BrandLogo } from "@/components/brand/BrandLogo";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

const TRUSTED_BRANDS = ["ACME", "NEXUS", "INOVA", "VISION", "PRIME"] as const;

export function SaasLoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const layout = useMemo(() => {
    const mobile = width < 768;
    const tablet = width >= 768 && width < 1200;
    return {
      mobile,
      tablet,
      desktop: width >= 1200,
      compact: width < 1040,
    };
  }, [width]);

  useEffect(() => {
    let active = true;
    const fallback = setTimeout(() => {
      if (active) setChecking(false);
    }, 1800);

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;
        if (session?.user) {
          router.replace("/dashboard");
          return;
        }
        setChecking(false);
      } catch (error) {
        console.log("SAAS SESSION CHECK ERROR:", error);
        if (active) setChecking(false);
      }
    }

    void checkSession();
    return () => {
      active = false;
      clearTimeout(fallback);
    };
  }, [router]);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Atenção", "Informe email e senha para entrar na Casa Mineira SaaS.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        Alert.alert("Erro no login", error.message);
        return;
      }

      router.replace("/dashboard");
    } catch (error) {
      console.log("SAAS LOGIN ERROR:", error);
      Alert.alert("Erro", "Não foi possível entrar agora.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7c5cff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.pageContent, layout.mobile ? styles.pageContentMobile : null]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#08101f", "#050914", "#0b1221"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.shell}>
        <View style={[styles.mainPanel, layout.mobile ? styles.mainPanelMobile : null]}>
          {!layout.mobile ? <HeroPanel compact={layout.compact} /> : null}
          <LoginPanel
            compact={layout.compact}
            mobile={layout.mobile}
            email={email}
            password={password}
            showPassword={showPassword}
            remember={remember}
            loading={loading}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onTogglePassword={() => setShowPassword((value) => !value)}
            onToggleRemember={() => setRemember((value) => !value)}
            onLogin={() => void handleLogin()}
            onForgotPassword={() => router.push("/forgot-password")}
            onCreateAccount={() => router.push("/register")}
          />
        </View>

        {!layout.mobile ? <FeatureStrip compact={layout.tablet} /> : null}
      </LinearGradient>
    </ScrollView>
  );
}

function HeroPanel({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.hero, compact ? styles.heroCompact : null]}>
      <View style={styles.heroTop}>
        <View style={styles.logoRow}>
          <BrandLogo size="medium" showText={false} />
          <Text style={styles.logoText}>Casa Mineira <Text style={styles.logoAccent}>SaaS</Text></Text>
        </View>
        <View style={styles.webBadge}>
          <Ionicons name="globe-outline" size={15} color="#37f5a5" />
          <Text style={styles.webBadgeText}>Plataforma 100% Web</Text>
        </View>
      </View>

      <View style={styles.heroCopy}>
        <View style={styles.kicker}>
          <Ionicons name="sparkles" size={13} color="#9b7cff" />
          <Text style={styles.kickerText}>PLATAFORMA DE CRIAÇÃO DE APPS COM IA</Text>
        </View>
        <Text style={[styles.heroTitle, compact ? styles.heroTitleCompact : null]}>
          Crie aplicativos incríveis <Text style={styles.heroTitleAccent}>com IA</Text>
        </Text>
        <Text style={styles.heroBody}>
          A plataforma completa que usa Inteligência Artificial para transformar ideias em aplicativos reais de forma rápida, fácil e profissional.
        </Text>
        <View style={styles.benefits}>
          <Benefit label="Gere apps completos com IA" />
          <Benefit label="Templates profissionais" />
          <Benefit label="Publicação automática" />
          <Benefit label="White-label para sua marca" />
        </View>
      </View>

      <AiArtwork compact={compact} />

      <View style={styles.trustBlock}>
        <Text style={styles.trustText}>Confiado por empresas que inovam todos os dias</Text>
        <View style={styles.brandGrid}>
          {TRUSTED_BRANDS.map((brand) => (
            <View key={brand} style={styles.brandItem}>
              <Ionicons name="prism-outline" size={18} color="#7d879a" />
              <Text style={styles.brandName}>{brand}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function LoginPanel({
  compact,
  mobile,
  email,
  password,
  showPassword,
  remember,
  loading,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onToggleRemember,
  onLogin,
  onForgotPassword,
  onCreateAccount,
}: {
  compact: boolean;
  mobile: boolean;
  email: string;
  password: string;
  showPassword: boolean;
  remember: boolean;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onToggleRemember: () => void;
  onLogin: () => void;
  onForgotPassword: () => void;
  onCreateAccount: () => void;
}) {
  return (
    <View style={[styles.loginColumn, compact ? styles.loginColumnCompact : null, mobile ? styles.loginColumnMobile : null]}>
      {mobile ? (
        <View style={styles.mobileBrand}>
          <BrandLogo size="small" showText={false} />
          <Text style={styles.mobileLogoText}>Casa Mineira <Text style={styles.logoAccent}>SaaS</Text></Text>
        </View>
      ) : null}

      <LinearGradient colors={["rgba(26, 38, 58, 0.96)", "rgba(13, 20, 34, 0.98)"]} style={[styles.loginCard, mobile ? styles.loginCardMobile : null]}>
        <Text style={[styles.loginTitle, mobile ? styles.loginTitleMobile : null]}>Bem-vindo de volta!</Text>
        <Text style={styles.loginSubtitle}>Acesse sua conta para continuar</Text>

        <View style={styles.form}>
          <FieldLabel label="E-mail" />
          <TextInput
            placeholder="seu@email.com"
            placeholderTextColor="#7c8798"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={onEmailChange}
          />

          <FieldLabel label="Senha" />
          <View style={styles.passwordWrap}>
            <TextInput
              placeholder="Sua senha"
              placeholderTextColor="#7c8798"
              style={styles.passwordInput}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={onPasswordChange}
            />
            <Pressable style={styles.eyeButton} onPress={onTogglePassword} accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#b9c2d4" />
            </Pressable>
          </View>

          <View style={styles.optionsRow}>
            <Pressable style={styles.rememberRow} onPress={onToggleRemember}>
              <Ionicons name={remember ? "checkbox" : "square-outline"} size={18} color="#8b6cff" />
              <Text style={styles.optionText}>Lembrar de mim</Text>
            </Pressable>
            <Pressable onPress={onForgotPassword} accessibilityRole="link">
              <Text style={styles.linkText}>Esqueci minha senha</Text>
            </Pressable>
          </View>

          <Pressable style={[styles.primaryButton, loading ? styles.disabled : null]} onPress={onLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Entrar na plataforma</Text>}
          </Pressable>
        </View>

        <Divider label="ou continue com" />

        <View style={styles.socialRow}>
          <SocialButton provider="Google" />
          <SocialButton provider="Microsoft" />
        </View>

        <View style={styles.signupBlock}>
          <Text style={styles.signupText}>Ainda não tem uma conta?</Text>
          <Pressable onPress={onCreateAccount} accessibilityRole="link">
            <Text style={styles.signupLink}>Criar minha conta</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.securityBox}>
        <Ionicons name="lock-closed" size={24} color="#c4cedd" />
        <Text style={styles.securityText}>Seus dados estão protegidos com criptografia de nível empresarial e total conformidade com LGPD.</Text>
      </View>
    </View>
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

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function Divider({ label }: { label: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

function SocialButton({ provider }: { provider: "Google" | "Microsoft" }) {
  return (
    <Pressable style={styles.socialButton} onPress={() => Alert.alert(provider, `Login com ${provider} ainda não foi ativado para esta plataforma.`)}>
      {provider === "Google" ? (
        <Text style={styles.googleMark}>G</Text>
      ) : (
        <View style={styles.microsoftMark}>
          <View style={[styles.msSquare, styles.msRed]} />
          <View style={[styles.msSquare, styles.msGreen]} />
          <View style={[styles.msSquare, styles.msBlue]} />
          <View style={[styles.msSquare, styles.msYellow]} />
        </View>
      )}
      <Text style={styles.socialText}>{provider}</Text>
    </Pressable>
  );
}

function AiArtwork({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.artWrap, compact ? styles.artWrapCompact : null]}>
      <View style={styles.orbitLine} />
      <View style={[styles.floatingCard, styles.floatingCardLeft]}>
        <Ionicons name="bar-chart-outline" size={28} color="#5fb4ff" />
      </View>
      <View style={[styles.floatingCard, styles.floatingCardRight]}>
        <Ionicons name="code-slash-outline" size={26} color="#6d7cff" />
      </View>
      <View style={[styles.floatingCard, styles.floatingCardSmall]}>
        <Ionicons name="shield-checkmark-outline" size={22} color="#38d6ff" />
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

function FeatureStrip({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.featureStrip, compact ? styles.featureStripCompact : null]}>
      <Feature icon="hardware-chip-outline" title="IA Poderosa" body="Gere aplicativos completos utilizando inteligência artificial de última geração." />
      <Feature icon="git-network-outline" title="Sem Código" body="Crie apps profissionais sem precisar programar. Tudo visual e intuitivo." />
      <Feature icon="briefcase-outline" title="Publique Fácil" body="Publique seu app nas lojas com um clique e tenha seu app no ar." />
      <Feature icon="id-card-outline" title="White-label" body="Plataforma 100% personalizável com sua identidade visual e domínio próprio." />
    </View>
  );
}

function Feature({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon} size={36} color="#845fff" />
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#020611" },
  pageContent: { minHeight: "100%", padding: 18 },
  pageContentMobile: { padding: 10 },
  loading: { flex: 1, backgroundColor: "#020611", alignItems: "center", justifyContent: "center" },
  shell: { width: "100%", maxWidth: 1440, alignSelf: "center", borderRadius: 16, borderWidth: 1, borderColor: "rgba(128, 151, 190, 0.22)", overflow: "hidden", shadowColor: "#1c2d66", shadowOpacity: 0.26, shadowRadius: 38, shadowOffset: { width: 0, height: 18 } },
  mainPanel: { minHeight: 860, flexDirection: "row" },
  mainPanelMobile: { minHeight: 0, flexDirection: "column" },
  hero: { flex: 1.15, padding: 48, justifyContent: "space-between", gap: 24 },
  heroCompact: { padding: 30 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoText: { color: "#ffffff", fontSize: 25, fontWeight: "900" },
  logoAccent: { color: "#765cff" },
  webBadge: { flexDirection: "row", alignItems: "center", gap: 8 },
  webBadgeText: { color: "#37f5a5", fontSize: 13, fontWeight: "800" },
  heroCopy: { gap: 18, maxWidth: 620 },
  kicker: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, backgroundColor: "rgba(108, 78, 255, 0.22)", paddingHorizontal: 14, paddingVertical: 8 },
  kickerText: { color: "#a88cff", fontSize: 12, fontWeight: "900" },
  heroTitle: { color: "#ffffff", fontSize: 56, lineHeight: 62, fontWeight: "900" },
  heroTitleCompact: { fontSize: 40, lineHeight: 46 },
  heroTitleAccent: { color: "#6f88ff" },
  heroBody: { color: "#d7dce8", fontSize: 17, lineHeight: 27, maxWidth: 560 },
  benefits: { gap: 10 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  artWrap: { height: 310, alignItems: "center", justifyContent: "center" },
  artWrapCompact: { height: 250 },
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
  trustBlock: { gap: 20 },
  trustText: { color: "#ffffff", fontSize: 14 },
  brandGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 16 },
  brandItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandName: { color: "#7d879a", fontSize: 15, fontWeight: "900" },
  loginColumn: { width: 560, alignItems: "center", justifyContent: "center", gap: 24, padding: 42, backgroundColor: "rgba(8, 13, 24, 0.58)", borderLeftWidth: 1, borderLeftColor: "rgba(128, 151, 190, 0.14)" },
  loginColumnCompact: { width: 420, padding: 24 },
  loginColumnMobile: { width: "100%", minHeight: "100%", padding: 14, borderLeftWidth: 0, backgroundColor: "transparent" },
  mobileBrand: { width: "100%", flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 4 },
  mobileLogoText: { color: "#ffffff", fontSize: 14, fontWeight: "900" },
  loginCard: { width: "100%", maxWidth: 470, borderRadius: 16, borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.23)", padding: 38, gap: 20 },
  loginCardMobile: { maxWidth: "100%", borderRadius: 12, padding: 22 },
  loginTitle: { color: "#ffffff", fontSize: 31, lineHeight: 38, fontWeight: "900", textAlign: "center" },
  loginTitleMobile: { fontSize: 23, lineHeight: 30 },
  loginSubtitle: { color: "#d4d9e5", fontSize: 16, textAlign: "center", marginTop: -12 },
  form: { gap: 12 },
  fieldLabel: { color: "#ffffff", fontSize: 14, fontWeight: "800", marginTop: 2 },
  input: { minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: "rgba(134, 151, 180, 0.34)", backgroundColor: "rgba(3, 8, 18, 0.62)", color: "#ffffff", paddingHorizontal: 15 },
  passwordWrap: { minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: "rgba(134, 151, 180, 0.34)", backgroundColor: "rgba(3, 8, 18, 0.62)", flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1, color: "#ffffff", paddingHorizontal: 15, minHeight: 46 },
  eyeButton: { width: 46, minHeight: 46, alignItems: "center", justifyContent: "center" },
  optionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 4 },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  optionText: { color: "#c9d0de", fontSize: 13, fontWeight: "700" },
  linkText: { color: "#8c72ff", fontSize: 13, fontWeight: "800" },
  primaryButton: { minHeight: 55, borderRadius: 8, backgroundColor: "#7b55ff", alignItems: "center", justifyContent: "center", marginTop: 18, shadowColor: "#7b55ff", shadowOpacity: 0.38, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  primaryButtonText: { color: "#ffffff", fontWeight: "900", fontSize: 16 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(148, 163, 184, 0.18)" },
  dividerText: { color: "#cbd5e1", fontSize: 13 },
  socialRow: { flexDirection: "row", gap: 16 },
  socialButton: { flex: 1, minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.28)", backgroundColor: "rgba(255, 255, 255, 0.025)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 },
  googleMark: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  microsoftMark: { width: 16, height: 16, flexDirection: "row", flexWrap: "wrap", gap: 2 },
  msSquare: { width: 7, height: 7 },
  msRed: { backgroundColor: "#f25022" },
  msGreen: { backgroundColor: "#7fba00" },
  msBlue: { backgroundColor: "#00a4ef" },
  msYellow: { backgroundColor: "#ffb900" },
  socialText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  signupBlock: { borderTopWidth: 1, borderTopColor: "rgba(148, 163, 184, 0.16)", paddingTop: 28, alignItems: "center", gap: 8 },
  signupText: { color: "#cbd5e1", fontSize: 14 },
  signupLink: { color: "#8c72ff", fontSize: 15, fontWeight: "900" },
  securityBox: { width: "100%", maxWidth: 370, minHeight: 62, borderRadius: 10, borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.18)", backgroundColor: "rgba(22, 32, 49, 0.82)", flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 18, paddingVertical: 12 },
  securityText: { flex: 1, color: "#cbd5e1", fontSize: 12, lineHeight: 17, textAlign: "center" },
  featureStrip: { borderTopWidth: 1, borderTopColor: "rgba(128, 151, 190, 0.18)", backgroundColor: "rgba(19, 30, 49, 0.7)", flexDirection: "row", paddingVertical: 34, paddingHorizontal: 44 },
  featureStripCompact: { paddingHorizontal: 22 },
  featureItem: { flex: 1, minHeight: 125, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, borderRightWidth: 1, borderRightColor: "rgba(148, 163, 184, 0.16)" },
  featureTitle: { color: "#ffffff", fontSize: 18, fontWeight: "900", marginTop: 12, textAlign: "center" },
  featureBody: { color: "#cbd5e1", fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 6, maxWidth: 230 },
  disabled: { opacity: 0.65 },
});
