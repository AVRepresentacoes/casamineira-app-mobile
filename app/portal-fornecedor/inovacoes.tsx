import PortalShell from "@/components/fornecedor-web/PortalShell";
import { formatMoney } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type PrecoRec = {
  id: string;
  created_at?: string;
  preco_atual: number;
  preco_sugerido: number;
  motivo?: string | null;
  produto_id: string;
  custo_total_unitario?: number | null;
  preco_ponto_equilibrio?: number | null;
  preco_minimo_lucrativo?: number | null;
  margem_pct_sugerida?: number | null;
  lucro_unitario_sugerido?: number | null;
  risco_prejuizo?: boolean | null;
  observacoes?: string | null;
};
type Anomalia = { id: string; created_at?: string; categoria: string; severidade: string; descricao: string; valor_atual?: number | null; valor_referencia?: number | null };
type Churn = { id: string; created_at?: string; score: number; classificacao: string; cliente_id: string };
type Sla = { id: string; created_at?: string; pedido_id: string; risco_atraso_pct: number; recomendacao?: string | null };
type DataRoom = { id: string; receita_30: number; margem_estimada_pct: number; churn_risco_alto_qtd: number; sla_risco_alto_qtd: number; referencia_date: string };
type Integracao = { id: string; created_at?: string; nome: string; provider: string; status: string };
type Execucao = { id: string; evento: string; resultado: string; created_at: string; detalhes?: any };
type PeriodDays = 7 | 30 | 90;

const PERIODS: { label: string; value: PeriodDays }[] = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
];

