import {
  listarNotificacoesHospedagens,
  marcarNotificacaoLida,
  type CaminhoHospedagemNotificacao,
} from "@/lib/caminhosHospedagens";
import { useRequireHospedagensAuth } from "@/lib/hospedagensAuth";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function iconFor(tipo: CaminhoHospedagemNotificacao["tipo"]): keyof typeof Ionicons.glyphMap {
  if (tipo === "reserva") return "calendar-outline";
  if (tipo === "pagamento") return "card-outline";
  if (tipo === "suporte") return "help-buoy-outline";
  if (tipo === "avaliacao") return "star-outline";
  if (tipo === "admin") return "shield-checkmark-outline";
  return "notifications-outline";
}

export default function NotificacoesHospedagensScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<CaminhoHospedagemNotificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkingAuth } = useRequireHospedagensAuth();

  const load = useCallback(() => {
    let mounted = true;
    if (checkingAuth) return () => {
      mounted = false;
    };
    setLoading(true);
    listarNotificacoesHospedagens()
      .then((data) => {
        if (mounted) setItems(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [checkingAuth]);

  useFocusEffect(load);

  if (checkingAuth) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#12372A" />
      </View>
    );
  }

  async function markRead(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, lida: true } : item));
    await marcarNotificacaoLida(id);
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#12372A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Avisos</Text>
          <Text style={styles.title}>Notificações</Text>
        </View>
      </View>

      {loading ? <ActivityIndicator color="#12372A" /> : null}
      {!loading && !items.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sem notificações</Text>
          <Text style={styles.emptyText}>Reservas, pagamentos e suporte aparecerão aqui.</Text>
        </View>
      ) : null}

      {items.map((item) => (
        <Pressable key={item.id} style={[styles.card, !item.lida && styles.cardUnread]} onPress={() => markRead(item.id)}>
          <View style={styles.iconBox}>
            <Ionicons name={iconFor(item.tipo)} size={20} color="#12372A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <Text style={styles.cardText}>{item.mensagem}</Text>
            <Text style={styles.cardMeta}>{item.tipo} • {item.lida ? "lida" : "nova"}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  center: { flex: 1, backgroundColor: "#F7F0DF", alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 14, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  eyebrow: { color: "#4E7C59", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#12372A", fontSize: 25, fontWeight: "900" },
  empty: { backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 16, gap: 6 },
  emptyTitle: { color: "#12372A", fontSize: 18, fontWeight: "900" },
  emptyText: { color: "#4B5563", lineHeight: 20 },
  card: { flexDirection: "row", gap: 12, backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 14 },
  cardUnread: { borderColor: "#D8A84F", backgroundColor: "#FFF9EA" },
  iconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: "#F7D58B", alignItems: "center", justifyContent: "center" },
  cardTitle: { color: "#12372A", fontSize: 16, fontWeight: "900" },
  cardText: { color: "#4B5563", lineHeight: 20, marginTop: 3 },
  cardMeta: { color: "#4E7C59", fontSize: 12, fontWeight: "900", marginTop: 7 },
});
