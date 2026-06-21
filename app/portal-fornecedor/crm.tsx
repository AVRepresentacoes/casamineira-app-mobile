import PortalShell from "@/components/fornecedor-web/PortalShell";
import { formatCurrencyInputBR, formatMoney, parseCurrencyInputBR } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Etapa = "novo" | "contato" | "proposta" | "ganho" | "perdido";
type Lead = {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  origem?: string | null;
  etapa: Etapa;
  valor_potencial?: number | null;
  observacoes?: string | null;
  created_at: string;
};

const ETAPAS: Etapa[] = ["novo", "contato", "proposta", "ganho", "perdido"];
const ETAPA_META: Record<Etapa, { label: string; color: string }> = {
  novo: { label: "Novo", color: "#38bdf8" },
  contato: { label: "Contato", color: "#a78bfa" },
  proposta: { label: "Proposta", color: "#f59e0b" },
  ganho: { label: "Ganho", color: "#22c55e" },
  perdido: { label: "Perdido", color: "#ef4444" },
};

function nextEtapa(etapa: Etapa): Etapa {
  const idx = ETAPAS.indexOf(etapa);
  if (idx < 0 || idx >= ETAPAS.length - 1) return etapa;
  return ETAPAS[idx + 1];
}

function prevEtapa(etapa: Etapa): Etapa {
  const idx = ETAPAS.indexOf(etapa);
  if (idx <= 0) return etapa;
  return ETAPAS[idx - 1];
}

