import {
  atualizarStatusPousadaAdmin,
  atualizarChamadoAdmin,
  carregarAdminHospedagens,
  formatMoney,
  type CaminhoHospedagemChamado,
  type HospedagensAdminData,
  type HospedagensAdminPousada,
  type HospedagensAdminReserva,
} from "@/lib/caminhosHospedagens";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AdminTab = "resumo" | "pousadas" | "reservas" | "financeiro" | "suporte";

const TABS: { key: AdminTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "resumo", label: "Resumo", icon: "grid-outline" },
  { key: "pousadas", label: "Pousadas", icon: "business-outline" },
  { key: "reservas", label: "Reservas", icon: "calendar-outline" },
  { key: "financeiro", label: "Financeiro", icon: "wallet-outline" },
  { key: "suporte", label: "Suporte", icon: "help-buoy-outline" },
];

function statusColor(status: string) {
  if (status === "aprovada" || status === "confirmada" || status === "aprovada") return "#0F6B4F";
  if (status === "pendente" || status === "aguardando_pagamento") return "#A16207";
  if (status === "suspensa" || status.includes("cancelada") || status === "recusada") return "#B91C1C";
  return "#12372A";
}

export default function HospedagensAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<AdminTab>("resumo");
  const [data, setData] = useState<HospedagensAdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    carregarAdminHospedagens()
      .then((result) => {
        if (mounted) setData(result);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(load);

  async function updatePousada(item: HospedagensAdminPousada, payload: { status?: HospedagensAdminPousada["status"]; visivel?: boolean }) {
    try {
      setSavingId(item.id);
      await atualizarStatusPousadaAdmin(item.id, payload);
      setData((current) => {
        if (!current) return current;
        return {
          ...current,
          pousadas: current.pousadas.map((pousada) => (pousada.id === item.id ? { ...pousada, ...payload } : pousada)),
        };
      });
    } catch (error: any) {
      Alert.alert("Atenção", error?.message || "Não foi possível atualizar a pousada.");
    } finally {
      setSavingId(null);
    }
  }

  async function updateChamado(item: CaminhoHospedagemChamado, payload: Partial<Pick<CaminhoHospedagemChamado, "status" | "prioridade" | "respostaAdmin" | "decisao">>) {
    try {
      setSavingId(item.id);
      await atualizarChamadoAdmin(item.id, payload);
      setData((current) => {
        if (!current) return current;
        return {
          ...current,
          chamados: current.chamados.map((chamado) => (chamado.id === item.id ? { ...chamado, ...payload } : chamado)),
        };
      });
    } catch (error: any) {
      Alert.alert("Atenção", error?.message || "Não foi possível atualizar o chamado.");
    } finally {
      setSavingId(null);
    }
  }

  if (loading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#12372A" size="large" />
        <Text style={styles.loadingText}>Carregando painel administrativo...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#12372A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Admin marketplace</Text>
          <Text style={styles.title}>Hospedagens Caminhos da Fé</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Operação do marketplace</Text>
        <Text style={styles.heroTitle}>{formatMoney(data.metrics.gmv)} em GMV monitorado</Text>
        <Text style={styles.heroText}>Acompanhe pousadas, reservas, comissões, repasses e pendências antes da produção.</Text>
      </View>

      <View style={styles.sourceNotice}>
        <Ionicons name="cloud-done-outline" size={17} color="#12372A" />
        <Text style={styles.sourceNoticeText}>Dados conectados ao Supabase dedicado.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map((item) => (
          <Pressable key={item.key} style={[styles.tab, tab === item.key && styles.tabActive]} onPress={() => setTab(item.key)}>
            <Ionicons name={item.icon} size={17} color={tab === item.key ? "#F7D58B" : "#12372A"} />
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.scrollHint}>
        <Text style={styles.scrollHintText}>Deslize para ver todas as áreas</Text>
        <Ionicons name="chevron-forward" size={15} color="#4E7C59" />
      </View>

      {tab === "resumo" ? <ResumoTab data={data} /> : null}
      {tab === "pousadas" ? <PousadasTab pousadas={data.pousadas} savingId={savingId} onUpdate={updatePousada} /> : null}
      {tab === "reservas" ? <ReservasTab reservas={data.reservas} /> : null}
      {tab === "financeiro" ? <FinanceiroTab data={data} /> : null}
      {tab === "suporte" ? <SuporteTab chamados={data.chamados} savingId={savingId} onUpdate={updateChamado} /> : null}
    </ScrollView>
  );
}

function ResumoTab({ data }: { data: HospedagensAdminData }) {
  return (
    <View style={styles.stack}>
      <View style={styles.kpiGrid}>
        <Kpi label="Pousadas" value={String(data.metrics.pousadas)} icon="business-outline" />
        <Kpi label="Pendentes" value={String(data.metrics.pousadasPendentes)} icon="hourglass-outline" />
        <Kpi label="Reservas" value={String(data.metrics.reservas)} icon="calendar-outline" />
        <Kpi label="Comissão" value={formatMoney(data.metrics.comissao)} icon="pricetag-outline" />
      </View>
      <View style={styles.card}>
        <SectionTitle title="Ações administrativas" icon="flash-outline" />
        <Action label="Aprovar pousadas pendentes" detail={`${data.metrics.pousadasPendentes} cadastro(s) aguardando validação.`} tone="#A16207" />
        <Action label="Revisar pagamentos" detail={`${data.reservas.filter((item) => item.statusPagamento === "pendente").length} reserva(s) com sinal pendente.`} tone="#12372A" />
        <Action label="Monitorar cancelamentos" detail={`${data.metrics.canceladas} reserva(s) cancelada(s) no período.`} tone="#B91C1C" />
        <Action label="Responder suporte" detail={`${data.chamados.filter((item) => !["resolvido", "fechado"].includes(item.status)).length} chamado(s) em aberto.`} tone="#0F6B4F" />
      </View>
    </View>
  );
}

function SuporteTab({
  chamados,
  savingId,
  onUpdate,
}: {
  chamados: CaminhoHospedagemChamado[];
  savingId: string | null;
  onUpdate: (item: CaminhoHospedagemChamado, payload: Partial<Pick<CaminhoHospedagemChamado, "status" | "prioridade" | "respostaAdmin" | "decisao">>) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  return (
    <View style={styles.stack}>
      {chamados.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.titulo}</Text>
              <Text style={styles.cardMeta}>{item.papelAbertura} • {item.tipo} • {item.prioridade}</Text>
            </View>
            <Badge label={item.status} color={statusColor(item.status)} />
          </View>
          <Text style={styles.note}>{item.descricao}</Text>
          {item.respostaAdmin ? <Text style={styles.answer}>Resposta atual: {item.respostaAdmin}</Text> : null}
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Resposta administrativa ou decisão do caso"
            placeholderTextColor="#8A7B61"
            value={drafts[item.id] ?? item.respostaAdmin}
            onChangeText={(value) => setDrafts((current) => ({ ...current, [item.id]: value }))}
          />
          <View style={styles.actionRow}>
            <Pressable style={styles.primaryButton} disabled={savingId === item.id} onPress={() => onUpdate(item, { status: "em_analise", respostaAdmin: drafts[item.id] ?? item.respostaAdmin })}>
              <Text style={styles.primaryButtonText}>Em análise</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} disabled={savingId === item.id} onPress={() => onUpdate(item, { status: "aguardando_resposta", respostaAdmin: drafts[item.id] ?? item.respostaAdmin })}>
              <Text style={styles.secondaryButtonText}>Aguardar</Text>
            </Pressable>
            <Pressable style={styles.resolveButton} disabled={savingId === item.id} onPress={() => onUpdate(item, { status: "resolvido", respostaAdmin: drafts[item.id] ?? item.respostaAdmin, decisao: drafts[item.id] ?? item.decisao })}>
              <Text style={styles.resolveButtonText}>Resolver</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function PousadasTab({
  pousadas,
  savingId,
  onUpdate,
}: {
  pousadas: HospedagensAdminPousada[];
  savingId: string | null;
  onUpdate: (item: HospedagensAdminPousada, payload: { status?: HospedagensAdminPousada["status"]; visivel?: boolean }) => void;
}) {
  return (
    <View style={styles.stack}>
      {pousadas.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.nome}</Text>
              <Text style={styles.cardMeta}>{item.cidade} - {item.uf} • {item.quartos} quarto(s)</Text>
            </View>
            <Badge label={item.status} color={statusColor(item.status)} />
          </View>
          <InfoRow label="Publicada no app" value={item.visivel ? "Sim" : "Não"} />
          <InfoRow label="Split" value={item.gatewayStatus} />
          <View style={styles.actionRow}>
            <Pressable style={styles.primaryButton} disabled={savingId === item.id} onPress={() => onUpdate(item, { status: "aprovada", visivel: true })}>
              {savingId === item.id ? <ActivityIndicator color="#12372A" /> : <Text style={styles.primaryButtonText}>Aprovar</Text>}
            </Pressable>
            <Pressable style={styles.secondaryButton} disabled={savingId === item.id} onPress={() => onUpdate(item, { visivel: !item.visivel })}>
              <Text style={styles.secondaryButtonText}>{item.visivel ? "Pausar" : "Publicar"}</Text>
            </Pressable>
            <Pressable style={styles.dangerButton} disabled={savingId === item.id} onPress={() => onUpdate(item, { status: "suspensa", visivel: false })}>
              <Text style={styles.dangerButtonText}>Suspender</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function ReservasTab({ reservas }: { reservas: HospedagensAdminReserva[] }) {
  return (
    <View style={styles.stack}>
      {reservas.map((item) => (
        <ReservaCard key={item.id} item={item} />
      ))}
    </View>
  );
}

function FinanceiroTab({ data }: { data: HospedagensAdminData }) {
  async function exportCsv() {
    const header = "reserva;pousada;cliente;checkin;status;pagamento;total;sinal;comissao;repasse";
    const rows = data.reservas.map((item) =>
      [
        item.id,
        item.hospedagemNome,
        item.cliente,
        item.checkin,
        item.status,
        item.statusPagamento,
        item.total,
        item.sinal,
        item.comissao,
        item.repasseInicial,
      ].map((value) => String(value).replace(/;/g, ",")).join(";"),
    );
    await Share.share({
      title: "Exportação Hospedagens Caminhos da Fé",
      message: [header, ...rows].join("\n"),
    });
  }

  return (
    <View style={styles.stack}>
      <View style={styles.kpiGrid}>
        <Kpi label="GMV" value={formatMoney(data.metrics.gmv)} icon="trending-up-outline" />
        <Kpi label="Sinais" value={formatMoney(data.metrics.sinais)} icon="card-outline" />
        <Kpi label="Comissão" value={formatMoney(data.metrics.comissao)} icon="cash-outline" />
        <Kpi label="Repasse" value={formatMoney(data.metrics.repasse)} icon="swap-horizontal-outline" />
      </View>
      <View style={styles.card}>
        <SectionTitle title="Conciliação" icon="analytics-outline" />
        <Pressable style={styles.primaryButton} onPress={exportCsv}>
          <Text style={styles.primaryButtonText}>Exportar CSV financeiro</Text>
        </Pressable>
        {data.reservas.slice(0, 8).map((item) => (
          <View key={item.id} style={styles.compact}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleSmall}>{item.hospedagemNome}</Text>
              <Text style={styles.cardMeta}>{item.statusPagamento} • {item.checkin}</Text>
            </View>
            <Text style={styles.compactValue}>{formatMoney(item.comissao)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReservaCard({ item }: { item: HospedagensAdminReserva }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.hospedagemNome}</Text>
          <Text style={styles.cardMeta}>{item.cliente} • {item.quarto}</Text>
        </View>
        <Badge label={item.status} color={statusColor(item.status)} />
      </View>
      <InfoRow label="Check-in" value={item.checkin} />
      <InfoRow label="Pagamento" value={item.statusPagamento} />
      <InfoRow label="Total" value={formatMoney(item.total)} />
      <InfoRow label="Comissão" value={formatMoney(item.comissao)} />
      <InfoRow label="Repasse inicial" value={formatMoney(item.repasseInicial)} />
    </View>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.kpi}>
      <Ionicons name={icon} size={19} color="#F7D58B" />
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, icon }: { title: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={20} color="#12372A" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function Action({ label, detail, tone }: { label: string; detail: string; tone: string }) {
  return (
    <View style={styles.actionItem}>
      <View style={[styles.actionDot, { backgroundColor: tone }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitleSmall}>{label}</Text>
        <Text style={styles.cardMeta}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  content: { padding: 16, gap: 16, paddingBottom: 36 },
  center: { flex: 1, backgroundColor: "#F7F0DF", alignItems: "center", justifyContent: "center", padding: 20, gap: 12 },
  loadingText: { color: "#12372A", fontWeight: "900" },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  eyebrow: { color: "#4E7C59", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#12372A", fontSize: 23, lineHeight: 29, fontWeight: "900" },
  hero: { backgroundColor: "#12372A", borderRadius: 8, padding: 16, gap: 6 },
  heroLabel: { color: "#F7D58B", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  heroTitle: { color: "#FFF9EA", fontSize: 22, lineHeight: 28, fontWeight: "900" },
  heroText: { color: "#E5D9BD", lineHeight: 20 },
  sourceNotice: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF9EA", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 12 },
  sourceNoticeText: { color: "#12372A", fontWeight: "800", flex: 1, lineHeight: 19 },
  tabs: { gap: 8, paddingRight: 16 },
  scrollHint: { marginTop: -10, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 3 },
  scrollHintText: { color: "#4E7C59", fontSize: 12, fontWeight: "800" },
  tab: { minHeight: 40, borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", backgroundColor: "#FFF9EA", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12 },
  tabActive: { backgroundColor: "#12372A", borderColor: "#12372A" },
  tabText: { color: "#12372A", fontWeight: "900" },
  tabTextActive: { color: "#F7D58B" },
  stack: { gap: 14 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpi: { width: "48.5%", minHeight: 112, backgroundColor: "#12372A", borderRadius: 8, padding: 14, gap: 6 },
  kpiValue: { color: "#FFF9EA", fontSize: 19, fontWeight: "900" },
  kpiLabel: { color: "#E5D9BD", fontSize: 12, fontWeight: "800" },
  card: { backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 14, gap: 12 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { color: "#12372A", fontSize: 18, fontWeight: "900", flex: 1 },
  cardHeader: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  cardTitle: { color: "#12372A", fontSize: 17, fontWeight: "900" },
  cardTitleSmall: { color: "#12372A", fontSize: 15, fontWeight: "900" },
  cardMeta: { color: "#6B7280", lineHeight: 19, marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  badgeText: { color: "#FFF9EA", fontSize: 11, fontWeight: "900" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  infoLabel: { color: "#6B7280", flex: 1 },
  infoValue: { color: "#12372A", fontWeight: "900", textAlign: "right" },
  actionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  primaryButton: { minHeight: 40, borderRadius: 8, backgroundColor: "#F7D58B", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  primaryButtonText: { color: "#12372A", fontWeight: "900" },
  secondaryButton: { minHeight: 40, borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  secondaryButtonText: { color: "#12372A", fontWeight: "900" },
  dangerButton: { minHeight: 40, borderRadius: 8, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  dangerButtonText: { color: "#991B1B", fontWeight: "900" },
  resolveButton: { minHeight: 40, borderRadius: 8, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  resolveButtonText: { color: "#166534", fontWeight: "900" },
  note: { color: "#4B5563", lineHeight: 20, backgroundColor: "#F7F0DF", borderRadius: 8, padding: 10 },
  answer: { color: "#0F6B4F", lineHeight: 20, backgroundColor: "#ECFDF3", borderRadius: 8, padding: 10 },
  textArea: { minHeight: 88, borderRadius: 8, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#E5D9BD", padding: 12, color: "#12372A", textAlignVertical: "top" },
  compact: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: "#E5D9BD", paddingTop: 10 },
  compactValue: { color: "#12372A", fontWeight: "900" },
  actionItem: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  actionDot: { width: 9, height: 9, borderRadius: 5, marginTop: 6 },
});
