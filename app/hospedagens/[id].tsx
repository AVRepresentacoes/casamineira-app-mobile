import {
  alternarFavoritoHospedagem,
  calcularReserva,
  formatMoney,
  listarAvaliacoesHospedagem,
  listarFavoritosHospedagens,
  obterHospedagemPublicaPorId,
  type CaminhoHospedagem,
  type CaminhoHospedagemAvaliacao,
  type CaminhoQuarto,
  type CaminhoServicoAdicional,
} from "@/lib/caminhosHospedagens";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function todayPlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function Amenity({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.amenity}>
      <Ionicons name={icon} size={17} color="#12372A" />
      <Text style={styles.amenityText}>{label}</Text>
    </View>
  );
}

function ExtraServiceCard({ service }: { service: CaminhoServicoAdicional }) {
  return (
    <View style={styles.extraCard}>
      <View style={styles.extraIcon}>
        <Ionicons name={service.icon} size={20} color="#12372A" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.extraTitle}>{service.nome}</Text>
        <Text style={styles.extraDescription}>{service.descricao}</Text>
        <Text style={styles.extraConfirm}>{service.confirmacao}</Text>
      </View>
      <View style={styles.extraPriceBox}>
        <Text style={styles.extraPrice}>{formatMoney(service.preco)}</Text>
        <Text style={styles.extraUnit}>{service.unidade}</Text>
      </View>
    </View>
  );
}

