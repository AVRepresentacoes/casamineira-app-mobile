import { CAMINHOS_REGRAS_NEGOCIO } from "@/lib/caminhosHospedagens";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PoliticasPousadaHospedagensScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sinal = Math.round(CAMINHOS_REGRAS_NEGOCIO.sinalPercentual * 100);
  const comissaoLancamento = Math.round(CAMINHOS_REGRAS_NEGOCIO.comissaoLancamentoPercentual * 100);
  const comissaoPadrao = Math.round(CAMINHOS_REGRAS_NEGOCIO.comissaoPadraoPercentual * 100);
  const multaPousada = Math.round(CAMINHOS_REGRAS_NEGOCIO.multaPousadaPercentual * 100);

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#12372A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Para hotéis e pousadas</Text>
          <Text style={styles.title}>Políticas do parceiro</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Ionicons name="business-outline" size={34} color="#F7D58B" />
        <Text style={styles.heroTitle}>Regras claras para proteger o hóspede, a pousada e a plataforma.</Text>
        <Text style={styles.heroText}>
          Estas condições orientam o cadastro, as reservas, os repasses, os cancelamentos e a operação comercial do parceiro.
        </Text>
      </View>

      <PolicyCard icon="cash-outline" title="Modelo comercial">
        <PolicyItem text={`Durante o lançamento, a comissão da plataforma é de ${comissaoLancamento}% sobre o valor total da reserva.`} />
        <PolicyItem text={`Após o período promocional, a comissão padrão passa a ser de ${comissaoPadrao}% sobre o valor total da reserva.`} />
        <PolicyItem text={`O cliente paga ${sinal}% de sinal no app para confirmar a reserva.`} />
      </PolicyCard>

      <PolicyCard icon="swap-horizontal-outline" title="Repasse e split payment">
        <PolicyItem text="O pagamento deve ficar preparado para split payment assim que as credenciais do provedor forem configuradas." />
        <PolicyItem text="A comissão da plataforma é calculada sobre o total da reserva e descontada do valor recebido no sinal." />
        <PolicyItem text="O restante da diária é pago pelo cliente diretamente na chegada, conforme o resumo da reserva." />
      </PolicyCard>

      <PolicyCard icon="alert-circle-outline" title="Cancelamento pela pousada">
        <PolicyItem text="Se a pousada cancelar ou descumprir uma reserva confirmada, o cliente recebe 100% do sinal de volta." />
        <PolicyItem text={`A pousada fica com saldo negativo equivalente a ${multaPousada}% do valor total da reserva como multa operacional.`} />
        <PolicyItem text="Esse saldo negativo será descontado automaticamente dos próximos repasses da pousada." />
      </PolicyCard>

      <PolicyCard icon="calendar-outline" title="Desistência do cliente">
        <PolicyItem text="Cancelamento com 72 horas ou mais de antecedência: cliente recebe 80% do sinal de volta." />
        <PolicyItem text="Cancelamento entre 72 horas e 24 horas antes do check-in: cliente recebe 50% do sinal de volta." />
        <PolicyItem text="Cancelamento com menos de 24 horas ou não comparecimento: sinal não reembolsado ao cliente." />
      </PolicyCard>

      <PolicyCard icon="checkmark-done-outline" title="Responsabilidades do parceiro">
        <PolicyItem text="Manter quartos, preços, disponibilidade, endereço, contatos e serviços sempre atualizados." />
        <PolicyItem text="Honrar check-in, condições anunciadas, café, jantar, garagem, lavanderia e demais itens informados no app." />
        <PolicyItem text="Responder o cliente com agilidade e registrar qualquer alteração relevante antes da chegada." />
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
