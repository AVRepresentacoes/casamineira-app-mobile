import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const sections = [
  {
    title: "1. Dados coletados",
    body:
      "Coletamos dados de cadastro, contato, navegação e transações para permitir funcionamento da plataforma, segurança e melhoria contínua dos serviços.",
  },
  {
    title: "2. Finalidade do uso",
    body:
      "Os dados são usados para autenticação, processamento de pedidos e pagamentos, comunicação com usuários, prevenção a fraudes e cumprimento de obrigações legais.",
  },
  {
    title: "3. Compartilhamento",
    body:
      "Podemos compartilhar dados estritamente necessários com provedores de pagamento, infraestrutura e parceiros operacionais, sempre sob medidas de segurança e confidencialidade.",
  },
  {
    title: "4. Armazenamento e segurança",
    body:
      "Adotamos controles técnicos e organizacionais para proteger informações contra acesso não autorizado, perda, alteração ou divulgação indevida.",
  },
  {
    title: "5. Direitos do titular",
    body:
      "Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade e eliminação de dados, conforme legislação aplicável.",
  },
  {
    title: "6. Retenção",
    body:
      "Os dados são mantidos pelo tempo necessário para cumprir finalidades contratuais e legais, incluindo exigências fiscais, regulatórias e de auditoria.",
  },
  {
    title: "7. Atualizações desta política",
    body:
      "Esta política pode ser atualizada periodicamente. Recomendamos consulta regular para acompanhar mudanças e melhorias de transparência.",
  },
];

export default function PoliticaPrivacidadeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/(tabs)/perfil")}>
          <Ionicons name="arrow-back" size={18} color="#facc15" />
        </TouchableOpacity>
        <Text style={styles.title}>Política de Privacidade</Text>
      </View>

      <Text style={styles.meta}>Última atualização: 11/03/2026</Text>
      <Text style={styles.intro}>
        Levamos sua privacidade a sério. Este resumo descreve como tratamos dados pessoais no uso da plataforma.
      </Text>

      {sections.map((section) => (
        <View key={section.title} style={styles.card}>
          <Text style={styles.cardTitle}>{section.title}</Text>
          <Text style={styles.cardBody}>{section.body}</Text>
        </View>
      ))}

      <View style={styles.footerCard}>
        <Text style={styles.footerTitle}>Contato do encarregado de dados</Text>
        <Text style={styles.footerText}>privacidade@casamineira.app</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a" },
  content: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  title: { color: "#facc15", fontSize: 24, fontWeight: "900" },
  meta: { color: "#94a3b8", marginTop: 10, fontSize: 12 },
  intro: { color: "#cbd5e1", marginTop: 8, lineHeight: 20 },
  card: {
    marginTop: 12,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 14,
  },
  cardTitle: { color: "#e2e8f0", fontWeight: "800", marginBottom: 6 },
  cardBody: { color: "#9ca3af", lineHeight: 20 },
  footerCard: {
    marginTop: 16,
    backgroundColor: "#101827",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 14,
  },
  footerTitle: { color: "#f8fafc", fontWeight: "800", marginBottom: 6 },
  footerText: { color: "#93c5fd" },
});
