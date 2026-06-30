import {
  calcularResumoJornada,
  formatMoney,
  listarMinhasReservasHospedagem,
  type CaminhoHospedagemReservaCliente,
} from "@/lib/caminhosHospedagens";
import { useRequireHospedagensAuth } from "@/lib/hospedagensAuth";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ControleGastosHospedagensScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reservas, setReservas] = useState<CaminhoHospedagemReservaCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkingAuth } = useRequireHospedagensAuth();
  const resumo = calcularResumoJornada(reservas);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      if (checkingAuth) return () => {
        mounted = false;
      };
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
    }, [checkingAuth]),
  );

  if (checkingAuth) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#12372A" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#12372A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Controle financeiro</Text>
          <Text style={styles.title}>Gastos com hospedagens</Text>
        </View>
      </View>

      {loading ? <ActivityIndicator color="#12372A" /> : null}

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total planejado em hospedagens</Text>
        <Text style={styles.totalValue}>{formatMoney(resumo.totalReservado)}</Text>
        <Text style={styles.totalNote}>Soma das reservas ativas e concluídas.</Text>
      </View>

      <View style={styles.grid}>
        <Metric label="Pago como sinal" value={formatMoney(resumo.totalSinais)} />
        <Metric label="Pagar na pousada" value={formatMoney(resumo.restantePousadas)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalhamento</Text>
        {reservas.map((item) => (
          <View key={item.id} style={styles.lineCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineTitle}>{item.cidade}</Text>
              <Text style={styles.lineMeta}>{item.hospedagemNome}</Text>
            </View>
            <View style={styles.amounts}>
              <Text style={styles.amountMain}>{formatMoney(item.total)}</Text>
              <Text style={styles.amountSub}>sinal {formatMoney(item.sinal)}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  center: { flex: 1, backgroundColor: "#F7F0DF", alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 16, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  eyebrow: { color: "#4E7C59", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#12372A", fontSize: 24, fontWeight: "900" },
  totalCard: { backgroundColor: "#12372A", borderRadius: 8, padding: 18, gap: 6 },
  totalLabel: { color: "#F7D58B", fontWeight: "900", textTransform: "uppercase", fontSize: 12 },
  totalValue: { color: "#FFF9EA", fontSize: 34, fontWeight: "900" },
  totalNote: { color: "#F7F0DF" },
  grid: { flexDirection: "row", gap: 10 },
  metric: { flex: 1, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#E5D9BD", borderRadius: 8, padding: 14 },
  metricValue: { color: "#12372A", fontSize: 20, fontWeight: "900" },
  metricLabel: { color: "#6B7280", marginTop: 4, fontWeight: "700" },
  section: { gap: 10 },
  sectionTitle: { color: "#12372A", fontSize: 19, fontWeight: "900" },
  lineCard: { flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: "#FFFDF6", borderWidth: 1, borderColor: "#E5D9BD", borderRadius: 8, padding: 14 },
  lineTitle: { color: "#12372A", fontWeight: "900", fontSize: 16 },
  lineMeta: { color: "#6B7280", marginTop: 3 },
  amounts: { alignItems: "flex-end" },
  amountMain: { color: "#12372A", fontWeight: "900" },
  amountSub: { color: "#4E7C59", fontSize: 12, fontWeight: "800", marginTop: 3 },
});