export default function PortalFornecedorCrm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [origem, setOrigem] = useState("");
  const [valor, setValor] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState<Etapa | "todas">("todas");
  const [metaReceitaMes, setMetaReceitaMes] = useState(formatMoney(50000));
  const [metaConversaoMes, setMetaConversaoMes] = useState("25");
  const [leads, setLeads] = useState<Lead[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("fornecedor_crm_leads")
        .select("id, nome, telefone, email, origem, etapa, valor_potencial, observacoes, created_at")
        .order("created_at", { ascending: false })
        .limit(400);
      setLeads((data as Lead[]) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const leadsFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return leads.filter((lead) => {
      const stageOk = filtroEtapa === "todas" || lead.etapa === filtroEtapa;
      if (!stageOk) return false;
      if (!q) return true;
      const text = `${lead.nome} ${lead.telefone || ""} ${lead.email || ""} ${lead.origem || ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [leads, busca, filtroEtapa]);

  const metrics = useMemo(() => {
    const total = leadsFiltrados.length;
    const ganhos = leadsFiltrados.filter((l) => l.etapa === "ganho").length;
    const perdidos = leadsFiltrados.filter((l) => l.etapa === "perdido").length;
    const emPipeline = leadsFiltrados.filter((l) => ["novo", "contato", "proposta"].includes(l.etapa)).length;
    const valorPipeline = leadsFiltrados
      .filter((l) => ["novo", "contato", "proposta"].includes(l.etapa))
      .reduce((acc, l) => acc + Number(l.valor_potencial || 0), 0);
    const valorGanho = leadsFiltrados
      .filter((l) => l.etapa === "ganho")
      .reduce((acc, l) => acc + Number(l.valor_potencial || 0), 0);
    const fechados = ganhos + perdidos;
    const taxaConversao = fechados > 0 ? (ganhos / fechados) * 100 : 0;
    const pipelineAging = leadsFiltrados.filter((l) => {
      if (!["novo", "contato", "proposta"].includes(l.etapa)) return false;
      const age = Date.now() - new Date(l.created_at).getTime();
      return age > 7 * 24 * 60 * 60 * 1000;
    }).length;
    return { total, ganhos, perdidos, emPipeline, valorPipeline, valorGanho, taxaConversao, pipelineAging };
  }, [leadsFiltrados]);

  const colunas = useMemo(
    () =>
      ETAPAS.map((etapa) => {
        const items = leadsFiltrados
          .filter((l) => l.etapa === etapa)
          .sort((a, b) => Number(b.valor_potencial || 0) - Number(a.valor_potencial || 0));
        const valorTotal = items.reduce((acc, l) => acc + Number(l.valor_potencial || 0), 0);
        return { etapa, items, valorTotal };
      }),
    [leadsFiltrados]
  );

  const funnelData = useMemo(() => {
    const total = Math.max(leadsFiltrados.length, 1);
    return ETAPAS.map((etapa) => {
      const count = leadsFiltrados.filter((l) => l.etapa === etapa).length;
      const pct = (count / total) * 100;
      return { etapa, count, pct };
    });
  }, [leadsFiltrados]);

  const origemRanking = useMemo(() => {
    const map = new Map<string, { count: number; valor: number }>();
    for (const lead of leadsFiltrados) {
      const key = (lead.origem || "Sem origem").trim() || "Sem origem";
      const prev = map.get(key) || { count: 0, valor: 0 };
      prev.count += 1;
      prev.valor += Number(lead.valor_potencial || 0);
      map.set(key, prev);
    }
    return Array.from(map.entries())
      .map(([origemNome, data]) => ({ origemNome, ...data }))
      .sort((a, b) => b.count - a.count || b.valor - a.valor)
      .slice(0, 6);
  }, [leadsFiltrados]);

  const previsao = useMemo(() => {
    const agora = new Date();
    const diaAtual = Math.max(agora.getDate(), 1);
    const diasNoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
    const ritmoDiario = metrics.valorGanho / diaAtual;
    const projecaoRitmo = ritmoDiario * diasNoMes;
    const ganhoEsperadoPipeline = metrics.valorPipeline * (metrics.taxaConversao / 100) * 0.75;
    const previsaoFechamento = projecaoRitmo + ganhoEsperadoPipeline;
    const metaReceita = parseCurrencyInputBR(metaReceitaMes);
    const metaConversao = Number(String(metaConversaoMes || "0").replace(",", ".")) || 0;
    const pctMetaReceita = metaReceita > 0 ? (previsaoFechamento / metaReceita) * 100 : 0;
    const gapReceita = metaReceita - previsaoFechamento;
    const gapConversao = metaConversao - metrics.taxaConversao;
    return {
      diaAtual,
      diasNoMes,
      previsaoFechamento,
      ritmoDiario,
      metaReceita,
      metaConversao,
      pctMetaReceita,
      gapReceita,
      gapConversao,
    };
  }, [metrics, metaReceitaMes, metaConversaoMes]);

  const slaAlerts = useMemo(() => {
    const now = Date.now();
    return leads
      .filter((l) => ["novo", "contato", "proposta"].includes(l.etapa))
      .map((lead) => {
        const ageDays = Math.floor((now - new Date(lead.created_at).getTime()) / (24 * 60 * 60 * 1000));
        let nivel: "alto" | "medio" | "baixo" = "baixo";
        if (ageDays >= 14) nivel = "alto";
        else if (ageDays >= 7) nivel = "medio";
        return { ...lead, ageDays, nivel };
      })
      .filter((l) => l.ageDays >= 7)
      .sort((a, b) => b.ageDays - a.ageDays || Number(b.valor_potencial || 0) - Number(a.valor_potencial || 0))
      .slice(0, 8);
  }, [leads]);

  async function criarLead() {
    if (!nome.trim()) return Alert.alert("Atenção", "Nome do lead é obrigatório.");
    try {
      setSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) throw new Error("Usuário não autenticado.");
      const { data: tenantId, error: tenantError } = await supabase.rpc("current_tenant_id");
      if (tenantError || !tenantId) throw new Error("Tenant ativo não encontrado.");

      const valorNum = parseCurrencyInputBR(valor);
      const { error } = await supabase.from("fornecedor_crm_leads").insert({
        tenant_id: tenantId,
        fornecedor_id: uid,
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        origem: origem.trim() || null,
        etapa: "novo",
        valor_potencial: Number.isFinite(valorNum) && valorNum > 0 ? valorNum : null,
      });
      if (error) throw error;
      setNome("");
      setTelefone("");
      setEmail("");
      setOrigem("");
      setValor("");
      await carregar();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao criar lead.");
    } finally {
      setSaving(false);
    }
  }

  async function avancar(lead: Lead) {
    await mover(lead, nextEtapa(lead.etapa));
  }

  async function voltar(lead: Lead) {
    await mover(lead, prevEtapa(lead.etapa));
  }

  async function mover(lead: Lead, etapa: Etapa) {
    if (lead.etapa === etapa) return;
    try {
      setBusyId(lead.id);
      const { error } = await supabase.from("fornecedor_crm_leads").update({ etapa }).eq("id", lead.id);
      if (error) throw error;
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, etapa } : l)));
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao atualizar etapa.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PortalShell title="CRM Enterprise" subtitle="Gestão comercial em padrão de empresa gigante">
      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#22c55e" /></View>
      ) : (
        <>
          <View style={styles.kpiRow}>
            <Kpi label="Leads totais" value={String(metrics.total)} color="#f8fafc" />
            <Kpi label="No pipeline" value={String(metrics.emPipeline)} color="#38bdf8" />
            <Kpi label="Ganhos" value={String(metrics.ganhos)} color="#22c55e" />
            <Kpi label="Perdidos" value={String(metrics.perdidos)} color="#ef4444" />
            <Kpi label="Taxa de conversão" value={`${metrics.taxaConversao.toFixed(1)}%`} color="#facc15" />
            <Kpi label="Valor pipeline" value={formatMoney(metrics.valorPipeline)} color="#facc15" />
            <Kpi label="Valor ganho" value={formatMoney(metrics.valorGanho)} color="#22c55e" />
            <Kpi label="Leads parados +7d" value={String(metrics.pipelineAging)} color={metrics.pipelineAging > 0 ? "#ef4444" : "#22c55e"} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Novo lead</Text>
            <View style={styles.row}>
              <TextInput style={[styles.input, { minWidth: 220, flex: 1 }]} placeholder="Nome" placeholderTextColor="#64748b" value={nome} onChangeText={setNome} />
              <TextInput style={[styles.input, { minWidth: 170 }]} placeholder="Telefone" placeholderTextColor="#64748b" value={telefone} onChangeText={setTelefone} />
              <TextInput style={[styles.input, { minWidth: 220, flex: 1 }]} placeholder="E-mail" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} />
              <TextInput style={[styles.input, { minWidth: 160 }]} placeholder="Origem" placeholderTextColor="#64748b" value={origem} onChangeText={setOrigem} />
              <TextInput style={[styles.input, { width: 140 }]} placeholder="Valor" placeholderTextColor="#64748b" keyboardType="decimal-pad" value={valor} onChangeText={(t) => setValor(formatCurrencyInputBR(t))} />
              <TouchableOpacity style={styles.primaryBtn} onPress={() => void criarLead()} disabled={saving}>
                {saving ? <ActivityIndicator color="#022c22" /> : <Text style={styles.primaryText}>Salvar lead</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Filtro e busca</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { minWidth: 240, flex: 1 }]}
                placeholder="Buscar por nome, e-mail, telefone ou origem"
                placeholderTextColor="#64748b"
                value={busca}
                onChangeText={setBusca}
              />
              <View style={styles.filterRow}>
                <StageChip label="Todas" color="#94a3b8" active={filtroEtapa === "todas"} onPress={() => setFiltroEtapa("todas")} />
                {ETAPAS.map((etapa) => (
                  <StageChip
                    key={etapa}
                    label={ETAPA_META[etapa].label}
                    color={ETAPA_META[etapa].color}
                    active={filtroEtapa === etapa}
                    onPress={() => setFiltroEtapa(etapa)}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pipeline Kanban</Text>
            {leadsFiltrados.length === 0 ? (
              <Text style={styles.empty}>Sem leads cadastrados.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.kanbanRow}>
                  {colunas.map((col) => (
                    <View key={col.etapa} style={styles.kanbanCol}>
                      <View style={styles.kanbanHead}>
                        <Text style={[styles.kanbanTitle, { color: ETAPA_META[col.etapa].color }]}>{ETAPA_META[col.etapa].label}</Text>
                        <Text style={styles.kanbanMeta}>{col.items.length} • {formatMoney(col.valorTotal)}</Text>
                      </View>
                      {col.items.length === 0 ? (
                        <Text style={styles.emptyCol}>Sem leads</Text>
                      ) : (
                        col.items.map((lead) => (
                          <View key={lead.id} style={styles.leadCard}>
                            <Text style={styles.itemTitle}>{lead.nome}</Text>
                            <Text style={styles.itemMeta}>
                              {lead.telefone || "Sem telefone"} • {lead.email || "Sem e-mail"}
                            </Text>
                            <Text style={styles.itemMeta}>
                              Origem: {lead.origem || "Livre"} • {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                            </Text>
                            <View style={styles.leadFooter}>
                              <Text style={styles.value}>{formatMoney(Number(lead.valor_potencial || 0))}</Text>
                              <View style={styles.actionsRow}>
                                <TouchableOpacity style={styles.secondaryBtn} onPress={() => void voltar(lead)} disabled={busyId === lead.id}>
                                  <Text style={styles.secondaryText}>◀</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.secondaryBtn} onPress={() => void avancar(lead)} disabled={busyId === lead.id}>
                                  {busyId === lead.id ? <ActivityIndicator size="small" color="#cbd5e1" /> : <Text style={styles.secondaryText}>▶</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.successBtn} onPress={() => void mover(lead, "ganho")} disabled={busyId === lead.id}>
                                  <Text style={styles.successText}>Ganho</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.dangerBtn} onPress={() => void mover(lead, "perdido")} disabled={busyId === lead.id}>
                                  <Text style={styles.dangerText}>Perdido</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Inteligência Comercial</Text>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsBlock}>
                <Text style={styles.analyticsTitle}>Funil de etapas</Text>
                {funnelData.map((item) => (
                  <View key={item.etapa} style={styles.barRow}>
                    <View style={styles.barHeader}>
                      <Text style={styles.barLabel}>{ETAPA_META[item.etapa].label}</Text>
                      <Text style={styles.barValue}>{item.count} ({item.pct.toFixed(1)}%)</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${Math.max(item.pct, 2)}%`, backgroundColor: ETAPA_META[item.etapa].color }]} />
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.analyticsBlock}>
                <Text style={styles.analyticsTitle}>Top origens de lead</Text>
                {origemRanking.length === 0 ? (
                  <Text style={styles.emptyCol}>Sem dados</Text>
                ) : (
                  origemRanking.map((item) => {
                    const maxCount = origemRanking[0]?.count || 1;
                    const width = (item.count / maxCount) * 100;
                    return (
                      <View key={item.origemNome} style={styles.barRow}>
                        <View style={styles.barHeader}>
                          <Text style={styles.barLabel}>{item.origemNome}</Text>
                          <Text style={styles.barValue}>{item.count} • {formatMoney(item.valor)}</Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${Math.max(width, 4)}%`, backgroundColor: "#38bdf8" }]} />
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Cockpit Executivo</Text>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsBlock}>
                <Text style={styles.analyticsTitle}>Metas e previsão do mês</Text>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { width: 170 }]}
                    placeholder="Meta de receita"
                    placeholderTextColor="#64748b"
                    keyboardType="decimal-pad"
                    value={metaReceitaMes}
                    onChangeText={(t) => setMetaReceitaMes(formatCurrencyInputBR(t))}
                  />
                  <TextInput
                    style={[styles.input, { width: 150 }]}
                    placeholder="Meta conversão %"
                    placeholderTextColor="#64748b"
                    keyboardType="decimal-pad"
                    value={metaConversaoMes}
                    onChangeText={setMetaConversaoMes}
                  />
                </View>

                <View style={styles.execGrid}>
                  <View style={styles.execItem}>
                    <Text style={styles.execLabel}>Projeção de fechamento</Text>
                    <Text style={styles.execValue}>{formatMoney(previsao.previsaoFechamento)}</Text>
                  </View>
                  <View style={styles.execItem}>
                    <Text style={styles.execLabel}>Ritmo diário médio</Text>
                    <Text style={styles.execValue}>{formatMoney(previsao.ritmoDiario)}</Text>
                  </View>
                  <View style={styles.execItem}>
                    <Text style={styles.execLabel}>Atingimento da meta</Text>
                    <Text style={[styles.execValue, { color: previsao.pctMetaReceita >= 100 ? "#22c55e" : "#f59e0b" }]}>
                      {previsao.pctMetaReceita.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.execItem}>
                    <Text style={styles.execLabel}>Gap de receita</Text>
                    <Text style={[styles.execValue, { color: previsao.gapReceita <= 0 ? "#22c55e" : "#ef4444" }]}>
                      {previsao.gapReceita <= 0 ? "Meta superada" : formatMoney(previsao.gapReceita)}
                    </Text>
                  </View>
                  <View style={styles.execItem}>
                    <Text style={styles.execLabel}>Gap de conversão</Text>
                    <Text style={[styles.execValue, { color: previsao.gapConversao <= 0 ? "#22c55e" : "#ef4444" }]}>
                      {previsao.gapConversao <= 0 ? "Meta batida" : `${previsao.gapConversao.toFixed(1)} p.p.`}
                    </Text>
                  </View>
                  <View style={styles.execItem}>
                    <Text style={styles.execLabel}>Janela do mês</Text>
                    <Text style={styles.execValue}>{previsao.diaAtual}/{previsao.diasNoMes}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.analyticsBlock}>
                <Text style={styles.analyticsTitle}>Alertas de SLA (lead esfriando)</Text>
                {slaAlerts.length === 0 ? (
                  <Text style={styles.emptyCol}>Nenhum lead crítico no momento</Text>
                ) : (
                  slaAlerts.map((item) => (
                    <View key={item.id} style={styles.alertRow}>
                      <View style={[styles.alertDot, item.nivel === "alto" ? styles.alertHigh : item.nivel === "medio" ? styles.alertMedium : styles.alertLow]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.alertTitle}>{item.nome}</Text>
                        <Text style={styles.alertMeta}>
                          {ETAPA_META[item.etapa].label} • {item.ageDays} dias sem avanço • {formatMoney(Number(item.valor_potencial || 0))}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.secondaryBtn} onPress={() => void avancar(item)}>
                        <Text style={styles.secondaryText}>Avançar</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
        </>
      )}
    </PortalShell>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    </View>
  );
}

function StageChip({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.stageChip, active ? { borderColor: color, backgroundColor: "#111827" } : null]} onPress={onPress}>
      <View style={[styles.stageDot, { backgroundColor: color }]} />
      <Text style={[styles.stageText, active ? { color: "#f8fafc" } : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: "center", justifyContent: "center" },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  kpi: { flex: 1, minWidth: 190, backgroundColor: "#0b1220", borderRadius: 12, borderWidth: 1, borderColor: "#1f2937", padding: 10 },
  kpiLabel: { color: "#94a3b8", fontWeight: "700", fontSize: 12 },
  kpiValue: { marginTop: 6, fontSize: 18, fontWeight: "900" },
  card: { backgroundColor: "#0b1220", borderColor: "#1f2937", borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  sectionTitle: { color: "#e2e8f0", fontWeight: "900", fontSize: 15, marginBottom: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  input: { backgroundColor: "#0f172a", borderColor: "#334155", borderWidth: 1, borderRadius: 10, color: "#f8fafc", fontWeight: "700", paddingHorizontal: 10, paddingVertical: 9 },
  primaryBtn: { backgroundColor: "#22c55e", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#022c22", fontWeight: "900", fontSize: 12 },
  empty: { color: "#94a3b8", textAlign: "center", fontWeight: "700", paddingVertical: 10 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  stageChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  stageDot: { width: 8, height: 8, borderRadius: 999 },
  stageText: { color: "#94a3b8", fontWeight: "800", fontSize: 11 },
  kanbanRow: { flexDirection: "row", gap: 10 },
  kanbanCol: {
    width: 330,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  kanbanHead: { borderBottomWidth: 1, borderBottomColor: "#1f2937", paddingBottom: 8 },
  kanbanTitle: { fontWeight: "900", fontSize: 14 },
  kanbanMeta: { color: "#94a3b8", fontWeight: "700", marginTop: 2, fontSize: 11 },
  emptyCol: { color: "#64748b", fontWeight: "700", paddingVertical: 12, textAlign: "center" },
  leadCard: { backgroundColor: "#111827", borderWidth: 1, borderColor: "#334155", borderRadius: 10, padding: 10, gap: 4 },
  itemTitle: { color: "#f8fafc", fontWeight: "800" },
  itemMeta: { color: "#94a3b8", fontSize: 11, marginTop: 2, fontWeight: "700" },
  leadFooter: { marginTop: 6, gap: 8 },
  value: { color: "#22c55e", fontWeight: "900", fontSize: 13 },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  secondaryBtn: { backgroundColor: "#172036", borderColor: "#334155", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  secondaryText: { color: "#cbd5e1", fontWeight: "800", fontSize: 11 },
  successBtn: { backgroundColor: "#14532d", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  successText: { color: "#bbf7d0", fontWeight: "900", fontSize: 11 },
  dangerBtn: { backgroundColor: "#7f1d1d", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  dangerText: { color: "#fecaca", fontWeight: "900", fontSize: 11 },
  analyticsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  analyticsBlock: {
    flex: 1,
    minWidth: 320,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  analyticsTitle: { color: "#e2e8f0", fontWeight: "900", fontSize: 13 },
  barRow: { gap: 4 },
  barHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  barLabel: { color: "#cbd5e1", fontWeight: "700", fontSize: 12, flex: 1 },
  barValue: { color: "#94a3b8", fontWeight: "800", fontSize: 11 },
  barTrack: { height: 8, backgroundColor: "#111827", borderRadius: 999, overflow: "hidden", borderWidth: 1, borderColor: "#1f2937" },
  barFill: { height: "100%", borderRadius: 999 },
  execGrid: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  execItem: {
    minWidth: 160,
    flex: 1,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    padding: 10,
  },
  execLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },
  execValue: { marginTop: 6, color: "#f8fafc", fontSize: 14, fontWeight: "900" },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    padding: 10,
  },
  alertDot: { width: 10, height: 10, borderRadius: 999 },
  alertHigh: { backgroundColor: "#ef4444" },
  alertMedium: { backgroundColor: "#f59e0b" },
  alertLow: { backgroundColor: "#38bdf8" },
  alertTitle: { color: "#f8fafc", fontWeight: "800", fontSize: 12 },
  alertMeta: { marginTop: 3, color: "#94a3b8", fontWeight: "700", fontSize: 11 },
});