export default function PortalFornecedorInovacoes() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [voiceCmd, setVoiceCmd] = useState("");
  const [simName, setSimName] = useState("Cenário rápido");
  const [simPrice, setSimPrice] = useState("5");
  const [simConv, setSimConv] = useState("3");
  const [simCost, setSimCost] = useState("2");
  const [simulation, setSimulation] = useState<any>(null);
  const [precos, setPrecos] = useState<PrecoRec[]>([]);
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [churn, setChurn] = useState<Churn[]>([]);
  const [sla, setSla] = useState<Sla[]>([]);
  const [dataRoom, setDataRoom] = useState<DataRoom | null>(null);
  const [integracoes, setIntegracoes] = useState<Integracao[]>([]);
  const [execucoes, setExecucoes] = useState<Execucao[]>([]);
  const [periodDays, setPeriodDays] = useState<PeriodDays>(30);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [precoRes, anomRes, churnRes, slaRes, roomRes, intRes, execRes] = await Promise.all([
        supabase
          .from("fornecedor_precificacao_recomendacoes")
          .select("id, created_at, produto_id, preco_atual, preco_sugerido, motivo, custo_total_unitario, preco_ponto_equilibrio, preco_minimo_lucrativo, margem_pct_sugerida, lucro_unitario_sugerido, risco_prejuizo, observacoes")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("fornecedor_anomalias").select("id, created_at, categoria, severidade, descricao, valor_atual, valor_referencia").order("created_at", { ascending: false }).limit(20),
        supabase.from("fornecedor_churn_scores").select("id, created_at, score, classificacao, cliente_id").order("created_at", { ascending: false }).limit(20),
        supabase.from("fornecedor_sla_predicoes").select("id, created_at, pedido_id, risco_atraso_pct, recomendacao").order("created_at", { ascending: false }).limit(20),
        supabase.from("fornecedor_data_room_metricas").select("id, receita_30, margem_estimada_pct, churn_risco_alto_qtd, sla_risco_alto_qtd, referencia_date").order("created_at", { ascending: false }).limit(1),
        supabase.from("integracao_apps").select("id, created_at, nome, provider, status").order("created_at", { ascending: false }).limit(20),
        supabase.from("fornecedor_workflow_execucoes").select("id, evento, resultado, created_at, detalhes").order("created_at", { ascending: false }).limit(12),
      ]);

      setPrecos((precoRes.data as PrecoRec[]) || []);
      setAnomalias((anomRes.data as Anomalia[]) || []);
      setChurn((churnRes.data as Churn[]) || []);
      setSla((slaRes.data as Sla[]) || []);
      setDataRoom((((roomRes.data as DataRoom[]) || [])[0] as DataRoom) || null);
      setIntegracoes((intRes.data as Integracao[]) || []);
      setExecucoes((execRes.data as Execucao[]) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = useMemo(() => {
    const start = Date.now() - periodDays * 24 * 60 * 60 * 1000;
    const within = (v?: string) => {
      const ms = new Date(String(v || "")).getTime();
      return Number.isFinite(ms) && ms >= start;
    };
    return {
      precos: precos.filter((x) => within(x.created_at)),
      anomalias: anomalias.filter((x) => within(x.created_at)),
      churn: churn.filter((x) => within(x.created_at)),
      sla: sla.filter((x) => within(x.created_at)),
      integracoes: integracoes.filter((x) => within(x.created_at)),
      execucoes: execucoes.filter((x) => within(x.created_at)),
    };
  }, [periodDays, precos, anomalias, churn, sla, integracoes, execucoes]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const kpis = useMemo(() => {
    const deltaPreco = filtered.precos.reduce((acc, p) => acc + (Number(p.preco_sugerido || 0) - Number(p.preco_atual || 0)), 0);
    const riscoPrejuizo = filtered.precos.filter((p) => Boolean(p.risco_prejuizo)).length;
    const churnAlto = filtered.churn.filter((c) => c.classificacao === "alto").length;
    const slaAlto = filtered.sla.filter((s) => Number(s.risco_atraso_pct || 0) >= 70).length;
    return { deltaPreco, riscoPrejuizo, churnAlto, slaAlto };
  }, [filtered]);

  const radar = useMemo(() => {
    const totalRec = Math.max(filtered.precos.length, 1);
    const riscoPct = (kpis.riscoPrejuizo / totalRec) * 100;
    const churnPct = filtered.churn.length > 0 ? (kpis.churnAlto / filtered.churn.length) * 100 : 0;
    const slaPct = filtered.sla.length > 0 ? (kpis.slaAlto / filtered.sla.length) * 100 : 0;
    const coberturaAutomacao = Math.min(100, (filtered.integracoes.filter((i) => i.status === "ativo").length * 25));
    const maturidade = Math.max(0, Math.min(100, 100 - (riscoPct * 0.4 + churnPct * 0.3 + slaPct * 0.3) + coberturaAutomacao * 0.15));
    return { riscoPct, churnPct, slaPct, coberturaAutomacao, maturidade };
  }, [kpis, filtered]);

  const scoreX10 = useMemo(() => {
    const base = radar.maturidade;
    const bonusIntegracoes = Math.min(12, filtered.integracoes.filter((i) => i.status === "ativo").length * 3);
    const penaltyExecFalha = Math.min(15, filtered.execucoes.filter((e) => String(e.resultado || "").toLowerCase() === "erro").length * 2);
    return Math.max(0, Math.min(100, base + bonusIntegracoes - penaltyExecFalha));
  }, [radar.maturidade, filtered]);

  const prioridades = useMemo(() => {
    const items: { id: string; titulo: string; detalhe: string; severidade: "critica" | "alta" | "media"; acao: "diagnostico" | "precos" | "twin" | "integracao" }[] = [];
    if (kpis.slaAlto > 0) {
      items.push({
        id: "sla",
        titulo: "Risco logístico elevado",
        detalhe: `${kpis.slaAlto} pedido(s) com risco SLA >= 70%. Rode diagnóstico e priorize expedição.`,
        severidade: "critica",
        acao: "diagnostico",
      });
    }
    if (kpis.riscoPrejuizo > 0) {
      items.push({
        id: "preco",
        titulo: "Produtos com risco de prejuízo",
        detalhe: `${kpis.riscoPrejuizo} item(ns) abaixo do mínimo lucrativo. Gere novas recomendações de preço.`,
        severidade: "alta",
        acao: "precos",
      });
    }
    if (kpis.churnAlto > 0) {
      items.push({
        id: "churn",
        titulo: "Clientes com alta chance de churn",
        detalhe: `${kpis.churnAlto} cliente(s) em risco alto. Simule cenários e ajuste proposta de valor.`,
        severidade: "alta",
        acao: "twin",
      });
    }
    if (filtered.integracoes.filter((i) => i.status === "ativo").length === 0) {
      items.push({
        id: "integracao",
        titulo: "Baixa automação da operação",
        detalhe: "Nenhuma integração ativa encontrada. Cadastre ao menos uma integração estratégica.",
        severidade: "media",
        acao: "integracao",
      });
    }
    return items.slice(0, 4);
  }, [kpis, filtered.integracoes]);

  async function runPrecos() {
    try {
      setBusy(true);
      const { error } = await supabase.rpc("gerar_precos_dinamicos_fornecedor");
      if (error) throw error;
      await carregar();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao gerar preços dinâmicos.");
    } finally {
      setBusy(false);
    }
  }

  async function runTwin() {
    try {
      setBusy(true);
      const { data, error } = await supabase.rpc("simular_cenario_digital_twin", {
        p_nome: simName,
        p_parametros: {
          price_adjust_pct: Number(simPrice || 0),
          conversion_adjust_pct: Number(simConv || 0),
          cost_adjust_pct: Number(simCost || 0),
        },
      });
      if (error) throw error;
      setSimulation(data);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao simular cenário.");
    } finally {
      setBusy(false);
    }
  }

  async function runVoice() {
    try {
      setBusy(true);
      const { data, error } = await supabase.rpc("executar_comando_voz_fornecedor", { p_comando: voiceCmd || "status geral" });
      if (error) throw error;
      Alert.alert("Resposta do comando", String(data || "OK"));
      setVoiceCmd("");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao executar comando.");
    } finally {
      setBusy(false);
    }
  }

  async function runDiagnostics() {
    try {
      setBusy(true);
      const { data, error } = await supabase.rpc("executar_diagnostico_futurista_fornecedor");
      if (error) throw error;
      await carregar();
      Alert.alert("Diagnóstico concluído", JSON.stringify(data || {}, null, 2));
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao executar diagnóstico.");
    } finally {
      setBusy(false);
    }
  }

  async function runIntegrationDemo() {
    try {
      setBusy(true);
      const { error } = await supabase.rpc("registrar_integracao_app", {
        p_nome: "WhatsApp Cloud",
        p_provider: "meta",
        p_config: { ambiente: "producao" },
      });
      if (error) throw error;
      await carregar();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao registrar integração.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PortalShell title="Inovações X10" subtitle="Camada futurista com IA operacional e analytics avançado">
      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#22c55e" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={styles.periodRow}>
            {PERIODS.map((p) => {
              const active = p.value === periodDays;
              return (
                <TouchableOpacity key={p.value} style={[styles.periodBtn, active ? styles.periodBtnActive : null]} onPress={() => setPeriodDays(p.value)}>
                  <Text style={[styles.periodText, active ? styles.periodTextActive : null]}>{p.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.heroCard}>
            <View>
              <Text style={styles.heroLabel}>Índice Global X10</Text>
              <Text style={styles.heroValue}>{scoreX10.toFixed(0)} / 100</Text>
              <Text style={styles.heroSub}>
                {scoreX10 >= 80 ? "Operação de alta maturidade" : scoreX10 >= 60 ? "Boa evolução, com ajustes pontuais" : "Priorize automação e mitigação de risco"}
              </Text>
            </View>
            <Action label="Rodar ciclo completo" onPress={() => void runDiagnostics()} disabled={busy} />
          </View>

          <View style={styles.kpiRow}>
            <Kpi label="Ajuste agregado preço IA" value={formatMoney(kpis.deltaPreco)} color="#22c55e" />
            <Kpi label="Risco de prejuízo" value={String(kpis.riscoPrejuizo)} color={kpis.riscoPrejuizo > 0 ? "#ef4444" : "#22c55e"} />
            <Kpi label="Churn alto" value={String(kpis.churnAlto)} color="#f97316" />
            <Kpi label="SLA risco alto" value={String(kpis.slaAlto)} color="#ef4444" />
            <Kpi label="Integrações ativas" value={String(filtered.integracoes.filter((i) => i.status === "ativo").length)} color="#38bdf8" />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Radar Executivo de Inovação</Text>
            <View style={styles.radarGrid}>
              <ProgressMetric label="Risco de prejuízo" value={radar.riscoPct} color="#ef4444" invert />
              <ProgressMetric label="Risco de churn" value={radar.churnPct} color="#f97316" invert />
              <ProgressMetric label="Risco SLA" value={radar.slaPct} color="#facc15" invert />
              <ProgressMetric label="Cobertura de automação" value={radar.coberturaAutomacao} color="#38bdf8" />
              <ProgressMetric label="Maturidade X10" value={radar.maturidade} color="#22c55e" />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Prioridades Inteligentes</Text>
            {prioridades.length === 0 ? (
              <Text style={styles.empty}>Sem prioridades críticas no momento. Operação saudável.</Text>
            ) : (
              prioridades.map((item) => (
                <PriorityCard
                  key={item.id}
                  titulo={item.titulo}
                  detalhe={item.detalhe}
                  severidade={item.severidade}
                  onPress={
                    item.acao === "diagnostico"
                      ? () => void runDiagnostics()
                      : item.acao === "precos"
                        ? () => void runPrecos()
                        : item.acao === "twin"
                          ? () => void runTwin()
                          : () => void runIntegrationDemo()
                  }
                  disabled={busy}
                />
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Playbooks rápidos</Text>
            <View style={styles.actions}>
              <Action label="Playbook: Blindar margem" onPress={() => void runPrecos()} disabled={busy} />
              <Action label="Playbook: Recuperar churn" onPress={() => void runTwin()} disabled={busy} />
              <Action label="Playbook: SLA crítico" onPress={() => void runDiagnostics()} disabled={busy} />
              <Action label="Playbook: Ativar integração" onPress={() => void runIntegrationDemo()} disabled={busy} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Orquestrador de inovação</Text>
            <View style={styles.actions}>
              <Action label="1) Preço Dinâmico IA" onPress={() => void runPrecos()} disabled={busy} />
              <Action label="2) Simular Digital Twin" onPress={() => void runTwin()} disabled={busy} />
              <Action label="4-8) Diagnóstico Futurista" onPress={() => void runDiagnostics()} disabled={busy} />
              <Action label="10) Registrar Integração Demo" onPress={() => void runIntegrationDemo()} disabled={busy} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>3) Operação por voz</Text>
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Ex: mostrar contas vencidas" placeholderTextColor="#64748b" value={voiceCmd} onChangeText={setVoiceCmd} />
              <Action label="Executar" onPress={() => void runVoice()} disabled={busy} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>2) Digital Twin - parâmetros</Text>
            <View style={styles.row}>
              <TextInput style={[styles.input, { minWidth: 180 }]} placeholder="Nome do cenário" placeholderTextColor="#64748b" value={simName} onChangeText={setSimName} />
              <TextInput style={[styles.input, { width: 130 }]} placeholder="Preço %" placeholderTextColor="#64748b" value={simPrice} onChangeText={setSimPrice} keyboardType="decimal-pad" />
              <TextInput style={[styles.input, { width: 130 }]} placeholder="Conversão %" placeholderTextColor="#64748b" value={simConv} onChangeText={setSimConv} keyboardType="decimal-pad" />
              <TextInput style={[styles.input, { width: 130 }]} placeholder="Custo %" placeholderTextColor="#64748b" value={simCost} onChangeText={setSimCost} keyboardType="decimal-pad" />
            </View>
            {simulation ? (
              <View style={styles.simBlock}>
                <Text style={styles.meta}>Receita base: {formatMoney(Number(simulation.receita_base_30d || 0))}</Text>
                <Text style={styles.meta}>Receita simulada: {formatMoney(Number(simulation.receita_simulada_30d || 0))}</Text>
                <Text style={styles.meta}>Lucro estimado: {formatMoney(Number(simulation.lucro_estimado || 0))}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>1) Recomendações de preço ({filtered.precos.length})</Text>
            {filtered.precos.slice(0, 8).map((p) => (
              <View key={p.id} style={styles.priceRow}>
                <Text style={styles.meta}>
                  Produto {p.produto_id.slice(0, 8)}: {formatMoney(p.preco_atual)} {"->"} {formatMoney(p.preco_sugerido)}
                </Text>
                <Text style={styles.metaSoft}>
                  Break-even: {formatMoney(Number(p.preco_ponto_equilibrio || 0))} • Mín. lucrativo: {formatMoney(Number(p.preco_minimo_lucrativo || 0))}
                </Text>
                <Text style={styles.metaSoft}>
                  Custo total: {formatMoney(Number(p.custo_total_unitario || 0))} • Lucro un.: {formatMoney(Number(p.lucro_unitario_sugerido || 0))} • Margem: {Number(p.margem_pct_sugerida || 0).toFixed(2)}%
                </Text>
                {p.risco_prejuizo ? <Text style={styles.danger}>ATENCAO: preco atual abaixo do minimo lucrativo.</Text> : null}
                {p.observacoes ? <Text style={styles.warning}>{p.observacoes}</Text> : null}
              </View>
            ))}
            {filtered.precos.length === 0 ? <Text style={styles.empty}>Sem recomendações no período.</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>4) Anomalias detectadas ({filtered.anomalias.length})</Text>
            {filtered.anomalias.slice(0, 8).map((a) => (
              <Text key={a.id} style={styles.meta}>{a.severidade.toUpperCase()} • {a.categoria}: {a.descricao}</Text>
            ))}
            {filtered.anomalias.length === 0 ? <Text style={styles.empty}>Nenhuma anomalia no período.</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>5/6) Churn e SLA</Text>
            <Text style={styles.meta}>Scores de churn: {filtered.churn.length}</Text>
            <Text style={styles.meta}>Predições SLA: {filtered.sla.length}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>8) Data Room</Text>
            {dataRoom ? (
              <>
                <Text style={styles.meta}>Referência: {new Date(dataRoom.referencia_date).toLocaleDateString("pt-BR")}</Text>
                <Text style={styles.meta}>Receita 30d: {formatMoney(Number(dataRoom.receita_30 || 0))}</Text>
                <Text style={styles.meta}>Margem estimada: {Number(dataRoom.margem_estimada_pct || 0).toFixed(2)}%</Text>
              </>
            ) : (
              <Text style={styles.empty}>Sem snapshot de data room.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>10) Ecosystem de integrações</Text>
            {filtered.integracoes.length === 0 ? (
              <Text style={styles.empty}>Nenhuma integração no período.</Text>
            ) : (
              filtered.integracoes.slice(0, 8).map((i) => (
                <View key={i.id} style={styles.integrationRow}>
                  <Text style={styles.meta}>{i.nome} ({i.provider})</Text>
                  <Text
                    style={[
                      styles.integrationStatus,
                      i.status === "ativo" ? styles.integrationOn : i.status === "erro" ? styles.integrationErr : styles.integrationOff,
                    ]}
                  >
                    {i.status.toUpperCase()}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Autopilot - execuções recentes</Text>
            {filtered.execucoes.length === 0 ? (
              <Text style={styles.empty}>Sem execuções no período.</Text>
            ) : (
              filtered.execucoes.map((e) => (
                <View key={e.id} style={styles.execRow}>
                  <Text style={styles.meta}>
                    {new Date(e.created_at).toLocaleString("pt-BR")} • {e.evento}
                  </Text>
                  <Text style={[styles.execResult, String(e.resultado).toLowerCase() === "erro" ? styles.execErr : styles.execOk]}>
                    {String(e.resultado || "ok").toUpperCase()}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
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

function Action({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity style={[styles.action, disabled ? { opacity: 0.6 } : null]} onPress={onPress} disabled={disabled}>
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function ProgressMetric({
  label,
  value,
  color,
  invert = false,
}: {
  label: string;
  value: number;
  color: string;
  invert?: boolean;
}) {
  const safe = Math.max(0, Math.min(100, value));
  const score = invert ? 100 - safe : safe;
  return (
    <View style={styles.metricItem}>
      <View style={styles.metricHead}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={[styles.metricValue, { color }]}>{score.toFixed(0)}%</Text>
      </View>
      <View style={styles.metricTrack}>
        <View style={[styles.metricFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function PriorityCard({
  titulo,
  detalhe,
  severidade,
  onPress,
  disabled,
}: {
  titulo: string;
  detalhe: string;
  severidade: "critica" | "alta" | "media";
  onPress: () => void;
  disabled?: boolean;
}) {
  const tone = severidade === "critica" ? "#ef4444" : severidade === "alta" ? "#f97316" : "#facc15";
  return (
    <View style={styles.priorityCard}>
      <View style={styles.priorityHeader}>
        <Text style={styles.priorityTitle}>{titulo}</Text>
        <Text style={[styles.priorityBadge, { color: tone }]}>{severidade.toUpperCase()}</Text>
      </View>
      <Text style={styles.priorityDetail}>{detalhe}</Text>
      <TouchableOpacity style={[styles.priorityAction, disabled ? { opacity: 0.6 } : null]} onPress={onPress} disabled={disabled}>
        <Text style={styles.priorityActionText}>Executar agora</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  heroLabel: { color: "#94a3b8", fontWeight: "800", fontSize: 12 },
  heroValue: { color: "#22c55e", fontWeight: "900", fontSize: 28, marginTop: 2 },
  heroSub: { color: "#cbd5e1", fontWeight: "700", fontSize: 12, marginTop: 2, maxWidth: 300 },
  periodRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  periodBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#111827",
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  periodBtnActive: { backgroundColor: "#facc15", borderColor: "#facc15" },
  periodText: { color: "#cbd5e1", fontWeight: "800", fontSize: 12 },
  periodTextActive: { color: "#1f2937" },
  loading: { paddingVertical: 80, alignItems: "center", justifyContent: "center" },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  kpi: { flex: 1, minWidth: 200, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937", borderRadius: 12, padding: 10 },
  kpiLabel: { color: "#94a3b8", fontWeight: "700", fontSize: 12 },
  kpiValue: { marginTop: 6, fontWeight: "900", fontSize: 18 },
  card: { backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937", borderRadius: 14, padding: 12, marginBottom: 10 },
  sectionTitle: { color: "#e2e8f0", fontWeight: "900", fontSize: 15, marginBottom: 10 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: { backgroundColor: "#22c55e", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  actionText: { color: "#022c22", fontWeight: "900", fontSize: 12 },
  radarGrid: { gap: 10 },
  metricItem: { gap: 6 },
  metricHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metricLabel: { color: "#cbd5e1", fontWeight: "800", fontSize: 12 },
  metricValue: { fontWeight: "900", fontSize: 12 },
  metricTrack: { height: 8, borderRadius: 999, backgroundColor: "#1f2937", overflow: "hidden" },
  metricFill: { height: "100%", borderRadius: 999 },
  priorityCard: { borderTopWidth: 1, borderTopColor: "#1f2937", paddingTop: 10, marginTop: 8 },
  priorityHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  priorityTitle: { color: "#f8fafc", fontWeight: "900", flex: 1, marginRight: 10 },
  priorityBadge: { fontWeight: "900", fontSize: 11 },
  priorityDetail: { color: "#94a3b8", fontWeight: "700", fontSize: 12, marginBottom: 8 },
  priorityAction: { alignSelf: "flex-start", backgroundColor: "#facc15", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  priorityActionText: { color: "#1f2937", fontWeight: "900", fontSize: 12 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  input: { backgroundColor: "#0f172a", borderWidth: 1, borderColor: "#334155", borderRadius: 10, color: "#f8fafc", fontWeight: "700", paddingHorizontal: 10, paddingVertical: 9 },
  simBlock: { marginTop: 8, borderTopWidth: 1, borderTopColor: "#1f2937", paddingTop: 8 },
  priceRow: { borderTopWidth: 1, borderTopColor: "#1f2937", paddingTop: 8, marginTop: 8 },
  meta: { color: "#cbd5e1", fontWeight: "700", marginBottom: 5 },
  metaSoft: { color: "#94a3b8", fontWeight: "700", marginBottom: 4, fontSize: 12 },
  danger: { color: "#ef4444", fontWeight: "900", marginTop: 2, marginBottom: 3, fontSize: 12 },
  warning: { color: "#facc15", fontWeight: "800", marginBottom: 4, fontSize: 11 },
  empty: { color: "#94a3b8", fontWeight: "700", textAlign: "center", paddingVertical: 6 },
  integrationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    paddingTop: 8,
    marginTop: 8,
    gap: 8,
  },
  integrationStatus: { fontWeight: "900", fontSize: 11 },
  integrationOn: { color: "#22c55e" },
  integrationErr: { color: "#ef4444" },
  integrationOff: { color: "#94a3b8" },
  execRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    paddingTop: 8,
    marginTop: 8,
    gap: 8,
  },
  execResult: { fontWeight: "900", fontSize: 11 },
  execOk: { color: "#22c55e" },
  execErr: { color: "#ef4444" },
});