export default function HospedagemDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const [hospedagem, setHospedagem] = useState<CaminhoHospedagem | null>(null);
  const [selectedQuarto, setSelectedQuarto] = useState<CaminhoQuarto | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState<CaminhoHospedagemAvaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const checkin = todayPlus(7);
  const checkout = todayPlus(8);

  const resumo = useMemo(() => {
    if (!hospedagem || !selectedQuarto) return null;
    return calcularReserva({ hospedagem, quarto: selectedQuarto, checkin, checkout, hospedes: 1 });
  }, [checkin, checkout, hospedagem, selectedQuarto]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    obterHospedagemPublicaPorId(String(params.id || ""))
      .then((item) => {
        if (!mounted) return;
        setHospedagem(item);
        setSelectedQuarto(item?.quartos[0] || null);
        if (!item) return;
        listarFavoritosHospedagens()
          .then((favoritos) => {
            if (mounted) setFavorite(favoritos.some((favorito) => favorito.hospedagemSlug === item.id));
          })
          .catch(() => {
            if (mounted) setFavorite(false);
          });
        listarAvaliacoesHospedagem(item.id)
          .then((rows) => {
            if (mounted) setAvaliacoes(rows);
          })
          .catch(() => {
            if (mounted) setAvaliacoes([]);
          });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [params.id]);

  async function handleFavorite() {
    if (!hospedagem) return;
    try {
      const next = await alternarFavoritoHospedagem(hospedagem);
      setFavorite(next);
    } catch (error: any) {
      Alert.alert("Atenção", error?.message || "Não foi possível atualizar favoritos.");
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#12372A" />
      </View>
    );
  }

  if (!hospedagem) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Hospedagem não encontrada</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 34 }}>
      <ImageBackground source={hospedagem.fotos[0]} style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={styles.heroShade}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#12372A" />
          </Pressable>
          <Pressable style={styles.favoriteButton} onPress={handleFavorite}>
            <Ionicons name={favorite ? "heart" : "heart-outline"} size={22} color={favorite ? "#B91C1C" : "#12372A"} />
          </Pressable>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>{hospedagem.cidade} - {hospedagem.uf}</Text>
            <Text style={styles.title}>{hospedagem.nome}</Text>
            <Text style={styles.subtitle}>{hospedagem.ramal} • {hospedagem.quartos.length} quarto(s) disponível(is)</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.content}>
        <View style={styles.ratingRow}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={15} color="#FACC15" />
            <Text style={styles.ratingText}>{hospedagem.avaliacao ? hospedagem.avaliacao.toFixed(1) : "Novo"}</Text>
          </View>
          <Text style={styles.ratingMeta}>Dados publicados pela pousada e protegidos por RLS.</Text>
        </View>

        <Text style={styles.description}>{hospedagem.descricao}</Text>
        <View style={styles.reviewSummary}>
          <Ionicons name="star" size={17} color="#D8A84F" />
          <Text style={styles.reviewSummaryText}>
            {avaliacoes.length
              ? `${(avaliacoes.reduce((sum, item) => sum + item.notaGeral, 0) / avaliacoes.length).toFixed(1)} em ${avaliacoes.length} avaliação(ões)`
              : "Avaliações reais aparecerão aqui após as primeiras hospedagens."}
          </Text>
        </View>

        <View style={styles.amenities}>
          {hospedagem.amenidades.includes("cafe") ? <Amenity icon="cafe-outline" label="Café cedo" /> : null}
          {hospedagem.amenidades.includes("jantar") ? <Amenity icon="restaurant-outline" label="Jantar" /> : null}
          {hospedagem.amenidades.includes("lavanderia") ? <Amenity icon="shirt-outline" label="Lavanderia" /> : null}
          {hospedagem.amenidades.includes("bike") ? <Amenity icon="bicycle-outline" label="Aceita bike" /> : null}
          {hospedagem.amenidades.includes("mochila") ? <Amenity icon="bag-handle-outline" label="Mochila" /> : null}
          {hospedagem.amenidades.includes("carimbo") ? <Amenity icon="ribbon-outline" label="Carimbo" /> : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Serviços adicionais</Text>
            <Text style={styles.sectionMeta}>opcionais</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Adicione comodidades úteis para sua etapa e confirme os detalhes com a pousada antes da chegada.
          </Text>
          <View style={styles.extraList}>
            {hospedagem.servicosAdicionais.length ? hospedagem.servicosAdicionais.map((service) => (
              <ExtraServiceCard key={service.id} service={service} />
            )) : <Text style={styles.emptyText}>Nenhum serviço adicional publicado.</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Escolha o quarto</Text>
          <View style={styles.rooms}>
            {hospedagem.quartos.length ? hospedagem.quartos.map((quarto) => {
              const active = selectedQuarto?.id === quarto.id;
              return (
                <Pressable key={quarto.id} style={[styles.room, active && styles.roomActive]} onPress={() => setSelectedQuarto(quarto)}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roomTitle, active && styles.roomTitleActive]}>{quarto.nome}</Text>
                    <Text style={styles.roomMeta}>{quarto.capacidade} hóspede(s) • {quarto.tipo}</Text>
                  </View>
                  <Text style={[styles.roomPrice, active && styles.roomTitleActive]}>{formatMoney(quarto.diaria)}</Text>
                </Pressable>
              );
            }) : <Text style={styles.emptyText}>Nenhum quarto ativo disponível para reserva.</Text>}
          </View>
        </View>

        {avaliacoes.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avaliações dos peregrinos</Text>
            {avaliacoes.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.reviewCard}>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={14} color="#FACC15" />
                  <Text style={styles.ratingText}>{item.notaGeral.toFixed(1)}</Text>
                </View>
                <Text style={styles.reviewText}>{item.comentario || "Avaliação sem comentário."}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {resumo ? (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Reserva segura</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total estimado</Text>
              <Text style={styles.summaryValue}>{formatMoney(resumo.total)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sinal no app (50%)</Text>
              <Text style={styles.summaryValue}>{formatMoney(resumo.sinal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Restante na pousada</Text>
              <Text style={styles.summaryValue}>{formatMoney(resumo.restanteNaPousada)}</Text>
            </View>
            <Text style={styles.summaryNote}>Valores transparentes antes da confirmação. Serviços adicionais podem ser solicitados na próxima etapa da reserva.</Text>
          </View>
        ) : null}

        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            if (!selectedQuarto) return;
            router.push({
              pathname: "/hospedagens/reservar",
              params: { hospedagemId: hospedagem.id, quartoId: selectedQuarto.id },
            });
          }}
        >
          <Text style={styles.primaryButtonText}>Reservar com sinal de 50%</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  hero: { minHeight: 360, backgroundColor: "#12372A" },
  heroShade: { flex: 1, justifyContent: "space-between", padding: 16, backgroundColor: "rgba(18,55,42,0.38)" },
  backButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center" },
  favoriteButton: { position: "absolute", top: 16, right: 16, width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center" },
  heroCopy: { marginBottom: 12 },
  eyebrow: { color: "#F7D58B", fontWeight: "900", textTransform: "uppercase", fontSize: 12 },
  title: { color: "#FFF9EA", fontWeight: "900", fontSize: 34, lineHeight: 39, marginTop: 8 },
  subtitle: { color: "#F7F0DF", fontWeight: "700", marginTop: 8 },
  content: { padding: 16, gap: 18 },
  ratingRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  ratingBadge: { flexDirection: "row", gap: 5, alignItems: "center", backgroundColor: "#12372A", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  ratingText: { color: "#FFF9EA", fontWeight: "900" },
  ratingMeta: { flex: 1, color: "#6B7280", fontSize: 12, lineHeight: 17 },
  description: { color: "#314539", lineHeight: 22, fontSize: 16 },
  reviewSummary: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#FFF9EA", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#E5D9BD" },
  reviewSummaryText: { color: "#12372A", fontWeight: "800", flex: 1 },
  amenities: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenity: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF9EA", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: "#E5D9BD" },
  amenityText: { color: "#12372A", fontWeight: "800" },
  section: { gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  sectionTitle: { color: "#12372A", fontSize: 20, fontWeight: "900" },
  sectionMeta: { color: "#4E7C59", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  sectionDescription: { color: "#4B5563", lineHeight: 20 },
  extraList: { gap: 10 },
  extraCard: { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 12 },
  extraIcon: { width: 38, height: 38, borderRadius: 8, backgroundColor: "#F7D58B", alignItems: "center", justifyContent: "center" },
  extraTitle: { color: "#12372A", fontSize: 15, fontWeight: "900" },
  extraDescription: { color: "#4B5563", lineHeight: 19, marginTop: 3 },
  extraConfirm: { color: "#4E7C59", fontSize: 12, fontWeight: "800", marginTop: 5 },
  extraPriceBox: { alignItems: "flex-end", maxWidth: 92 },
  extraPrice: { color: "#12372A", fontWeight: "900" },
  extraUnit: { color: "#8A7B61", fontSize: 11, textAlign: "right", marginTop: 2 },
  rooms: { gap: 10 },
  room: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 8, backgroundColor: "#FFFDF6", borderWidth: 1, borderColor: "#E5D9BD" },
  roomActive: { backgroundColor: "#12372A", borderColor: "#12372A" },
  roomTitle: { color: "#12372A", fontWeight: "900", fontSize: 16 },
  roomTitleActive: { color: "#FFF9EA" },
  roomMeta: { color: "#8A7B61", marginTop: 3 },
  roomPrice: { color: "#12372A", fontWeight: "900" },
  reviewCard: { backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 12, gap: 8 },
  reviewText: { color: "#4B5563", lineHeight: 20 },
  summary: { backgroundColor: "#FFF9EA", borderRadius: 8, padding: 16, gap: 10, borderWidth: 1, borderColor: "#E5D9BD" },
  summaryTitle: { color: "#12372A", fontWeight: "900", fontSize: 18 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  summaryLabel: { color: "#4B5563" },
  summaryValue: { color: "#12372A", fontWeight: "900" },
  summaryNote: { color: "#6B7280", lineHeight: 19, fontSize: 12 },
  primaryButton: { backgroundColor: "#D8A84F", minHeight: 54, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  primaryButtonText: { color: "#12372A", fontWeight: "900", fontSize: 16 },
  center: { flex: 1, backgroundColor: "#F7F0DF", alignItems: "center", justifyContent: "center", padding: 20 },
  emptyTitle: { color: "#12372A", fontWeight: "900", fontSize: 20, marginBottom: 16 },
  emptyText: { color: "#4B5563", lineHeight: 20 },
});
