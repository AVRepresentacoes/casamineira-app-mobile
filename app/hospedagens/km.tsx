import {
  calcularResumoJornada,
  listarMinhasReservasHospedagem,
  type CaminhoHospedagemReservaCliente,
} from "@/lib/caminhosHospedagens";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CAMINHO_TOTAL_KM = 497;

export default function KmPercorridosHospedagensScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reservas, setReservas] = useState<CaminhoHospedagemReservaCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const resumo = calcularResumoJornada(reservas);
  const progresso = Math.min(100, Math.round((resumo.kmPercorridos / CAMINHO_TOTAL_KM) * 100));

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);
      listarMinhasReservasHospedagem()
        .then((data) => {
          if (mounted) setReservas(data);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
      return () => {
        mounted = false;
      };
    }, []),
  );

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#12372A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Progresso da peregrinação</Text>
          <Text style={styles.title}>Km percorridos</Text>
        </View>
      </View>

      {loading ? <ActivityIndicator color="#12372A" /> : null}

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Estimativa por hospedagens concluídas/ativas</Text>
        <Text style={styles.heroValue}>{Math.round(resumo.kmPercorridos)} km</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progresso}%` }]} />
        </View>
        <Text style={styles.heroNote}>{progresso}% do trajeto modelo até Aparecida ({CAMINHO_TOTAL_KM} km).</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Etapas registradas</Text>
        {reservas.map((item) => {
          return (
            <View key={item.id} style={styles.stageCard}>
              <View style={styles.stageIcon}>
                <Ionicons name="flag-outline" size={20} color="#12372A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stageTitle}>{item.cidade}</Text>
                <Text style={styles.stageMeta}>{item.hospedagemNome}</Text>
              </View>
              <Text style={styles.stageKm}>Real</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Como calculamos?</Text>
        <Text style={styles.infoText}>Os quilômetros agora dependem de dados reais de rota por pousada. Enquanto esse campo não existir no banco, a tela mantém apenas as etapas registradas.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  content: { padding: 16, gap: 16, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  eyebrow: { color: "#4E7C59", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#12372A", fontSize: 24, fontWeight: "900" },
  heroCard: { backgroundColor: "#12372A", borderRadius: 8, padding: 18, gap: 10 },
  heroLabel: { color: "#F7D58B", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  heroValue: { color: "#FFF9EA", fontSize: 42, fontWeight: "900" },
  progressTrack: { height: 12, borderRadius: 8, overflow: "hidden", backgroundColor: "rgba(255,249,234,0.18)" },
  progressFill: { height: "100%", borderRadius: 8, backgroundColor: "#D8A84F" },
  heroNote: { color: "#F7F0DF", lineHeight: 20 },
  section: { gap: 10 },
  sectionTitle: { color: "#12372A", fontSize: 19, fontWeight: "900" },
  stageCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFDF6", borderWidth: 1, borderColor: "#E5D9BD", borderRadius: 8, padding: 14 },
  stageIcon: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#F7D58B", alignItems: "center", justifyContent: "center" },
  stageTitle: { color: "#12372A", fontSize: 16, fontWeight: "900" },
  stageMeta: { color: "#6B7280", marginTop: 3 },
  stageKm: { color: "#12372A", fontWeight: "900", fontSize: 16 },
  infoBox: { backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#E5D9BD", borderRadius: 8, padding: 16, gap: 6 },
  infoTitle: { color: "#12372A", fontSize: 17, fontWeight: "900" },
  infoText: { color: "#4B5563", lineHeight: 21 },
});
