import {
  CAMINHOS_CIDADES_INICIAIS,
  CAMINHOS_ASSETS,
  HOSPEDAGENS_DEMO,
  formatMoney,
  type CaminhoHospedagem,
} from "@/lib/caminhosHospedagens";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FILTERS = ["Todas", "MG", "SP", "Bike", "Jantar", "Lavanderia"];

function matchFilter(item: CaminhoHospedagem, filter: string) {
  if (filter === "Todas") return true;
  if (filter === "MG" || filter === "SP") return item.uf === filter;
  if (filter === "Bike") return item.amenidades.includes("bike");
  if (filter === "Jantar") return item.amenidades.includes("jantar");
  if (filter === "Lavanderia") return item.amenidades.includes("lavanderia");
  return true;
}

export default function HospedagensHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todas");

  const hospedagens = useMemo(() => {
    const q = search
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    return HOSPEDAGENS_DEMO.filter((item) => {
      const text = `${item.nome} ${item.cidade} ${item.ramal}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

      return (!q || text.includes(q)) && matchFilter(item, filter);
    });
  }, [filter, search]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}>
      <View style={styles.hero}>
        <ImageBackground source={CAMINHOS_ASSETS.splash} style={styles.heroImage} imageStyle={styles.heroImageStyle}>
          <View style={styles.heroShade}>
            <Text style={styles.eyebrow}>Caminho da Fé</Text>
            <Text style={styles.title}>Hospedagens para cada etapa da sua peregrinação.</Text>
            <Text style={styles.subtitle}>Reserve pousadas, quartos e pontos de apoio com sinal seguro de 50%.</Text>
            <View style={styles.heroStats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{CAMINHOS_CIDADES_INICIAIS.length}</Text>
                <Text style={styles.statLabel}>cidades mapeadas</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>24h</Text>
                <Text style={styles.statLabel}>reserva assistida</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>50%</Text>
                <Text style={styles.statLabel}>sinal da reserva</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
        <Pressable
          style={styles.profileButton}
          onPress={() => router.push("/hospedagens/perfil")}
          hitSlop={12}
        >
          <Ionicons name="person-outline" size={18} color="#12372A" />
          <Text style={styles.profileButtonText}>Minha conta</Text>
        </Pressable>
      </View>

      <View style={styles.quickActions}>
        <QuickAction icon="person-outline" label="Perfil" onPress={() => router.push("/hospedagens/perfil")} />
        <QuickAction icon="calendar-outline" label="Minhas hospedagens" onPress={() => router.push("/hospedagens/minhas")} />
        <QuickAction icon="cash-outline" label="Gastos" onPress={() => router.push("/hospedagens/gastos")} />
        <QuickAction icon="footsteps-outline" label="Km percorridos" onPress={() => router.push("/hospedagens/km")} />
        <QuickAction icon="help-buoy-outline" label="Suporte" onPress={() => router.push("/hospedagens/suporte")} />
        <QuickAction icon="map-outline" label="Minha rota" onPress={() => router.push("/hospedagens/rota")} />
        <QuickAction icon="notifications-outline" label="Avisos" onPress={() => router.push("/hospedagens/notificacoes")} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar cidade, ramal ou pousada"
          placeholderTextColor="#6B7280"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((item) => (
          <Pressable key={item} style={[styles.filterChip, filter === item && styles.filterChipActive]} onPress={() => setFilter(item)}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.scrollHint}>
        <Text style={styles.scrollHintText}>Deslize para ver mais filtros</Text>
        <Ionicons name="chevron-forward" size={15} color="#4E7C59" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pousadas em destaque</Text>
        <Text style={styles.sectionMeta}>{hospedagens.length} opções iniciais</Text>
      </View>

      <View style={styles.cards}>
        {hospedagens.map((item) => (
          <Pressable key={item.id} style={styles.card} onPress={() => router.push(`/hospedagens/${item.id}`)}>
            <ImageBackground source={item.fotos[0]} style={styles.cardImage} imageStyle={styles.cardImageStyle}>
              <View style={styles.rating}>
                <Ionicons name="star" size={13} color="#FACC15" />
                <Text style={styles.ratingText}>{item.avaliacao.toFixed(1)}</Text>
              </View>
            </ImageBackground>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.nome}</Text>
              <Text style={styles.cardMeta}>{item.cidade} - {item.uf} • {item.ramal}</Text>
              <Text style={styles.cardDescription}>{item.descricao}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.price}>desde {formatMoney(item.diariaBase)}</Text>
                <Text style={styles.distance}>{item.distanciaTrilhaKm.toFixed(1)} km da trilha</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.policyBox}>
        <Text style={styles.policyTitle}>Reserva Segura</Text>
        <Text style={styles.policyText}>Reserve com mais confiança: sua hospedagem fica organizada em um só lugar, com sinal confirmado, dados da pousada visíveis e acompanhamento da sua jornada antes, durante e depois da etapa.</Text>
        <Pressable style={styles.policyButton} onPress={() => router.push("/hospedagens/politicas-cliente")}>
          <Text style={styles.policyButtonText}>Ver políticas do cliente</Text>
          <Ionicons name="chevron-forward" size={17} color="#12372A" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <Ionicons name={icon} size={21} color="#12372A" />
      <Text style={styles.quickActionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  content: { padding: 16, gap: 18, paddingBottom: 36 },
  hero: { minHeight: 360, borderRadius: 8, overflow: "hidden", backgroundColor: "#12372A", position: "relative" },
  heroImage: { minHeight: 360 },
  heroImageStyle: { opacity: 0.72 },
  heroShade: { flex: 1, justifyContent: "flex-end", padding: 22, backgroundColor: "rgba(18, 55, 42, 0.54)" },
  profileButton: { position: "absolute", top: 14, right: 14, zIndex: 20, elevation: 8, minHeight: 42, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#F7D58B", borderRadius: 8, paddingHorizontal: 12 },
  profileButtonText: { color: "#12372A", fontWeight: "900", fontSize: 13 },
  eyebrow: { color: "#F7D58B", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#FFF9EA", fontSize: 34, lineHeight: 39, fontWeight: "900", marginTop: 10 },
  subtitle: { color: "#F7F0DF", fontSize: 16, lineHeight: 23, marginTop: 10 },
  heroStats: { flexDirection: "row", gap: 10, marginTop: 18 },
  stat: { flex: 1, borderWidth: 1, borderColor: "rgba(247,240,223,0.28)", padding: 10, borderRadius: 8, backgroundColor: "rgba(18,55,42,0.58)" },
  statValue: { color: "#F7D58B", fontSize: 22, fontWeight: "900" },
  statLabel: { color: "#FFF9EA", fontSize: 11, marginTop: 2 },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickAction: { width: "48.5%", minHeight: 78, alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "#FFF9EA", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", paddingHorizontal: 8 },
  quickActionText: { color: "#12372A", textAlign: "center", fontSize: 12, fontWeight: "900" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: "#E5D9BD" },
  searchInput: { flex: 1, minHeight: 48, color: "#12372A", fontSize: 15 },
  filters: { gap: 8, paddingRight: 16 },
  scrollHint: { marginTop: -12, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 3 },
  scrollHintText: { color: "#4E7C59", fontSize: 12, fontWeight: "800" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#E5D9BD" },
  filterChipActive: { backgroundColor: "#12372A", borderColor: "#12372A" },
  filterText: { color: "#315342", fontWeight: "800" },
  filterTextActive: { color: "#F7F0DF" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: "#12372A", fontSize: 20, fontWeight: "900" },
  sectionMeta: { color: "#6B7280", fontWeight: "700" },
  cards: { gap: 14 },
  card: { backgroundColor: "#FFFDF6", borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: "#E8DEC7" },
  cardImage: { height: 154 },
  cardImageStyle: { backgroundColor: "#12372A" },
  rating: { position: "absolute", right: 10, top: 10, flexDirection: "row", gap: 4, alignItems: "center", backgroundColor: "rgba(18,55,42,0.9)", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  ratingText: { color: "#FFF9EA", fontWeight: "900" },
  cardBody: { padding: 14, gap: 7 },
  cardTitle: { color: "#12372A", fontSize: 18, fontWeight: "900" },
  cardMeta: { color: "#6B7280", fontWeight: "700" },
  cardDescription: { color: "#4B5563", lineHeight: 20 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  price: { color: "#12372A", fontWeight: "900" },
  distance: { color: "#4E7C59", fontWeight: "800" },
  policyBox: { backgroundColor: "#12372A", borderRadius: 8, padding: 16, gap: 6 },
  policyTitle: { color: "#F7D58B", fontSize: 18, fontWeight: "900" },
  policyText: { color: "#FFF9EA", lineHeight: 21 },
  policyButton: { marginTop: 6, minHeight: 42, borderRadius: 8, backgroundColor: "#F7D58B", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 12 },
  policyButtonText: { color: "#12372A", fontWeight: "900" },
});
