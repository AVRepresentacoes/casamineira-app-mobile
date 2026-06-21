import PortalShell from "@/components/fornecedor-web/PortalShell";
import { formatCurrencyInputBR, formatMoney, parseCurrencyInputBR } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Extrato = {
  id: string;
  data_movimento: string;
  descricao: string;
  valor: number;
  tipo: "credito" | "debito";
  status: "pendente" | "conciliado";
  referencia_lancamento_id?: string | null;
};

type Lancamento = {
  id: string;
  descricao: string;
  valor: number;
  tipo: "pagar" | "receber";
  status: string;
  created_at?: string | null;
};

type MatchSuggestion = {
  extrato: Extrato;
  candidato: Lancamento | null;
  score: number;
  scoreValor: number;
  scoreTexto: number;
  scoreData: number;
  valorDiff: number;
  idadeDias: number;
};

function normText(input: string) {
  return String(input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarityScore(a: string, b: string) {
  const sa = new Set(normText(a).split(" ").filter(Boolean));
  const sb = new Set(normText(b).split(" ").filter(Boolean));
  if (!sa.size || !sb.size) return 0;
  let overlap = 0;
  for (const token of sa) if (sb.has(token)) overlap += 1;
  return overlap / Math.max(sa.size, sb.size);
}

function daysSince(dateStr: string) {
  const ms = new Date(dateStr).getTime();
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, Math.floor((Date.now() - ms) / (24 * 60 * 60 * 1000)));
}

function getSeverityColor(ageDays: number) {
  if (ageDays >= 15) return "#ef4444";
  if (ageDays >= 8) return "#f59e0b";
  return "#38bdf8";
}

export default function PortalFornecedorConciliacao() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataMov, setDataMov] = useState("");
  const [tipo, setTipo] = useState<"credito" | "debito">("credito");
  const [busca, setBusca] = useState("");
  const [filtroConfianca, setFiltroConfianca] = useState<"todas" | "alta" | "media" | "baixa" | "sem_match">("todas");
  const [loteMinScore, setLoteMinScore] = useState("92");
  const [manualMinScore, setManualMinScore] = useState("85");
  const [politicaEstrita, setPoliticaEstrita] = useState(true);

  const [extratos, setExtratos] = useState<Extrato[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [extRes, lanRes] = await Promise.all([
        supabase
          .from("fornecedor_conciliacao_extratos")
          .select("id, data_movimento, descricao, valor, tipo, status, referencia_lancamento_id")
          .order("data_movimento", { ascending: false })
          .limit(800),
        supabase
          .from("fornecedor_financeiro_lancamentos")
          .select("id, descricao, valor, tipo, status, created_at")
          .neq("status", "cancelado")
          .order("created_at", { ascending: false })
          .limit(800),
      ]);

      setExtratos((extRes.data as Extrato[]) || []);
      setLancamentos((lanRes.data as Lancamento[]) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const pendentes = useMemo(() => extratos.filter((e) => e.status === "pendente"), [extratos]);
  const conciliados = useMemo(() => extratos.filter((e) => e.status === "conciliado"), [extratos]);
  const lancPendentes = useMemo(() => lancamentos.filter((l) => l.status !== "pago"), [lancamentos]);

  const pendentesFiltrados = useMemo(() => {
    const q = normText(busca);
    if (!q) return pendentes;
    return pendentes.filter((e) => normText(`${e.descricao} ${e.data_movimento} ${e.tipo}`).includes(q));
  }, [pendentes, busca]);

  const sugestoes = useMemo<MatchSuggestion[]>(() => {
    return pendentesFiltrados
      .map((extrato) => {
        const sameSignal = lancPendentes.filter((l) =>
          (extrato.tipo === "credito" && l.tipo === "receber") ||
          (extrato.tipo === "debito" && l.tipo === "pagar")
        );

        let best: Lancamento | null = null;
        let bestScore = 0;
        let bestDiff = Number.MAX_SAFE_INTEGER;
        let bestScoreValor = 0;
        let bestScoreTexto = 0;
        let bestScoreData = 0;

        for (const cand of sameSignal) {
          const valorExtrato = Number(extrato.valor || 0);
          const valorLanc = Number(cand.valor || 0);
          const diff = Math.abs(valorExtrato - valorLanc);
          const base = Math.max(valorExtrato, 1);
          const diffPct = diff / base;
          const scoreValor = Math.max(0, 70 - diffPct * 400);
          const scoreTexto = similarityScore(extrato.descricao, cand.descricao) * 20;

          const candDate = cand.created_at ? new Date(cand.created_at).getTime() : NaN;
          const extDate = new Date(extrato.data_movimento).getTime();
          const dateDiffDays = Number.isFinite(candDate) && Number.isFinite(extDate)
            ? Math.abs(candDate - extDate) / (24 * 60 * 60 * 1000)
            : 30;
          const scoreData = Math.max(0, 10 - dateDiffDays);

          const score = Math.max(0, Math.min(100, scoreValor + scoreTexto + scoreData));
          if (score > bestScore) {
            best = cand;
            bestScore = score;
            bestDiff = diff;
            bestScoreValor = scoreValor;
            bestScoreTexto = scoreTexto;
            bestScoreData = scoreData;
          }
        }

        return {
          extrato,
          candidato: best,
          score: Number(bestScore.toFixed(1)),
          scoreValor: Number(bestScoreValor.toFixed(1)),
          scoreTexto: Number(bestScoreTexto.toFixed(1)),
          scoreData: Number(bestScoreData.toFixed(1)),
          valorDiff: Number.isFinite(bestDiff) ? bestDiff : 0,
          idadeDias: daysSince(extrato.data_movimento),
        };
      })
      .sort((a, b) => b.idadeDias - a.idadeDias || b.score - a.score);
  }, [pendentesFiltrados, lancPendentes]);

  const sugestoesFiltradas = useMemo(() => {
    if (filtroConfianca === "todas") return sugestoes;
    if (filtroConfianca === "sem_match") return sugestoes.filter((s) => !s.candidato);
    if (filtroConfianca === "alta") return sugestoes.filter((s) => s.candidato && s.score >= 85);
    if (filtroConfianca === "media") return sugestoes.filter((s) => s.candidato && s.score >= 65 && s.score < 85);
    return sugestoes.filter((s) => s.candidato && s.score < 65);
  }, [sugestoes, filtroConfianca]);

  const excecoes = useMemo(
    () => sugestoes.filter((s) => !s.candidato || s.score < 65 || s.idadeDias >= 8).slice(0, 20),
    [sugestoes]
  );

  const kpis = useMemo(() => {
    const total = extratos.length;
    const pend = pendentes.length;
    const conc = conciliados.length;
    const cobertura = total > 0 ? (conc / total) * 100 : 0;
    const valorPendente = pendentes.reduce((acc, p) => acc + Number(p.valor || 0), 0);
    const criticos = sugestoes.filter((s) => s.idadeDias >= 8).length;
    const altaConfianca = sugestoes.filter((s) => s.score >= 85).length;
    const semMatch = sugestoes.filter((s) => !s.candidato).length;
    return { total, pend, conc, cobertura, valorPendente, criticos, altaConfianca, semMatch };
  }, [extratos, pendentes, conciliados, sugestoes]);

  async function adicionarExtrato() {
    const valorNum = parseCurrencyInputBR(valor);
    if (!descricao.trim()) return Alert.alert("Atenção", "Descrição obrigatória.");
    if (!Number.isFinite(valorNum) || valorNum <= 0) return Alert.alert("Atenção", "Valor inválido.");

    try {
      setSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) throw new Error("Usuário não autenticado.");

      const { data: tenantId, error: tenantError } = await supabase.rpc("current_tenant_id");
      if (tenantError || !tenantId) throw new Error("Tenant ativo não encontrado.");

      const { error } = await supabase.from("fornecedor_conciliacao_extratos").insert({
        tenant_id: tenantId,
        fornecedor_id: uid,
        data_movimento: dataMov.trim() || new Date().toISOString().slice(0, 10),
        descricao: descricao.trim(),
        valor: valorNum,
        tipo,
        status: "pendente",
      });

      if (error) throw error;
      setDescricao("");
      setValor("");
      setDataMov("");
      await carregar();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao lançar extrato.");
    } finally {
      setSaving(false);
    }
  }

  async function conciliarComLancamento(extratoId: string, lancamentoId: string) {
    try {
      setBusyId(extratoId);
      const { error } = await supabase.rpc("conciliar_lancamento_extrato", {
        p_lancamento_id: lancamentoId,
        p_extrato_id: extratoId,
      });
      if (error) throw error;
      await carregar();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao conciliar.");
    } finally {
      setBusyId(null);
    }
  }

  async function conciliarRecomendado(item: MatchSuggestion) {
    if (!item.candidato) return Alert.alert("Atenção", "Sem lançamento recomendado para este extrato.");
    const minManual = Math.max(50, Math.min(100, Number(manualMinScore) || 85));
    if (politicaEstrita && item.score < minManual) {
      return Alert.alert(
        "Bloqueado por política",
        `Score ${item.score.toFixed(1)}% abaixo do mínimo manual (${minManual}%). Requer revisão na fila de exceções.`
      );
    }
    await conciliarComLancamento(item.extrato.id, item.candidato.id);
  }

  async function conciliarLoteAltaConfianca() {
    const thresholdBase = Math.max(50, Math.min(100, Number(loteMinScore) || 92));
    const minManual = Math.max(50, Math.min(100, Number(manualMinScore) || 85));
    const threshold = politicaEstrita ? Math.max(thresholdBase, minManual) : thresholdBase;
    const top = sugestoes.filter((s) => s.candidato && s.score >= threshold).slice(0, 10);
    if (top.length === 0) return Alert.alert("Conciliação em lote", "Nenhuma sugestão com alta confiança disponível.");

    try {
      setBusyId("batch");
      for (const item of top) {
        await conciliarComLancamento(item.extrato.id, item.candidato!.id);
      }
      Alert.alert("Concluído", `${top.length} extrato(s) conciliado(s) automaticamente.`);
    } finally {
      setBusyId(null);
      await carregar();
    }
  }

  return (
    <PortalShell
      title="Conciliação Bancária Inteligente"
      subtitle="Motor de matching, priorização de divergências e automação com score de confiança"
      headerRight={
        <TouchableOpacity style={styles.batchBtn} onPress={() => void conciliarLoteAltaConfianca()} disabled={busyId === "batch"}>
          {busyId === "batch" ? <ActivityIndicator size="small" color="#022c22" /> : <Text style={styles.batchText}>Auto-conciliar</Text>}
        </TouchableOpacity>
      }
    >
      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#22c55e" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={styles.kpiRow}>
            <Kpi label="Extratos" value={String(kpis.total)} color="#f8fafc" />
            <Kpi label="Pendentes" value={String(kpis.pend)} color="#facc15" />
            <Kpi label="Conciliados" value={String(kpis.conc)} color="#22c55e" />
            <Kpi label="Cobertura" value={`${kpis.cobertura.toFixed(1)}%`} color="#38bdf8" />
            <Kpi label="Valor pendente" value={formatMoney(kpis.valorPendente)} color="#ef4444" />
            <Kpi label="Críticos (8+d)" value={String(kpis.criticos)} color={kpis.criticos > 0 ? "#ef4444" : "#22c55e"} />
            <Kpi label="Alta confiança" value={String(kpis.altaConfianca)} color="#22c55e" />
            <Kpi label="Sem candidato" value={String(kpis.semMatch)} color={kpis.semMatch > 0 ? "#ef4444" : "#22c55e"} />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Governança e transparência</Text>
            <Text style={styles.metaLine}>Regra de score: 70% valor + 20% similaridade + 10% proximidade de data.</Text>
            <View style={styles.row}>
              <Text style={styles.metaLabel}>Auto-conciliação mínima (%)</Text>
              <TextInput
                style={[styles.input, { width: 110 }]}
                placeholder="92"
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                value={loteMinScore}
                onChangeText={(v) => setLoteMinScore(v.replace(/\D/g, ""))}
              />
              <Text style={styles.metaLabel}>Manual mínimo (%)</Text>
              <TextInput
                style={[styles.input, { width: 110 }]}
                placeholder="85"
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                value={manualMinScore}
                onChangeText={(v) => setManualMinScore(v.replace(/\D/g, ""))}
              />
              <ConfidenceChip
                label={politicaEstrita ? "Política estrita: ON" : "Política estrita: OFF"}
                active={politicaEstrita}
                onPress={() => setPoliticaEstrita((p) => !p)}
              />
              <ConfidenceChip label="Todas" active={filtroConfianca === "todas"} onPress={() => setFiltroConfianca("todas")} />
              <ConfidenceChip label="Alta" active={filtroConfianca === "alta"} onPress={() => setFiltroConfianca("alta")} />
              <ConfidenceChip label="Média" active={filtroConfianca === "media"} onPress={() => setFiltroConfianca("media")} />
              <ConfidenceChip label="Baixa" active={filtroConfianca === "baixa"} onPress={() => setFiltroConfianca("baixa")} />
              <ConfidenceChip label="Sem match" active={filtroConfianca === "sem_match"} onPress={() => setFiltroConfianca("sem_match")} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Importação manual de extrato</Text>
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1, minWidth: 220 }]} placeholder="Descrição do movimento" placeholderTextColor="#64748b" value={descricao} onChangeText={setDescricao} />
              <TextInput style={[styles.input, { width: 140 }]} placeholder="Valor" placeholderTextColor="#64748b" keyboardType="decimal-pad" value={valor} onChangeText={(t) => setValor(formatCurrencyInputBR(t))} />
              <TextInput style={[styles.input, { width: 160 }]} placeholder="Data YYYY-MM-DD" placeholderTextColor="#64748b" value={dataMov} onChangeText={setDataMov} />
              <TouchableOpacity style={styles.chip} onPress={() => setTipo((t) => (t === "credito" ? "debito" : "credito"))}>
                <Text style={styles.chipText}>{tipo}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => void adicionarExtrato()} disabled={saving}>
                {saving ? <ActivityIndicator color="#022c22" /> : <Text style={styles.primaryText}>Adicionar</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Motor de matching</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, minWidth: 240 }]}
                placeholder="Buscar pendência por descrição, data ou tipo"
                placeholderTextColor="#64748b"
                value={busca}
                onChangeText={setBusca}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Sugestões inteligentes ({sugestoesFiltradas.length})</Text>
            {sugestoesFiltradas.length === 0 ? (
              <Text style={styles.empty}>Sem pendências para conciliar.</Text>
            ) : (
              sugestoesFiltradas.slice(0, 30).map((item) => (
                <View key={item.extrato.id} style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.extrato.descricao}</Text>
                    <Text style={styles.itemMeta}>
                      {item.extrato.data_movimento} • {item.extrato.tipo.toUpperCase()} • {formatMoney(Number(item.extrato.valor || 0))}
                    </Text>
                    <Text style={[styles.itemMeta, { color: getSeverityColor(item.idadeDias) }]}>Aging: {item.idadeDias} dia(s)</Text>
                    {item.candidato ? (
                      <Text style={styles.matchMeta}>
                        Sugestão: {item.candidato.descricao} • Diff {formatMoney(item.valorDiff)} • Score {item.score.toFixed(1)}%
                      </Text>
                    ) : (
                      <Text style={styles.noMatch}>Sem candidato compatível por sinal/valor.</Text>
                    )}
                    {item.candidato ? (
                      <Text style={styles.auditExplain}>
                        Critérios: valor {item.scoreValor.toFixed(1)} / 70 • descrição {item.scoreTexto.toFixed(1)} / 20 • data {item.scoreData.toFixed(1)} / 10
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <Text style={[styles.scoreBadge, { color: item.score >= 85 ? "#22c55e" : item.score >= 65 ? "#f59e0b" : "#ef4444" }]}>
                      {item.score.toFixed(0)}%
                    </Text>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => void conciliarRecomendado(item)} disabled={busyId === item.extrato.id || !item.candidato}>
                      {busyId === item.extrato.id ? (
                        <ActivityIndicator size="small" color="#cbd5e1" />
                      ) : (
                        <Text style={styles.secondaryText}>
                          {politicaEstrita && item.score < (Math.max(50, Math.min(100, Number(manualMinScore) || 85))) ? "Revisar" : "Conciliar"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Fila de exceções</Text>
            {excecoes.length === 0 ? (
              <Text style={styles.empty}>Sem exceções abertas.</Text>
            ) : (
              excecoes.map((item) => (
                <View key={`ex-${item.extrato.id}`} style={styles.exceptionRow}>
                  <View style={[styles.dot, { backgroundColor: getSeverityColor(item.idadeDias) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.extrato.descricao}</Text>
                    <Text style={styles.itemMeta}>
                      {item.extrato.data_movimento} • {formatMoney(Number(item.extrato.valor || 0))} • score {item.score.toFixed(0)}%
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Trilha de auditoria (últimos conciliados)</Text>
            {conciliados.slice(0, 12).length === 0 ? (
              <Text style={styles.empty}>Sem registros conciliados ainda.</Text>
            ) : (
              conciliados.slice(0, 12).map((item) => (
                <View key={`aud-${item.id}`} style={styles.auditRow}>
                  <Text style={styles.itemTitle}>{item.descricao}</Text>
                  <Text style={styles.itemMeta}>
                    {item.data_movimento} • {item.tipo.toUpperCase()} • {formatMoney(Number(item.valor || 0))}
                  </Text>
                  <Text style={styles.auditRef}>Ref.: {item.referencia_lancamento_id || "sem vínculo"}</Text>
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

function ConfidenceChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.confChip, active ? styles.confChipActive : null]} onPress={onPress}>
      <Text style={[styles.confChipText, active ? styles.confChipTextActive : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: "center", justifyContent: "center" },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  kpi: { flex: 1, minWidth: 175, backgroundColor: "#0b1220", borderColor: "#1f2937", borderWidth: 1, borderRadius: 12, padding: 10 },
  kpiLabel: { color: "#94a3b8", fontWeight: "700", fontSize: 12 },
  kpiValue: { marginTop: 6, fontSize: 18, fontWeight: "900" },
  card: { backgroundColor: "#0b1220", borderColor: "#1f2937", borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  title: { color: "#e2e8f0", fontWeight: "900", fontSize: 15, marginBottom: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  input: { backgroundColor: "#0f172a", borderColor: "#334155", borderWidth: 1, borderRadius: 10, color: "#f8fafc", fontWeight: "700", paddingHorizontal: 10, paddingVertical: 9 },
  chip: { backgroundColor: "#172036", borderColor: "#334155", borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10 },
  chipText: { color: "#e2e8f0", fontWeight: "900", textTransform: "uppercase", fontSize: 11 },
  primaryBtn: { backgroundColor: "#22c55e", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  primaryText: { color: "#022c22", fontWeight: "900" },
  batchBtn: { backgroundColor: "#22c55e", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  batchText: { color: "#022c22", fontWeight: "900", fontSize: 12 },
  empty: { textAlign: "center", color: "#94a3b8", fontWeight: "700", paddingVertical: 10 },
  item: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: "#1f2937", paddingVertical: 10 },
  itemTitle: { color: "#f8fafc", fontWeight: "800" },
  itemMeta: { color: "#94a3b8", fontSize: 11, marginTop: 2, fontWeight: "700" },
  matchMeta: { color: "#cbd5e1", fontSize: 11, marginTop: 4, fontWeight: "700" },
  noMatch: { color: "#ef4444", fontSize: 11, marginTop: 4, fontWeight: "800" },
  auditExplain: { color: "#facc15", fontSize: 11, marginTop: 4, fontWeight: "700" },
  metaLine: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 8 },
  metaLabel: { color: "#cbd5e1", fontSize: 12, fontWeight: "700" },
  confChip: { backgroundColor: "#111827", borderColor: "#334155", borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  confChipActive: { backgroundColor: "#1e293b", borderColor: "#38bdf8" },
  confChipText: { color: "#94a3b8", fontWeight: "800", fontSize: 11 },
  confChipTextActive: { color: "#e2e8f0" },
  secondaryBtn: { backgroundColor: "#172036", borderColor: "#334155", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  secondaryText: { color: "#cbd5e1", fontWeight: "800", fontSize: 11 },
  scoreBadge: { fontWeight: "900", fontSize: 14 },
  exceptionRow: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: "#1f2937", paddingVertical: 10 },
  dot: { width: 9, height: 9, borderRadius: 999 },
  auditRow: { borderTopWidth: 1, borderTopColor: "#1f2937", paddingVertical: 10 },
  auditRef: { color: "#facc15", fontWeight: "700", fontSize: 11, marginTop: 2 },
});
