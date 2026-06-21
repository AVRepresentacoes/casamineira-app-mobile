import { useEmpresaCommercial } from "@/hooks/useEmpresaCommercial";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  hasProfessionalFullAccess,
  loadProfessionalSubscriptionContext,
  type ProfessionalSubscriptionContext,
} from "@/lib/pro-subscription";
import { supabase } from "@/lib/supabase";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";

type ExtratoItem = {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
  created_at: string;
};

type Comissao = {
  id: string;
  valor_total: number | null;
  valor_comissao: number | null;
  valor_profissional: number | null;
  status_pagamento?: string | null;
  status_pagamentos?: string | null;
  created_at: string;
};

function money(v: number) {
  return `R$ ${Number(v || 0).toFixed(2)}`;
}

const EXEMPLO_VENDA = 500;

function getTipoColor(tipo: string) {
  const t = (tipo || "").toLowerCase();
  if (t.includes("saque") || t.includes("saida")) return "#f87171";
  if (t.includes("pendente") || t.includes("bloque")) return "#facc15";
  return "#22c55e";
}

function periodLabel(dates: string[]) {
  if (!dates.length) return "Sem período";
  const sorted = [...dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const ini = new Date(sorted[0]).toLocaleDateString("pt-BR");
  const fim = new Date(sorted[sorted.length - 1]).toLocaleDateString("pt-BR");
  if (ini === fim) return ini;
  return `${ini} - ${fim}`;
}

function isPagamentoAprovado(item: Pick<Comissao, "status_pagamento" | "status_pagamentos">) {
  const status = String(item.status_pagamento || item.status_pagamentos || "").toLowerCase();
  return status === "aprovada" || status === "pago";
}

function isPagamentoPendente(item: Pick<Comissao, "status_pagamento" | "status_pagamentos">) {
  const status = String(item.status_pagamento || item.status_pagamentos || "").toLowerCase();
  return status === "pendente" || status === "aguardar_pagamento";
}

function labelStatusPagamento(item: Pick<Comissao, "status_pagamento" | "status_pagamentos">) {
  const status = String(item.status_pagamento || item.status_pagamentos || "").toLowerCase();
  if (status === "aprovada" || status === "pago") return "aprovado";
  if (status === "pendente" || status === "aguardar_pagamento") return "pendente";
  if (status === "recusada" || status === "recusado") return "recusado";
  if (status === "estornada" || status === "estornado") return "estornado";
  return status || "indefinido";
}

export default function FinanceiroProfissional() {
  const router = useRouter();
  const { commercial, loadingCommercial } = useEmpresaCommercial();
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [saldo, setSaldo] = useState(0);
  const [bloqueado, setBloqueado] = useState(0);
  const [extrato, setExtrato] = useState<ExtratoItem[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [subscription, setSubscription] = useState<ProfessionalSubscriptionContext | null>(null);

  const saldoDisponivel = useMemo(() => Math.max(0, saldo - bloqueado), [saldo, bloqueado]);
  const simulacaoRepasse = useMemo(() => {
    const commissionRate = subscription?.plan.commissionRate ?? 20;
    const plataforma = Number((EXEMPLO_VENDA * (commissionRate / 100)).toFixed(2));
    const profissional = Number((EXEMPLO_VENDA - plataforma).toFixed(2));

    return { plataforma, profissional };
  }, [subscription]);

  const ganhosPagos = useMemo(
    () =>
      comissoes
        .filter((c) => isPagamentoAprovado(c))
        .reduce((acc, c) => acc + Number(c.valor_profissional || 0), 0),
    [comissoes],
  );
  const volumeTotalComissoes = useMemo(
    () =>
      comissoes.reduce((acc, c) => acc + Number(c.valor_comissao || 0), 0),
    [comissoes],
  );

  const comissoesPagas = useMemo(
    () => comissoes.filter((c) => isPagamentoAprovado(c)).length,
    [comissoes],
  );
  const comissoesPendentes = useMemo(
    () => comissoes.filter((c) => isPagamentoPendente(c)).length,
    [comissoes],
  );

  const ticketMedioPago = useMemo(
    () => (comissoesPagas > 0 ? ganhosPagos / comissoesPagas : 0),
    [comissoesPagas, ganhosPagos],
  );

  const entradasExtrato = useMemo(
    () =>
      extrato
        .filter((i) => {
          const t = (i.tipo || "").toLowerCase();
          return !t.includes("saque") && !t.includes("saida");
        })
        .reduce((acc, i) => acc + Number(i.valor || 0), 0),
    [extrato],
  );

  const saidasExtrato = useMemo(
    () =>
      extrato
        .filter((i) => {
          const t = (i.tipo || "").toLowerCase();
          return t.includes("saque") || t.includes("saida");
        })
        .reduce((acc, i) => acc + Number(i.valor || 0), 0),
    [extrato],
  );

  const periodoComissoes = useMemo(
    () => periodLabel(comissoes.map((c) => c.created_at)),
    [comissoes],
  );
  const periodoExtrato = useMemo(
    () => periodLabel(extrato.map((e) => e.created_at)),
    [extrato],
  );

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;
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

      let walletQuery = supabase
        .from("wallets")
        .select("*")
        .eq("user_id", auth.user.id);

      if (tenantId) walletQuery = walletQuery.eq("tenant_id", tenantId);

      const { data: wallet } = await walletQuery.maybeSingle();

      const subscriptionContext = await loadProfessionalSubscriptionContext(auth.user.id).catch(() => null);
      setSubscription(subscriptionContext);

      setSaldo(Number(wallet?.saldo || 0));
      setBloqueado(Number(wallet?.bloqueado || 0));
      setUpdatedAt(new Date().toLocaleString("pt-BR"));

      let extratoQuery = supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(40);

      if (tenantId) extratoQuery = extratoQuery.eq("tenant_id", tenantId);

      const { data: extrato } = await extratoQuery;

      setExtrato((extrato as ExtratoItem[]) || []);

      let comissoesQuery = supabase
        .from("pagamentos")
        .select("id, valor_total, valor_comissao, valor_profissional, status_pagamento, status_pagamentos, created_at")
        .eq("profissional_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(40);

      if (tenantId) comissoesQuery = comissoesQuery.eq("tenant_id", tenantId);

      const { data: comissoes } = await comissoesQuery;

      setComissoes((comissoes as Comissao[]) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados]),
  );

  const eliteHasFullAccess = hasProfessionalFullAccess(subscription);
  const blockedByCompanyPlan =
    !loadingCommercial && commercial && !commercial.acesso_financeiro_avancado;

  if (blockedByCompanyPlan && !eliteHasFullAccess) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Financeiro avançado</Text>
        <Text style={styles.emptyText}>
          Seu plano atual não inclui este módulo. Faça upgrade da assinatura da empresa para liberar o painel financeiro avançado.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.titleRow}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroIconText}>R$</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Performance financeira</Text>
            <Text style={styles.title}>Financeiro</Text>
          </View>
        </View>
        <Text style={styles.heroText}>
          Acompanhe saldo disponível, pagamentos recebidos, comissões e movimentações da sua operação em um painel consolidado.
        </Text>
        <Text style={styles.updatedAt}>Atualizado em {updatedAt || "agora"}</Text>
      </View>

      <View style={styles.resumeCard}>
        <ResumoLine label="Saldo disponível" value={money(saldoDisponivel)} color="#22c55e" />
        <ResumoLine label="Bloqueado" value={money(bloqueado)} color="#fca5a5" />
        <ResumoLine label="Ganhos pagos (propostas)" value={money(ganhosPagos)} color="#22c55e" />
        <ResumoLine label="Comissão da plataforma" value={money(volumeTotalComissoes)} color="#facc15" />
      </View>

      {subscription ? (
        <View style={styles.planCard}>
          <Text style={styles.planTitle}>Repasse conforme seu plano</Text>
          <Text style={styles.planText}>
            {subscription.plan.label} • comissão atual de {subscription.plan.commissionLabel} por venda aprovada.
          </Text>
          <View style={styles.planExampleCard}>
            <Text style={styles.planExampleTitle}>Exemplo prático em uma venda de {money(EXEMPLO_VENDA)}</Text>
            <View style={styles.planExampleRow}>
              <Text style={styles.planExampleLabel}>Plataforma</Text>
              <Text style={styles.planExampleValue}>{money(simulacaoRepasse.plataforma)}</Text>
            </View>
            <View style={styles.planExampleRow}>
              <Text style={styles.planExampleLabel}>Seu repasse</Text>
              <Text style={[styles.planExampleValue, styles.planExampleValueHighlight]}>
                {money(simulacaoRepasse.profissional)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.upgradeButton}
            onPress={() => router.push("/(profissional)/(internas)/assinatura")}
          >
            <Text style={styles.upgradeButtonTitle}>Melhorar meu plano</Text>
            <Text style={styles.upgradeButtonSub}>Reduza comissão e libere mais vantagens comerciais.</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Indicadores financeiros</Text>
      <View style={styles.grid}>
        <MetricCard label="Comissões pagas" value={String(comissoesPagas)} color="#e5e7eb" />
        <MetricCard label="Comissões pendentes" value={String(comissoesPendentes)} color="#facc15" />
        <MetricCard label="Ticket médio (pago)" value={money(ticketMedioPago)} color="#e5e7eb" />
        <MetricCard label="Volume total em comissões" value={money(volumeTotalComissoes)} color="#38bdf8" />
        <MetricCard label="Entradas no extrato" value={money(entradasExtrato)} color="#22c55e" />
        <MetricCard label="Saídas no extrato" value={money(saidasExtrato)} color="#fca5a5" />
      </View>

      <Text style={styles.sectionTitle}>Pagamentos recentes</Text>
      <Text style={styles.periodLabel}>Período: {periodoComissoes}</Text>
      {comissoes.length === 0 ? (
        <Text style={styles.empty}>Nenhum pagamento ainda.</Text>
      ) : (
        comissoes.slice(0, 5).map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: isPagamentoAprovado(item) ? "#22c55e" : "#facc15" }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tipo}>Pagamento {labelStatusPagamento(item)}</Text>
              <Text style={styles.paymentTotal}>
                Venda: {money(Number(item.valor_total || 0))} • Seu repasse: {money(Number(item.valor_profissional || 0))}
              </Text>
              <Text style={styles.desc}>
                Profissional: {money(Number(item.valor_profissional || 0))} • Plataforma: {money(Number(item.valor_comissao || 0))}
              </Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleString("pt-BR")}</Text>
            </View>
            <Text style={[styles.valor, { color: "#22c55e" }]}>{money(Number(item.valor_profissional || 0))}</Text>
          </View>
        ))
      )}

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Últimas movimentações</Text>
      <Text style={styles.periodLabel}>Período: {periodoExtrato}</Text>
      {extrato.length === 0 ? (
        <Text style={styles.empty}>Nenhuma movimentação ainda.</Text>
      ) : (
        extrato.slice(0, 8).map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: getTipoColor(item.tipo) }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tipo}>{item.tipo}</Text>
              <Text style={styles.desc}>{item.descricao || "Sem descrição"}</Text>
            </View>
            <Text style={[styles.valor, { color: getTipoColor(item.tipo) }]}>{money(item.valor)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function ResumoLine({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.resumeLine}>
      <Text style={styles.resumeLabel}>{label}</Text>
      <Text style={[styles.resumeValue, { color }]}>{value}</Text>
    </View>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a" },
  content: { padding: 16, paddingBottom: 120 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#03040a" },
  heroCard: {
    backgroundColor: "#081121",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  heroIconText: {
    color: "#0B0F1A",
    fontWeight: "900",
    fontSize: 15,
  },
  heroCopy: {
    flex: 1,
  },
  eyebrow: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  heroText: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 20,
  },
  updatedAt: {
    color: "#9ca3af",
    marginTop: 6,
  },
  resumeCard: {
    backgroundColor: "#081121",
    borderColor: "#26466f",
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  resumeLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resumeLabel: {
    color: "#cbd5e1",
    fontWeight: "700",
    fontSize: 16,
  },
  resumeValue: {
    fontWeight: "900",
    fontSize: 17,
  },
  planCard: {
    backgroundColor: "#081121",
    borderColor: "#26466f",
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  planTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 6,
  },
  planText: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 20,
  },
  planExampleCard: {
    marginTop: 12,
    backgroundColor: "#0c172d",
    borderColor: "#304767",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  planExampleTitle: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 12,
  },
  planExampleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  planExampleLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },
  planExampleValue: {
    color: "#e2e8f0",
    fontWeight: "900",
    fontSize: 13,
  },
  planExampleValueHighlight: {
    color: "#facc15",
  },
  upgradeButton: {
    marginTop: 12,
    backgroundColor: "#111827",
    borderColor: "#facc15",
    borderWidth: 1,
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
  sectionTitle: {
    color: "#e5e7eb",
    fontWeight: "900",
    fontSize: 20,
    marginTop: 8,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#081121",
    borderColor: "#26466f",
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    minHeight: 108,
  },
  metricLabel: {
    color: "#9ca3af",
    fontSize: 15,
  },
  metricValue: {
    fontWeight: "900",
    fontSize: 40 > 18 ? 18 : 18,
    marginTop: 6,
  },
  periodLabel: {
    color: "#6b7280",
    marginBottom: 8,
    fontSize: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#081121",
    borderColor: "#26466f",
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tipo: {
    color: "#e5e7eb",
    fontWeight: "900",
  },
  desc: {
    color: "#9ca3af",
    marginTop: 2,
    fontSize: 12,
  },
  paymentTotal: {
    color: "#e2e8f0",
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
  },
  date: {
    color: "#6b7280",
    marginTop: 4,
    fontSize: 11,
  },
  valor: {
    fontWeight: "900",
  },
  empty: {
    color: "#6b7280",
    textAlign: "center",
    marginVertical: 10,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 24,
  },
});
