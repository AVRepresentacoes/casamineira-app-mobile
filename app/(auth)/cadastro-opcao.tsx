import { Redirect, useRouter } from "expo-router";
import { useBranding } from "@/hooks/useBranding";
import { AuthMarketingShell } from "@/components/shared/AuthMarketingShell";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CadastroOpcao() {
  const router = useRouter();
  const { branding } = useBranding();
  const logoSource = branding.logoUrl ? { uri: branding.logoUrl } : require("../../assets/images/icons/icon.png");

  if (Platform.OS !== "web") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <AuthMarketingShell
      logoSource={logoSource}
      eyebrow="Entrada de cadastro"
      title="Escolha o fluxo certo para entrar no ecossistema do produto."
      description="Cliente, profissional, fornecedor e empresa entram por contextos diferentes. Aqui você escolhe o caminho correto sem misturar operação e comercial."
      highlights={[
        "Cadastros separados por perfil e responsabilidade no sistema",
        "Entrada comercial da empresa em fluxo próprio de onboarding",
        "Experiência mais clara para não confundir produto, site e painéis",
      ]}
      footerActionLabel="Voltar ao site"
      onFooterAction={() => router.push("/landing")}
    >
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.optionCard, { borderColor: branding.primaryColor }]} onPress={() => router.push("/(auth)/cadastro-cliente")}>
          <Text style={styles.optionTitle}>Cadastro de cliente</Text>
          <Text style={styles.optionBody}>Para quem solicita serviços, acompanha pedidos e usa a camada operacional do app.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.optionCard, { borderColor: branding.primaryColor }]} onPress={() => router.push("/(auth)/cadastro-profissional")}>
          <Text style={styles.optionTitle}>Cadastro de profissional</Text>
          <Text style={styles.optionBody}>Para quem recebe pedidos, envia propostas e opera a carteira profissional no sistema.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.optionCard, { borderColor: branding.primaryColor }]} onPress={() => router.push("/(auth)/cadastro-fornecedor")}>
          <Text style={styles.optionTitle}>Cadastro de fornecedor</Text>
          <Text style={styles.optionBody}>Para empresas fornecedoras com operação própria e acesso ao portal web dedicado.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.companyCard} onPress={() => router.push("/(auth)/onboarding-empresa")}>
          <Text style={styles.companyEyebrow}>Fluxo comercial</Text>
          <Text style={styles.companyTitle}>Criar empresa SaaS</Text>
          <Text style={styles.companyBody}>Cadastre a empresa, escolha o plano inicial e ative o período de teste no onboarding comercial.</Text>
        </TouchableOpacity>
      </View>
    </AuthMarketingShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },
  optionCard: {
    minWidth: 260,
    flex: 1,
    borderRadius: 28,
    borderWidth: 1.5,
    backgroundColor: "rgba(9, 15, 31, 0.82)",
    padding: 22,
    gap: 12,
  },
  optionTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  optionBody: {
    color: "#96aac7",
    lineHeight: 24,
  },
  companyCard: {
    minWidth: 260,
    flex: 1,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(250, 204, 21, 0.26)",
    backgroundColor: "rgba(250, 204, 21, 0.10)",
    padding: 22,
    gap: 12,
  },
  companyEyebrow: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  companyTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
  },
  companyBody: {
    color: "#e2e8f0",
    lineHeight: 24,
  },
});
