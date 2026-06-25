import {
  formatMoney,
  listarMinhasReservasHospedagem,
  type CaminhoHospedagemReservaCliente,
} from "@/lib/caminhosHospedagens";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function statusLabel(status: string) {
  const map: Record<string, string> = {
    aguardando_pagamento: "Aguardando pagamento",
    confirmada: "Confirmada",
    concluida: "Concluída",
    cancelada_cliente: "Cancelada por você",
    cancelada_pousada: "Cancelada pela pousada",
    no_show: "Não compareceu",
  };
  return map[status] || status;
}

export default function MinhasHospedagensScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reservas, setReservas] = useState<CaminhoHospedagemReservaCliente[]>([]);
  const [loading, setLoading] = useState(true);

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
          <Text style={styles.eyebrow}>Minha jornada</Text>
          <Text style={styles.title}>Histórico de hospedagens</Text>
        </View>
      </View>

      {loading ? <ActivityIndicator color="#12372A" /> : null}

      <View style={styles.list}>
        {reservas.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.hospedagemNome}</Text>
                <Text style={styles.cardMeta}>{item.cidade} • {item.quartoNome}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{statusLabel(item.status)}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Check-in</Text>
              <Text style={styles.value}>{item.checkin}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Check-out</Text>
              <Text style={styles.value}>{item.checkout}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total</Text>
              <Text style={styles.value}>{formatMoney(item.total)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Sinal pago no app</Text>
              <Text style={styles.value}>{formatMoney(item.sinal)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Restante na pousada</Text>
              <Text style={styles.value}>{formatMoney(item.restanteNaPousada)}</Text>
            </View>
            <View style={styles.paymentStatus}>
              <Ionicons name={item.statusPagamento === "aprovada" ? "checkmark-circle" : "time-outline"} size={17} color={item.statusPagamento === "aprovada" ? "#0F6B4F" : "#A16207"} />
              <Text style={styles.paymentStatusText}>Pagamento: {item.statusPagamento}</Text>
            </View>
            {item.statusPagamento !== "aprovada" ? (
              <Pressable style={styles.payButton} onPress={() => router.push({ pathname: "/hospedagens/pagar", params: { reservaId: item.id } })}>
                <Text style={styles.payButtonText}>Continuar pagamento</Text>
                <Ionicons name="chevron-forward" size={17} color="#12372A" />
              </Pressable>
            ) : (
              <View style={styles.proofBox}>
                <Text style={styles.proofTitle}>Comprovante da reserva</Text>
                <Text style={styles.proofText}>Apresente esta tela na pousada no check-in. O restante será pago diretamente no local.</Text>
              </View>
            )}
            {item.status === "concluida" || item.statusPagamento === "aprovada" ? (
              <Pressable
                style={styles.reviewButton}
                onPress={() =>
                  router.push({
                    pathname: "/hospedagens/avaliar",
                    params: {
                      reservaId: item.id,
                      hospedagemSlug: item.hospedagemSlug,
                      hospedagemNome: item.hospedagemNome,
                    },
                  })
                }
              >
                <Ionicons name="star-outline" size={17} color="#12372A" />
                <Text style={styles.reviewButtonText}>Avaliar hospedagem</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
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
  list: { gap: 12 },
  card: { backgroundColor: "#FFFDF6", borderWidth: 1, borderColor: "#E5D9BD", borderRadius: 8, padding: 14, gap: 10 },
  cardHeader: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  cardTitle: { color: "#12372A", fontSize: 17, fontWeight: "900" },
  cardMeta: { color: "#6B7280", marginTop: 3, fontWeight: "700" },
  badge: { backgroundColor: "#12372A", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  badgeText: { color: "#F7D58B", fontSize: 11, fontWeight: "900" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  label: { color: "#6B7280" },
  value: { color: "#12372A", fontWeight: "900" },
  paymentStatus: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#FFF9EA", borderRadius: 8, padding: 10 },
  paymentStatusText: { color: "#12372A", fontWeight: "900" },
  payButton: { minHeight: 44, borderRadius: 8, backgroundColor: "#F7D58B", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 12 },
  payButtonText: { color: "#12372A", fontWeight: "900" },
  proofBox: { backgroundColor: "#ECFDF3", borderWidth: 1, borderColor: "#BBF7D0", borderRadius: 8, padding: 10, gap: 3 },
  proofTitle: { color: "#0F6B4F", fontWeight: "900" },
  proofText: { color: "#315342", lineHeight: 19 },
  reviewButton: { minHeight: 42, borderRadius: 8, borderWidth: 1, borderColor: "#D8A84F", backgroundColor: "#FFF9EA", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 12 },
  reviewButtonText: { color: "#12372A", fontWeight: "900" },
});
