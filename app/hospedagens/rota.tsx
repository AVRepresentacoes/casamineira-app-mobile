import {
  atualizarPlanejamentoFavorito,
  listarFavoritosHospedagens,
  type CaminhoHospedagemFavorito,
} from "@/lib/caminhosHospedagens";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MinhaRotaHospedagensScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<CaminhoHospedagemFavorito[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    listarFavoritosHospedagens()
      .then((data) => {
        if (mounted) setItems(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(load);

  async function updateItem(id: string, payload: { etapaOrdem?: number | null; checkinPlanejado?: string | null; observacao?: string }) {
    setItems((current) => current.map((item) => item.id === id ? {
      ...item,
      ...(payload.etapaOrdem !== undefined ? { etapaOrdem: payload.etapaOrdem } : {}),
      ...(payload.checkinPlanejado !== undefined ? { checkinPlanejado: payload.checkinPlanejado } : {}),
      ...(payload.observacao !== undefined ? { observacao: payload.observacao } : {}),
    } : item));
    try {
      await atualizarPlanejamentoFavorito(id, payload);
    } catch (error: any) {
      Alert.alert("Atenção", error?.message || "Não foi possível salvar o planejamento.");
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#12372A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Planejamento</Text>
          <Text style={styles.title}>Minha rota</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Organize as pousadas que você quer considerar em cada etapa.</Text>
        <Text style={styles.heroText}>Salve favoritos no detalhe da pousada e ajuste aqui ordem, data prevista e observações.</Text>
      </View>

      {loading ? <ActivityIndicator color="#12372A" /> : null}
      {!loading && !items.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nenhuma pousada favorita ainda</Text>
          <Text style={styles.emptyText}>Toque no coração dentro de uma pousada para montar sua rota.</Text>
        </View>
      ) : null}

      {items.map((item, index) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>{item.etapaOrdem || index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.hospedagemNome}</Text>
              <Text style={styles.cardMeta}>{item.cidade}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 0.45 }]}
              keyboardType="number-pad"
              value={item.etapaOrdem ? String(item.etapaOrdem) : ""}
              onChangeText={(value) => updateItem(item.id, { etapaOrdem: Number(value) || null })}
              placeholder="Etapa"
              placeholderTextColor="#8A7B61"
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={item.checkinPlanejado || ""}
              onChangeText={(value) => updateItem(item.id, { checkinPlanejado: value })}
              placeholder="Data AAAA-MM-DD"
              placeholderTextColor="#8A7B61"
            />
          </View>
          <TextInput
            style={styles.input}
            value={item.observacao}
            onChangeText={(value) => updateItem(item.id, { observacao: value })}
            placeholder="Observação: ligar antes, confirmar jantar, chegada tarde..."
            placeholderTextColor="#8A7B61"
          />
          <Pressable style={styles.secondaryButton} onPress={() => router.push(`/hospedagens/${item.hospedagemSlug}`)}>
            <Text style={styles.secondaryButtonText}>Ver pousada</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  content: { padding: 16, gap: 16, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  eyebrow: { color: "#4E7C59", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#12372A", fontSize: 25, fontWeight: "900" },
  hero: { backgroundColor: "#12372A", borderRadius: 8, padding: 16, gap: 6 },
  heroTitle: { color: "#FFF9EA", fontSize: 21, lineHeight: 27, fontWeight: "900" },
  heroText: { color: "#E5D9BD", lineHeight: 20 },
  empty: { backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 16, gap: 6 },
  emptyTitle: { color: "#12372A", fontSize: 18, fontWeight: "900" },
  emptyText: { color: "#4B5563", lineHeight: 20 },
  card: { backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 14, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepBadge: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#F7D58B", alignItems: "center", justifyContent: "center" },
  stepText: { color: "#12372A", fontSize: 17, fontWeight: "900" },
  cardTitle: { color: "#12372A", fontSize: 17, fontWeight: "900" },
  cardMeta: { color: "#6B7280", marginTop: 2, fontWeight: "700" },
  row: { flexDirection: "row", gap: 10 },
  input: { minHeight: 46, borderRadius: 8, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#E5D9BD", paddingHorizontal: 12, color: "#12372A" },
  secondaryButton: { minHeight: 42, borderRadius: 8, backgroundColor: "#F7D58B", alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { color: "#12372A", fontWeight: "900" },
});
