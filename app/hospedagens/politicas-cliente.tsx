import { CAMINHOS_REGRAS_NEGOCIO } from "@/lib/caminhosHospedagens";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PoliticasClienteHospedagensScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#12372A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Para clientes</Text>
          <Text style={styles.title}>Políticas da reserva</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Ionicons name="shield-checkmark-outline" size={34} color="#F7D58B" />
        <Text style={styles.heroTitle}>Clareza antes, tranquilidade durante a jornada.</Text>
        <Text style={styles.heroText}>
          O Hospedagens Caminhos da Fé organiza sua reserva com valores, datas, contato da pousada e regras visíveis antes da confirmação.
        </Text>
      </View>

      <PolicyCard icon="card-outline" title="Como funciona o pagamento">
        <PolicyItem text={`Para confirmar a hospedagem, o cliente paga um sinal de ${Math.round(CAMINHOS_REGRAS_NEGOCIO.sinalPercentual * 100)}% pelo app.`} />
        <PolicyItem text="O restante da diária fica combinado para pagamento diretamente na chegada à pousada, conforme o resumo da reserva." />
        <PolicyItem text="O comprovante da reserva fica disponível no histórico de hospedagens do cliente." />
      </PolicyCard>

      <PolicyCard icon="calendar-outline" title="Desistência do cliente">
        <PolicyItem text="Cancelamento com 72 horas ou mais de antecedência: reembolso de 80% do sinal pago." />
        <PolicyItem text="Cancelamento entre 72 horas e 24 horas antes do check-in: reembolso de 50% do sinal pago." />
        <PolicyItem text="Cancelamento com menos de 24 horas ou não comparecimento: o sinal não é reembolsado." />
      </PolicyCard>

      <PolicyCard icon="home-outline" title="Quando a pousada não puder atender">
        <PolicyItem text="Se a pousada cancelar ou não conseguir cumprir a reserva confirmada, o cliente recebe 100% do sinal de volta." />
        <PolicyItem text="A equipe poderá orientar o cliente na busca por outra hospedagem disponível na região." />
        <PolicyItem text="A pousada fica sujeita às regras operacionais do parceiro para preservar a confiança da plataforma." />
      </PolicyCard>

      <PolicyCard icon="chatbubbles-outline" title="Suporte e informações">
        <PolicyItem text="Mantenha telefone, WhatsApp, data de chegada e número de hóspedes sempre atualizados." />
        <PolicyItem text="Guarde os comprovantes e confira endereço, horários e observações antes de iniciar a etapa." />
        <PolicyItem text="Em caso de dúvida, fale com a pousada pelo contato da reserva e registre qualquer ocorrência no app." />
      </PolicyCard>
    </ScrollView>
  );
}

function PolicyCard({ icon, title, children }: { icon: keyof typeof Ionicons.glyphMap; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={20} color="#12372A" />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.items}>{children}</View>
    </View>
  );
}

function PolicyItem({ text }: { text: string }) {
  return (
    <View style={styles.item}>
      <View style={styles.dot} />
      <Text style={styles.itemText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  content: { padding: 16, gap: 16, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  eyebrow: { color: "#4E7C59", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#12372A", fontSize: 25, fontWeight: "900" },
  hero: { backgroundColor: "#12372A", borderRadius: 8, padding: 18, gap: 9 },
  heroTitle: { color: "#FFF9EA", fontSize: 22, lineHeight: 28, fontWeight: "900" },
  heroText: { color: "#F7D58B", lineHeight: 21 },
  card: { backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 14, gap: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: { width: 38, height: 38, borderRadius: 8, backgroundColor: "#F7D58B", alignItems: "center", justifyContent: "center" },
  cardTitle: { color: "#12372A", fontSize: 18, fontWeight: "900", flex: 1 },
  items: { gap: 10 },
  item: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4E7C59", marginTop: 7 },
  itemText: { color: "#4B5563", lineHeight: 21, flex: 1 },
});
