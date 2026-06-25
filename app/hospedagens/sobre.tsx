import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const items = [
  ["Reserva segura", "Sinal de 50%, histórico no app e política clara para cliente e pousada."],
  ["Marketplace regional", "Foco nas cidades e etapas do Caminho da Fé, com curadoria de pousadas."],
  ["Painel profissional", "Pousadas gerenciam quartos, fotos, preços, reservas, suporte e repasses."],
  ["Operação escalável", "Admin acompanha GMV, comissão, suporte, avaliações e conciliação."],
];

export default function SobreHospedagensScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#12372A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Produto Casa Mineira Serviços</Text>
          <Text style={styles.title}>Hospedagens Caminhos da Fé</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Image source={require("../../assets/images/hospedagens-caminhos-da-fe/icon.png")} style={styles.logo} />
        <Text style={styles.heroTitle}>Um app dedicado a conectar peregrinos e pousadas com mais confiança.</Text>
        <Text style={styles.heroText}>Criado como vertical da Casa Mineira Serviços para organizar reservas, atendimento, pagamentos e operação regional do Caminho da Fé.</Text>
      </View>

      {items.map(([title, body]) => (
        <View key={title} style={styles.card}>
          <Ionicons name="checkmark-circle-outline" size={22} color="#0F6B4F" />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardText}>{body}</Text>
          </View>
        </View>
      ))}

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Operado por Casa Mineira Serviços</Text>
        <Text style={styles.noticeText}>Marca, domínio, políticas e aplicação Play Store podem ser próprios do produto, mantendo o mesmo CNPJ responsável pela operação.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  content: { padding: 16, gap: 16, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  eyebrow: { color: "#4E7C59", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#12372A", fontSize: 24, lineHeight: 30, fontWeight: "900" },
  hero: { backgroundColor: "#12372A", borderRadius: 8, padding: 18, gap: 10 },
  logo: { width: 86, height: 86, borderRadius: 8 },
  heroTitle: { color: "#FFF9EA", fontSize: 22, lineHeight: 28, fontWeight: "900" },
  heroText: { color: "#F7D58B", lineHeight: 21 },
  card: { flexDirection: "row", gap: 10, backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 14 },
  cardTitle: { color: "#12372A", fontSize: 16, fontWeight: "900" },
  cardText: { color: "#4B5563", lineHeight: 20, marginTop: 3 },
  notice: { backgroundColor: "#FFF9EA", borderRadius: 8, borderWidth: 1, borderColor: "#D8A84F", padding: 14, gap: 6 },
  noticeTitle: { color: "#12372A", fontSize: 17, fontWeight: "900" },
  noticeText: { color: "#4B5563", lineHeight: 20 },
});
