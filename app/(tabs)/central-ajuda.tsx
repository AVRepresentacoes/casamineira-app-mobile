import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const FAQ = [
  {
    title: "Como faço um pedido de produto?",
    body:
      "Acesse Marketplace, escolha a loja, adicione os itens ao carrinho e finalize no checkout. O pedido só segue para execução após confirmação do pagamento.",
  },
  {
    title: "Como acompanho meu pedido?",
    body:
      "Entre em Compras para ver status de pagamento e logística. Você também pode abrir os detalhes do pedido para acompanhar cada etapa.",
  },
  {
    title: "Meu pagamento não foi aprovado. E agora?",
    body:
      "Tente novamente com outro método de pagamento. Se o problema persistir, verifique limite/validação com o banco emissor e retorne ao app para nova tentativa.",
  },
  {
    title: "Como solicitar cancelamento?",
    body:
      "Abra o pedido em Compras e siga as opções disponíveis para o status atual. Em caso de dúvida, entre em contato pelo suporte oficial da plataforma.",
  },
  {
    title: "Como atualizo meus dados?",
    body:
      "No menu Perfil, acesse Meus dados para atualizar informações pessoais e preferências da sua conta.",
  },
];

export default function CentralAjudaScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/(tabs)/perfil")}>
          <Ionicons name="arrow-back" size={18} color="#facc15" />
        </TouchableOpacity>
        <Text style={styles.title}>Central de Ajuda</Text>
      </View>

      <Text style={styles.subtitle}>
        Encontre respostas rápidas para as dúvidas mais comuns sobre compras, pagamentos e conta.
      </Text>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Precisa de atendimento?</Text>
        <Text style={styles.contactText}>E-mail: suporte@casamineira.app</Text>
        <Text style={styles.contactText}>Horário: segunda a sexta, 8h às 18h</Text>
      </View>

      <Text style={styles.sectionTitle}>Perguntas frequentes</Text>

      {FAQ.map((item) => (
        <View key={item.title} style={styles.faqCard}>
          <Text style={styles.faqTitle}>{item.title}</Text>
          <Text style={styles.faqBody}>{item.body}</Text>
        </View>
      ))}
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
  subtitle: { color: "#9ca3af", marginTop: 10, lineHeight: 20 },
  contactCard: {
    marginTop: 16,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 14,
  },
  contactTitle: { color: "#f8fafc", fontWeight: "800", marginBottom: 8 },
  contactText: { color: "#cbd5e1", marginBottom: 4 },
  sectionTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "800", marginTop: 18, marginBottom: 8 },
  faqCard: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },
  faqTitle: { color: "#e2e8f0", fontWeight: "800", marginBottom: 6 },
  faqBody: { color: "#9ca3af", lineHeight: 20 },
});
