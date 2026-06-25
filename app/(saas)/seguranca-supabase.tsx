import { loadSupabaseSecurityCenterStatus, type DiagnosticColor, type DiagnosticItem } from "@/lib/supabase-diagnostics";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

const STATUS_META: Record<DiagnosticColor, { label: string; color: string; backgroundColor: string }> = {
  green: { label: "Verde", color: "#22c55e", backgroundColor: "rgba(34,197,94,0.12)" },
  yellow: { label: "Amarelo", color: "#facc15", backgroundColor: "rgba(250,204,21,0.12)" },
  red: { label: "Vermelho", color: "#ef4444", backgroundColor: "rgba(239,68,68,0.12)" },
};

export default function SupabaseSecurityCenterScreen() {
  const [items, setItems] = useState<DiagnosticItem[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      const status = await loadSupabaseSecurityCenterStatus();
      setItems(status.items);
      setGeneratedAt(status.generatedAt);
    } catch (error) {
      console.log("SUPABASE SECURITY CENTER ERROR:", error);
      setItems([
        {
          key: "security-center-error",
          label: "Security Center",
          status: "red",
          explanation: error instanceof Error ? error.message : "Erro ao carregar diagnóstico.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void carregar()} tintColor="#facc15" />}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Infraestrutura</Text>
        <Text style={styles.title}>Segurança Supabase</Text>
        <Text style={styles.subtitle}>{generatedAt ? `Atualizado em ${new Date(generatedAt).toLocaleString("pt-BR")}` : "Diagnóstico de produção"}</Text>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#facc15" />
        </View>
      ) : null}

      <View style={styles.grid}>
        {items.map((item) => (
          <StatusCard key={item.key} item={item} />
        ))}
      </View>
    </ScrollView>
  );
}

function StatusCard({ item }: { item: DiagnosticItem }) {
  const meta = STATUS_META[item.status] || STATUS_META.yellow;
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.cardTitle}>{item.label}</Text>
        <View style={[styles.badge, { backgroundColor: meta.backgroundColor, borderColor: meta.color }]}>
          <View style={[styles.dot, { backgroundColor: meta.color }]} />
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>
      <Text style={styles.explanation}>{item.explanation}</Text>
      {item.details ? <Text style={styles.details}>{JSON.stringify(item.details, null, 2)}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 16,
  },
  eyebrow: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 6,
  },
  loadingCard: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  grid: {
    gap: 12,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    flex: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "900",
  },
  explanation: {
    color: "#cbd5e1",
    marginTop: 10,
    lineHeight: 20,
  },
  details: {
    color: "#94a3b8",
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "monospace",
  },
});

