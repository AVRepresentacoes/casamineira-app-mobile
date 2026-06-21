import { createSaasEmpresa, getSaasEmpresasOverview, setSaasEmpresaStatus, type SaasEmpresaOverview } from "@/lib/saas-admin";
import { getSaasCommercialMetrics, type SaasCommercialMetrics } from "@/lib/saas-commercial";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function slugify(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function SaasEmpresasScreen() {
  const router = useRouter();
  const [items, setItems] = useState<SaasEmpresaOverview[]>([]);
  const [metrics, setMetrics] = useState<SaasCommercialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      const [data, metricsData] = await Promise.all([
        getSaasEmpresasOverview(),
        getSaasCommercialMetrics().catch(() => null),
      ]);
      setItems(data);
      setMetrics(metricsData);
    } catch (error) {
      console.log("SAAS EMPRESAS LOAD ERROR:", error);
      Alert.alert("Acesso restrito", "Esta área é exclusiva do super admin SaaS.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  async function handleCriar() {
    const nomeLimpo = nome.trim();
    const slugFinal = slugify(slug || nomeLimpo);

    if (!nomeLimpo || !slugFinal) {
      Alert.alert("Atenção", "Informe nome e slug válidos para criar a empresa.");
      return;
    }

    try {
      setSaving(true);
      await createSaasEmpresa(nomeLimpo, slugFinal);
      setNome("");
      setSlug("");
      await carregar();
      Alert.alert("Sucesso", "Empresa SaaS criada com sucesso.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível criar a empresa.");
    } finally {
      setSaving(false);
    }
  }

  async function alternarStatus(item: SaasEmpresaOverview) {
    try {
      await setSaasEmpresaStatus(item.empresa_id, !item.ativa);
      await carregar();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível atualizar a empresa.");
    }
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => item.empresa_id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void carregar()} tintColor="#facc15" />}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <Text style={styles.header}>Admin SaaS</Text>
          <Text style={styles.subheader}>Gestão de empresas, branding, modo operacional e assinatura da plataforma.</Text>

          {metrics ? (
            <View style={styles.metricsGrid}>
              <MetricCard label="Trials" value={String(metrics.empresas_trial || 0)} />
              <MetricCard label="Ativas" value={String(metrics.empresas_ativas || 0)} />
              <MetricCard label="Inadimplentes" value={String(metrics.empresas_inadimplentes || 0)} />
              <MetricCard label="MRR estimado" value={`R$ ${Number(metrics.mrr_estimado || 0).toFixed(2)}`} wide />
            </View>
          ) : null}

          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Nova empresa</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da empresa"
              placeholderTextColor="#6b7280"
              value={nome}
              onChangeText={(value) => {
                setNome(value);
                if (!slug.trim()) setSlug(slugify(value));
              }}
            />
            <TextInput
              style={styles.input}
              placeholder="slug-da-empresa"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              value={slug}
              onChangeText={(value) => setSlug(slugify(value))}
            />
            <TouchableOpacity style={[styles.primaryButton, saving ? styles.disabled : null]} onPress={() => void handleCriar()} disabled={saving}>
              {saving ? <ActivityIndicator color="#020617" /> : <Text style={styles.primaryButtonText}>Criar empresa</Text>}
            </TouchableOpacity>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.companyName}>{item.nome}</Text>
            <View style={[styles.statusBadge, item.ativa ? styles.statusActive : styles.statusInactive]}>
              <Text style={styles.statusText}>{item.ativa ? "Ativa" : "Suspensa"}</Text>
            </View>
          </View>
          <Text style={styles.meta}>Slug: {item.slug}</Text>
          <Text style={styles.meta}>Usuários: {item.usuarios_qtd} • Pedidos: {item.pedidos_qtd}</Text>
          <Text style={styles.meta}>Plano: {item.plano_nome || "Sem plano"} • Assinatura: {item.assinatura_status || "Sem status"}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push(`/(saas)/empresa/${item.empresa_id}` as never)}>
              <Text style={styles.secondaryButtonText}>Gerenciar empresa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => void alternarStatus(item)}>
              <Text style={styles.secondaryButtonText}>{item.ativa ? "Suspender" : "Reativar"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListEmptyComponent={
        loading ? null : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhuma empresa encontrada</Text>
            <Text style={styles.emptyText}>Cadastre a primeira empresa SaaS para iniciar a operação multi-tenant.</Text>
          </View>
        )
      }
    />
  );
}

function MetricCard({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.metricCard, wide ? styles.metricCardWide : null]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
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
    gap: 14,
  },
  headerWrap: {
    marginBottom: 14,
  },
  header: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
  },
  subheader: {
    color: "#94a3b8",
    marginTop: 6,
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: "#0b1220",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: "31%",
    minWidth: 100,
    backgroundColor: "#0b1220",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  metricCardWide: {
    width: "100%",
  },
  metricLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },
  metricValue: {
    color: "#ffffff",
    fontWeight: "900",
    marginTop: 8,
  },
  cardTitle: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#111827",
    color: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  primaryButton: {
    backgroundColor: "#facc15",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#020617",
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.7,
  },
  card: {
    backgroundColor: "#0b1220",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  companyName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
  },
  meta: {
    color: "#cbd5e1",
    marginTop: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusActive: {
    backgroundColor: "rgba(34,197,94,0.14)",
  },
  statusInactive: {
    backgroundColor: "rgba(248,113,113,0.14)",
  },
  statusText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#facc15",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#facc15",
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  emptyCard: {
    backgroundColor: "#0b1220",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  emptyTitle: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
  },
  emptyText: {
    color: "#94a3b8",
    marginTop: 6,
  },
});
