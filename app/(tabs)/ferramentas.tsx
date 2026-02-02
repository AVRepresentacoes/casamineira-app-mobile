import {
    Feather,
    Ionicons,
    MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Ferramentas() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Ferramentas</Text>
      <Text style={styles.subtitle}>
        Tudo para gerenciar seu trabalho profissional
      </Text>

      <View style={styles.grid}>
        {/* SERVIÇOS */}
        <Card
          icon={<MaterialCommunityIcons name="briefcase" size={28} color="#facc15" />}
          title="Meus Serviços"
          desc="Criar, editar e precificar"
          onPress={() => router.push("/servicos")}
        />

        {/* PORTFÓLIO */}
        <Card
          icon={<Ionicons name="images-outline" size={26} color="#facc15" />}
          title="Portfólio"
          desc="Fotos dos seus trabalhos"
          onPress={() => router.push("/portfolio")}
        />

        {/* CONTRATOS */}
        <Card
          icon={<MaterialCommunityIcons name="file-document-outline" size={26} color="#facc15" />}
          title="Contratos"
          desc="Acordos e termos"
          onPress={() => router.push("/contratos")}
        />

        {/* AGENDA */}
        <Card
          icon={<Feather name="calendar" size={26} color="#facc15" />}
          title="Agenda"
          desc="Atendimentos e horários"
          onPress={() => router.push("/agenda")}
        />

        {/* FINANCEIRO */}
        <Card
          icon={<MaterialCommunityIcons name="wallet-outline" size={28} color="#facc15" />}
          title="Financeiro"
          desc="Saldo, ganhos e saques"
          onPress={() => router.push("/carteira")}
        />

        {/* AVALIAÇÕES */}
        <Card
          icon={<Ionicons name="star-outline" size={26} color="#facc15" />}
          title="Avaliações"
          desc="Feedback dos clientes"
          onPress={() => router.push("/avaliacoes")}
        />
      </View>
    </ScrollView>
  );
}

/* ========================= */
/* CARD COMPONENT            */
/* ========================= */
function Card({ icon, title, desc, onPress }: any) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconBox}>{icon}</View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{desc}</Text>
    </TouchableOpacity>
  );
}

/* ========================= */
/* STYLES                    */
/* ========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040a",
    padding: 20,
  },
  title: {
    color: "#facc15",
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: "#9ca3af",
    marginTop: 4,
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#0b1220",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#111827",
  },
  iconBox: {
    marginBottom: 12,
  },
  cardTitle: {
    color: "#e5e7eb",
    fontWeight: "900",
    fontSize: 15,
  },
  cardDesc: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },
});
