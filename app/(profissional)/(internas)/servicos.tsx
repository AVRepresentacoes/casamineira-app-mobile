import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import PressableScale from "@/components/PressableScale";
import { supabase } from "@/lib/supabase";
import { formatCurrencyInputBR, parseCurrencyInputBR } from "@/lib/currency";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";
import {
  getUsageLabel,
  hasReachedLimit,
  loadProfessionalSubscriptionContext,
  type ProfessionalSubscriptionContext,
} from "@/lib/pro-subscription";

/* =====================
   TIPOS (DECLARADOS UMA ÚNICA VEZ)
===================== */
type Servico = {
  id: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
};

/* =====================
   COMPONENTE
===================== */
export default function ServicosProfissional() {
  const router = useRouter();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<ProfessionalSubscriptionContext | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const servicoDestaque = servicos[0] || null;
  const precoMedio = servicos.length
    ? servicos.reduce((acc, item) => acc + (item.preco ?? 0), 0) / servicos.length
    : 0;

  useEffect(() => {
    carregarServicos();
  }, []);

  useEffect(() => {
    loadProfessionalSubscriptionContext().then(setSubscription).catch(() => setSubscription(null));
  }, []);

  /* =====================
     CARREGAR SERVIÇOS
  ===================== */
  const carregarServicos = async () => {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setLoading(false);
      return;
    }

    let tenantId: string | null = null;
    try {
      tenantId = await ensureCurrentUserTenantContext();
    } catch {
      try {
        tenantId = await getCurrentTenantId();
      } catch {
        tenantId = null;
      }
    }

    let query = supabase
      .from("servicos")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query;

    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      setServicos((data as Servico[]) || []);
    }

    setLoading(false);
  };

  /* =====================
     SALVAR SERVIÇO
  ===================== */
  const salvarServico = async () => {
    if (!titulo.trim()) {
      Alert.alert("Atenção", "Informe o título do serviço.");
      return;
    }

    if (subscription && hasReachedLimit(servicos.length, subscription.plan.limits.services)) {
      Alert.alert(
        "Limite do plano atingido",
        `Seu plano ${subscription.plan.label} permite ${subscription.plan.limits.services} serviços. Faça upgrade para continuar publicando.`,
      );
      return;
    }

    const precoNumero =
      preco.trim() === "" ? null : parseCurrencyInputBR(preco);

    if (precoNumero !== null && isNaN(precoNumero)) {
      Alert.alert("Erro", "Preço inválido.");
      return;
    }

    setSaving(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setSaving(false);
      return;
    }

    let tenantId: string | null = null;
    try {
      tenantId = await ensureCurrentUserTenantContext();
    } catch {
      try {
        tenantId = await getCurrentTenantId();
      } catch {
        tenantId = null;
      }
    }

    const { error } = await supabase.from("servicos").insert({
      ...(tenantId ? { tenant_id: tenantId } : {}),
      user_id: auth.user.id,
      titulo,
      descricao,
      preco: precoNumero,
    });

    setSaving(false);

    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      setTitulo("");
      setDescricao("");
      setPreco("");
      carregarServicos();
    }
  };

  /* =====================
     RENDER
  ===================== */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  const header = (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <View style={styles.titleRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="construct-outline" size={20} color="#0B0F1A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Catálogo profissional</Text>
            <Text style={styles.title}>Meus Serviços</Text>
          </View>
        </View>
        <Text style={styles.heroText}>
          Estruture seu catálogo com títulos claros, preços de referência e uma apresentação que aumente a conversão do seu perfil.
        </Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaChip}>
            <Ionicons name="briefcase-outline" size={14} color="#facc15" />
            <Text style={styles.heroMetaText}>{servicos.length} serviços ativos</Text>
          </View>
          <View style={styles.heroMetaChip}>
            <Ionicons name="cash-outline" size={14} color="#facc15" />
            <Text style={styles.heroMetaText}>Ticket médio {`R$ ${precoMedio.toFixed(2)}`}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Serviços ativos</Text>
          <Text style={styles.metricValue}>{servicos.length}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Preço médio</Text>
          <Text style={styles.metricValue}>{`R$ ${precoMedio.toFixed(2)}`}</Text>
        </View>
        <View style={styles.metricCardWide}>
          <Text style={styles.metricLabel}>Serviço em destaque</Text>
          <Text style={styles.metricValueSoft}>{servicoDestaque ? servicoDestaque.titulo : "Nenhum serviço cadastrado"}</Text>
        </View>
      </View>

      {subscription ? (
        <View style={styles.limitCard}>
          <View>
            <Text style={styles.limitTitle}>Capacidade do plano</Text>
            <Text style={styles.limitText}>
              {subscription.plan.label} • {getUsageLabel(servicos.length, subscription.plan.limits.services)}
            </Text>
            <PressableScale style={styles.upgradeButton} onPress={() => router.push("/(profissional)/(internas)/assinatura")}>
              <Text style={styles.upgradeButtonTitle}>Fazer upgrade de plano</Text>
              <Text style={styles.upgradeButtonSub}>Amplie o número de serviços e fortaleça seu catálogo.</Text>
            </PressableScale>
          </View>
          <View style={styles.limitBadge}>
            <Text style={styles.limitBadgeText}>
              {subscription.plan.limits.services === null ? "Ilimitado" : `${subscription.plan.limits.services} max`}
            </Text>
          </View>
        </View>
      ) : null}

      {servicoDestaque ? (
        <View style={styles.showcaseCard}>
          <View style={styles.showcaseBadge}>
            <Text style={styles.showcaseBadgeText}>Oferta em destaque</Text>
          </View>
          <Text style={styles.showcaseTitle}>{servicoDestaque.titulo}</Text>
          <Text style={styles.showcaseText} numberOfLines={3}>
            {servicoDestaque.descricao || "Adicione uma descrição comercial clara para reforçar valor e diferenciação."}
          </Text>
          <View style={styles.showcaseFooter}>
            <Text style={styles.showcasePrice}>{`R$ ${(servicoDestaque.preco ?? 0).toFixed(2)}`}</Text>
            <Text style={styles.showcaseHint}>Posicionamento comercial premium</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Novo serviço do catálogo</Text>
          <Text style={styles.sectionHint}>Estrutura comercial</Text>
        </View>
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={descricao}
          onChangeText={setDescricao}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Preço (R$)</Text>
        <TextInput
          style={styles.input}
          value={preco}
          onChangeText={(texto) => setPreco(formatCurrencyInputBR(texto))}
          keyboardType="numeric"
        />

        <PressableScale
          style={[styles.btn, saving && { opacity: 0.6 }]}
          onPress={salvarServico}
          disabled={saving}
        >
          <Text style={styles.btnText}>
            {saving ? "Salvando..." : "Adicionar Serviço"}
          </Text>
        </PressableScale>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Playbook comercial</Text>
        <Text style={styles.tipText}>• Use títulos específicos para aumentar conversão nas buscas.</Text>
        <Text style={styles.tipText}>• Informe preço de referência para filtrar clientes com alta intenção.</Text>
        <Text style={styles.tipText}>• Atualize o catálogo semanalmente para manter relevância.</Text>
      </View>
    </>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      {header}
      {servicos.length === 0 ? (
        <Text style={styles.empty}>Nenhum serviço cadastrado.</Text>
      ) : null}
      {servicos.map((item) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.itemTopRow}>
            <Text style={styles.itemTitle}>{item.titulo}</Text>
            <View style={styles.itemTag}>
              <Text style={styles.itemTagText}>Ativo</Text>
            </View>
          </View>
          {item.descricao ? (
            <Text style={styles.itemDesc}>{item.descricao}</Text>
          ) : null}
          <View style={styles.itemFooter}>
            <Text style={styles.itemFooterText}>Oferta pronta para proposta</Text>
            <Text style={styles.price}>
              R$ {(item.preco ?? 0).toFixed(2)}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

/* =====================
   ESTILOS (PREMIUM ESCURO)
===================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040a",
  },
  listContent: { padding: 16, paddingBottom: 120 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#03040a",
  },
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  heroCard: {
    backgroundColor: "#081121",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: -24,
    right: -12,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#facc1514",
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: { flex: 1 },
  eyebrow: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  heroText: { color: "#94a3b8", fontSize: 13, lineHeight: 20 },
  heroMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  heroMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  heroMetaText: { color: "#e2e8f0", fontSize: 12, fontWeight: "700" },
  card: {
    backgroundColor: "#081121",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 16,
  },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  metricCard: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: "#081121",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 12,
  },
  metricCardWide: {
    width: "100%",
    backgroundColor: "#081121",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 12,
  },
  metricLabel: {
    color: "#9ca3af",
    fontSize: 12,
  },
  metricValue: {
    color: "#facc15",
    fontWeight: "900",
    fontSize: 18,
    marginTop: 6,
  },
  metricValueSoft: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 16,
    marginTop: 6,
  },
  showcaseCard: {
    backgroundColor: "#0c172d",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#304767",
    padding: 16,
    marginBottom: 16,
  },
  showcaseBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#facc15",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  showcaseBadgeText: {
    color: "#0B0F1A",
    fontWeight: "900",
    fontSize: 11,
  },
  showcaseTitle: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 24,
    marginBottom: 8,
  },
  showcaseText: {
    color: "#cbd5e1",
    lineHeight: 20,
  },
  showcaseFooter: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  showcasePrice: {
    color: "#34d399",
    fontWeight: "900",
    fontSize: 22,
  },
  showcaseHint: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "900",
  },
  sectionHint: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
  },
  label: {
    color: "#9ca3af",
    marginTop: 10,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 12,
    color: "#e5e7eb",
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#304767",
  },
  textArea: {
    minHeight: 90,
  },
  btn: {
    backgroundColor: "#facc15",
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  btnText: {
    color: "#000",
    fontWeight: "900",
  },
  limitCard: {
    backgroundColor: "#081121",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  limitTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 14,
  },
  limitText: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 12,
  },
  upgradeButton: {
    marginTop: 12,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#facc15",
    borderRadius: 14,
    padding: 12,
  },
  upgradeButtonTitle: {
    color: "#facc15",
    fontWeight: "900",
    fontSize: 13,
  },
  upgradeButtonSub: {
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  limitBadge: {
    backgroundColor: "#facc15",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  limitBadgeText: {
    color: "#0B0F1A",
    fontWeight: "900",
    fontSize: 11,
  },
  item: {
    backgroundColor: "#081121",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 10,
  },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  itemTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 16,
    flex: 1,
  },
  itemTag: {
    backgroundColor: "#facc15",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  itemTagText: {
    color: "#0B0F1A",
    fontWeight: "900",
    fontSize: 11,
  },
  itemDesc: {
    color: "#9ca3af",
    marginTop: 6,
    lineHeight: 20,
  },
  itemFooter: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  itemFooterText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  price: {
    color: "#34d399",
    fontWeight: "900",
    fontSize: 16,
  },
  empty: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 20,
  },
  tipCard: {
    backgroundColor: "#081121",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 12,
    marginBottom: 12,
  },
  tipTitle: {
    color: "#e5e7eb",
    fontWeight: "900",
    marginBottom: 8,
  },
  tipText: {
    color: "#9ca3af",
    lineHeight: 20,
  },
});
