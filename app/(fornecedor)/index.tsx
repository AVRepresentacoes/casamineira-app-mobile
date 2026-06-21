import { logout } from "@/lib/auth";
import { formatMoney } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type FornecedorPerfil = {
  fornecedor_ativo?: boolean | null;
  fornecedor_nome_fantasia?: string | null;
  fornecedor_categoria?: string | null;
  fornecedor_cnpj?: string | null;
  fornecedor_raio_km?: number | null;
};

type Produto = {
  id: string;
  ativo: boolean;
  estoque: number;
  preco: number;
};

type PedidoItem = {
  pedido_id: string;
  titulo: string;
  subtotal: number;
  quantidade: number;
  created_at: string;
};

type Pedido = {
  id: string;
  status_logistica?: string | null;
};

type Pagamento = {
  valor_profissional?: number | null;
  valor_comissao?: number | null;
  status_pagamento?: string | null;
  status_pagamentos?: string | null;
  created_at?: string | null;
};

function formatCnpj(value: string) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 14);
  if (!digits) return "Não informado";
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function normalizarStatusPagamento(item: Pagamento) {
  return String(item.status_pagamento || item.status_pagamentos || "").toLowerCase();
}

function isPagamentoAprovado(item: Pagamento) {
  const status = normalizarStatusPagamento(item);
  return status === "aprovada" || status === "pago";
}

function isPagamentoPendente(item: Pagamento) {
  const status = normalizarStatusPagamento(item);
  return status === "pendente" || status === "aguardar_pagamento";
}

function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMetaStorageKey(uid: string) {
  return `@fornecedor_meta_mensal:${uid}:${getMonthKey()}`;
}

function getWeekKey() {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - oneJan.getTime()) / 86400000);
  const week = Math.ceil((days + oneJan.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getMetaSemanalStorageKey(uid: string) {
  return `@fornecedor_meta_semanal:${uid}:${getWeekKey()}`;
}

function parseMoneyInputToNumber(value: string) {
  const normalized = String(value || "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export default function HomeFornecedor() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [metaMensal, setMetaMensal] = useState(10000);
  const [metaInput, setMetaInput] = useState("10000");
  const [metaSemanal, setMetaSemanal] = useState(2500);
  const [metaSemanalInput, setMetaSemanalInput] = useState("2500");
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingMetaSemanal, setSavingMetaSemanal] = useState(false);

  const [nome, setNome] = useState("Fornecedor");
  const [categoria, setCategoria] = useState("Categoria não informada");
  const [cnpj, setCnpj] = useState("Não informado");
  const [raio, setRaio] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [pedidosMap, setPedidosMap] = useState<Map<string, Pedido>>(new Map());
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace("/(auth)/login");
        return;
      }

      const uid = session.user.id;
      setCurrentUserId(uid);

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

      const [perfilRes, produtosRes, itensRes, pagamentosRes] = await Promise.all([
        tenantId
          ? supabase
              .from("profissionais")
              .select(
                "fornecedor_ativo, fornecedor_nome_fantasia, fornecedor_categoria, fornecedor_cnpj, fornecedor_raio_km"
              )
              .eq("user_id", uid)
              .eq("tenant_id", tenantId)
              .maybeSingle()
          : supabase
              .from("profissionais")
              .select(
                "fornecedor_ativo, fornecedor_nome_fantasia, fornecedor_categoria, fornecedor_cnpj, fornecedor_raio_km"
              )
              .eq("user_id", uid)
              .maybeSingle(),
        tenantId
          ? supabase
              .from("produtos_fornecedor")
              .select("id, ativo, estoque, preco")
              .eq("fornecedor_id", uid)
              .eq("tenant_id", tenantId)
          : supabase
              .from("produtos_fornecedor")
              .select("id, ativo, estoque, preco")
              .eq("fornecedor_id", uid),
        tenantId
          ? supabase
              .from("pedido_produtos_itens")
              .select("pedido_id, titulo, subtotal, quantidade, created_at")
              .eq("fornecedor_id", uid)
              .eq("tenant_id", tenantId)
              .order("created_at", { ascending: false })
              .limit(1200)
          : supabase
              .from("pedido_produtos_itens")
              .select("pedido_id, titulo, subtotal, quantidade, created_at")
              .eq("fornecedor_id", uid)
              .order("created_at", { ascending: false })
              .limit(1200),
        tenantId
          ? supabase
              .from("pagamentos")
              .select("valor_profissional, valor_comissao, status_pagamento, status_pagamentos, created_at")
              .eq("profissional_id", uid)
              .eq("tenant_id", tenantId)
              .order("created_at", { ascending: false })
              .limit(600)
          : supabase
              .from("pagamentos")
              .select("valor_profissional, valor_comissao, status_pagamento, status_pagamentos, created_at")
              .eq("profissional_id", uid)
              .order("created_at", { ascending: false })
              .limit(600),
      ]);

      if (perfilRes.error) {
        Alert.alert("Erro", "Não foi possível carregar dados de fornecedor.");
        router.replace("/(auth)/login");
        return;
      }

      const data = perfilRes.data as FornecedorPerfil | null;
      if (!data || !data.fornecedor_ativo) {
        Alert.alert("Cadastro incompleto", "Ative seu cadastro de fornecedor para continuar.");
        router.replace("/(auth)/cadastro-fornecedor");
        return;
      }

      setNome(String(data.fornecedor_nome_fantasia || "Fornecedor"));
      setCategoria(String(data.fornecedor_categoria || "Categoria não informada"));
      setCnpj(formatCnpj(String(data.fornecedor_cnpj || "")));
      setRaio(Number(data.fornecedor_raio_km || 0));

      const itensRows = (itensRes.data as PedidoItem[]) || [];
      const pedidoIds = [...new Set(itensRows.map((row) => String(row.pedido_id || "")))].filter(Boolean);

      if (pedidoIds.length > 0) {
        const { data: pedidosData } = await (tenantId
          ? supabase
              .from("pedidos")
              .select("id, status_logistica")
              .in("id", pedidoIds)
              .eq("tenant_id", tenantId)
          : supabase
              .from("pedidos")
              .select("id, status_logistica")
              .in("id", pedidoIds));
        const nextMap = new Map<string, Pedido>();
        for (const row of (pedidosData as Pedido[]) || []) {
          nextMap.set(String(row.id), row);
        }
        setPedidosMap(nextMap);
      } else {
        setPedidosMap(new Map());
      }

      setProdutos((produtosRes.data as Produto[]) || []);
      setItens(itensRows);
      setPagamentos((pagamentosRes.data as Pagamento[]) || []);
      setUpdatedAt(new Date().toLocaleString("pt-BR"));
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  useEffect(() => {
    async function loadMetaMensal() {
      if (!currentUserId) return;
      const key = getMetaStorageKey(currentUserId);
      const raw = await AsyncStorage.getItem(key);
      const parsed = Number(raw || 10000);
      const nextMeta = Number.isFinite(parsed) && parsed > 0 ? parsed : 10000;
      setMetaMensal(nextMeta);
      setMetaInput(String(nextMeta.toFixed(2).replace(".", ",")));

      const keySemanal = getMetaSemanalStorageKey(currentUserId);
      const rawSemanal = await AsyncStorage.getItem(keySemanal);
      const parsedSemanal = Number(rawSemanal || 2500);
      const nextMetaSemanal =
        Number.isFinite(parsedSemanal) && parsedSemanal > 0 ? parsedSemanal : 2500;
      setMetaSemanal(nextMetaSemanal);
      setMetaSemanalInput(String(nextMetaSemanal.toFixed(2).replace(".", ",")));
    }
    void loadMetaMensal();
  }, [currentUserId]);

  const painel = useMemo(() => {
    const pedidosIds = [...new Set(itens.map((i) => String(i.pedido_id || "")))].filter(Boolean);
    const pedidos = pedidosIds.map((id) => {
      const status = String(pedidosMap.get(id)?.status_logistica || "novo").toLowerCase();
      const subtotal = itens
        .filter((i) => String(i.pedido_id || "") === id)
        .reduce((acc, i) => acc + Number(i.subtotal || 0), 0);
      const createdAt =
        itens.find((i) => String(i.pedido_id || "") === id)?.created_at || new Date().toISOString();
      return { id, status, subtotal, createdAt };
    });

    const totalPedidos = pedidos.length;
    const totalItensVendidos = itens.reduce((acc, i) => acc + Number(i.quantidade || 0), 0);
    const faturamentoTotal = pedidos.reduce((acc, p) => acc + p.subtotal, 0);
    const ticketMedio = totalPedidos > 0 ? faturamentoTotal / totalPedidos : 0;

    const now = Date.now();
    const faturamento30d = pedidos
      .filter((p) => now - new Date(p.createdAt).getTime() <= 30 * 24 * 60 * 60 * 1000)
      .reduce((acc, p) => acc + p.subtotal, 0);
    const nowDate = new Date();
    const mesAtual = nowDate.getMonth();
    const anoAtual = nowDate.getFullYear();
    const nowDay = nowDate.getDay();
    const diffToMonday = nowDay === 0 ? 6 : nowDay - 1;
    const startOfWeek = new Date(nowDate);
    startOfWeek.setDate(nowDate.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    const faturamentoMesAtual = pedidos
      .filter((p) => {
        const d = new Date(p.createdAt);
        return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
      })
      .reduce((acc, p) => acc + p.subtotal, 0);
    const faturamentoSemanaAtual = pedidos
      .filter((p) => new Date(p.createdAt).getTime() >= startOfWeek.getTime())
      .reduce((acc, p) => acc + p.subtotal, 0);

    const entregues = pedidos.filter((p) => p.status === "entregue").length;
    const pendentes = pedidos.filter((p) => ["novo", "preparando", "enviado"].includes(p.status)).length;
    const atrasados = pedidos.filter((p) => {
      if (["entregue", "cancelado"].includes(p.status)) return false;
      const ageHours = (now - new Date(p.createdAt).getTime()) / (1000 * 60 * 60);
      return ageHours >= 48;
    }).length;

    const produtosAtivos = produtos.filter((p) => Boolean(p.ativo)).length;
    const produtosInativos = produtos.length - produtosAtivos;
    const estoqueTotal = produtos.reduce((acc, p) => acc + Number(p.estoque || 0), 0);
    const estoqueBaixo = produtos.filter((p) => Boolean(p.ativo) && Number(p.estoque || 0) > 0 && Number(p.estoque || 0) <= 3).length;
    const semEstoque = produtos.filter((p) => Boolean(p.ativo) && Number(p.estoque || 0) <= 0).length;

    const repasseAprovado = pagamentos
      .filter((p) => isPagamentoAprovado(p))
      .reduce((acc, p) => acc + Number(p.valor_profissional || 0), 0);
    const repassePendente = pagamentos
      .filter((p) => isPagamentoPendente(p))
      .reduce((acc, p) => acc + Number(p.valor_profissional || 0), 0);
    const comissaoPlataforma = pagamentos
      .filter((p) => isPagamentoAprovado(p))
      .reduce((acc, p) => acc + Number(p.valor_comissao || 0), 0);

    const entreguesPercent = totalPedidos > 0 ? Math.round((entregues / totalPedidos) * 100) : 0;

    const topProdutos = Array.from(
      itens.reduce((map, item) => {
        const key = String(item.titulo || "Produto");
        const current = map.get(key) || { titulo: key, quantidade: 0, faturamento: 0 };
        current.quantidade += Number(item.quantidade || 0);
        current.faturamento += Number(item.subtotal || 0);
        map.set(key, current);
        return map;
      }, new Map<string, { titulo: string; quantidade: number; faturamento: number }>())
      .values()
    )
      .sort((a, b) => {
        if (b.quantidade === a.quantidade) return b.faturamento - a.faturamento;
        return b.quantidade - a.quantidade;
      })
      .slice(0, 5);

    return {
      totalPedidos,
      totalItensVendidos,
      faturamentoTotal,
      faturamento30d,
      ticketMedio,
      entregues,
      pendentes,
      atrasados,
      produtosAtivos,
      produtosInativos,
      estoqueTotal,
      estoqueBaixo,
      semEstoque,
      repasseAprovado,
      repassePendente,
      comissaoPlataforma,
      entreguesPercent,
      faturamentoMesAtual,
      faturamentoSemanaAtual,
      topProdutos,
    };
  }, [itens, pedidosMap, produtos, pagamentos]);

  const progressoMeta = useMemo(() => {
    if (!metaMensal || metaMensal <= 0) return 0;
    return Math.min(100, Math.round((painel.faturamentoMesAtual / metaMensal) * 100));
  }, [painel.faturamentoMesAtual, metaMensal]);

  const progressoMetaSemanal = useMemo(() => {
    if (!metaSemanal || metaSemanal <= 0) return 0;
    return Math.min(100, Math.round((painel.faturamentoSemanaAtual / metaSemanal) * 100));
  }, [painel.faturamentoSemanaAtual, metaSemanal]);

  const alertas = useMemo(() => {
    const list: { id: string; prioridade: "alta" | "media" | "baixa"; texto: string }[] = [];
    if (painel.atrasados > 0) {
      list.push({
        id: "atrasados",
        prioridade: "alta",
        texto: `${painel.atrasados} pedido(s) com risco de atraso logístico.`,
      });
    }
    if (painel.semEstoque > 0) {
      list.push({
        id: "sem-estoque",
        prioridade: "alta",
        texto: `${painel.semEstoque} produto(s) ativo(s) sem estoque.`,
      });
    }
    if (painel.estoqueBaixo > 0) {
      list.push({
        id: "estoque-baixo",
        prioridade: "media",
        texto: `${painel.estoqueBaixo} produto(s) com estoque baixo.`,
      });
    }
    if (painel.repassePendente > 0) {
      list.push({
        id: "repasse-pendente",
        prioridade: "media",
        texto: `Repasse pendente de ${formatMoney(painel.repassePendente)} aguardando confirmação.`,
      });
    }
    if (list.length === 0) {
      list.push({
        id: "ok",
        prioridade: "baixa",
        texto: "Operação estável. Nenhum alerta crítico no momento.",
      });
    }
    return list;
  }, [painel.atrasados, painel.semEstoque, painel.estoqueBaixo, painel.repassePendente]);

  async function salvarMetaMensal() {
    if (!currentUserId) return;
    const value = parseMoneyInputToNumber(metaInput);
    if (!value || value <= 0) {
      Alert.alert("Meta inválida", "Informe um valor de meta maior que zero.");
      return;
    }
    try {
      setSavingMeta(true);
      const key = getMetaStorageKey(currentUserId);
      await AsyncStorage.setItem(key, String(value));
      setMetaMensal(value);
      setMetaInput(String(value.toFixed(2).replace(".", ",")));
      Alert.alert("Meta atualizada", "Meta mensal salva com sucesso.");
    } finally {
      setSavingMeta(false);
    }
  }

  async function salvarMetaSemanal() {
    if (!currentUserId) return;
    const value = parseMoneyInputToNumber(metaSemanalInput);
    if (!value || value <= 0) {
      Alert.alert("Meta inválida", "Informe um valor semanal maior que zero.");
      return;
    }
    try {
      setSavingMetaSemanal(true);
      const key = getMetaSemanalStorageKey(currentUserId);
      await AsyncStorage.setItem(key, String(value));
      setMetaSemanal(value);
      setMetaSemanalInput(String(value.toFixed(2).replace(".", ",")));
      Alert.alert("Meta semanal atualizada", "Meta semanal salva com sucesso.");
    } finally {
      setSavingMetaSemanal(false);
    }
  }

  async function sair() {
    await logout();
    router.replace("/(auth)/login");
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Painel do Fornecedor</Text>
          <Text style={styles.subtitle}>Central de operações da sua loja</Text>
          <Text style={styles.updated}>Atualizado em {updatedAt || "agora"}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => {
            setUpdating(true);
            void carregar();
          }}
          disabled={updating}
        >
          {updating ? <ActivityIndicator size="small" color="#022c22" /> : <Ionicons name="refresh" size={16} color="#022c22" />}
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <Text style={styles.name}>{nome}</Text>
        <Text style={styles.info}>Categoria: {categoria}</Text>
        <Text style={styles.info}>CNPJ: {cnpj}</Text>
        <Text style={styles.info}>Raio de entrega: {raio} km</Text>
      </View>

      <View style={styles.highlightCard}>
        <Text style={styles.highlightLabel}>Faturamento total da operação</Text>
        <Text style={styles.highlightValue}>{formatMoney(painel.faturamentoTotal)}</Text>
        <View style={styles.highlightRow}>
          <Text style={styles.highlightMeta}>30 dias: {formatMoney(painel.faturamento30d)}</Text>
          <Text style={styles.highlightMeta}>Ticket: {formatMoney(painel.ticketMedio)}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Metas de faturamento</Text>
        <Text style={styles.metasSubTitle}>Meta semanal</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Realizado (semana atual)</Text>
          <Text style={[styles.rowValue, { color: "#22c55e" }]}>{formatMoney(painel.faturamentoSemanaAtual)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Meta da semana</Text>
          <Text style={[styles.rowValue, { color: "#38bdf8" }]}>{formatMoney(metaSemanal)}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFillWeek, { width: `${Math.max(4, progressoMetaSemanal)}%` }]} />
        </View>
        <Text style={styles.progressTextWeek}>{progressoMetaSemanal}% da meta semanal</Text>

        <View style={styles.metaInputRow}>
          <TextInput
            style={styles.metaInput}
            value={metaSemanalInput}
            onChangeText={setMetaSemanalInput}
            keyboardType="decimal-pad"
            placeholder="Meta semanal"
            placeholderTextColor="#64748b"
          />
          <TouchableOpacity
            style={styles.metaSaveBtnWeek}
            onPress={() => void salvarMetaSemanal()}
            disabled={savingMetaSemanal}
          >
            {savingMetaSemanal ? (
              <ActivityIndicator size="small" color="#082f49" />
            ) : (
              <>
                <Ionicons name="save-outline" size={14} color="#082f49" />
                <Text style={styles.metaSaveTextWeek}>Salvar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.metaDivider} />
        <Text style={styles.metasSubTitle}>Meta mensal</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Realizado (mês atual)</Text>
          <Text style={[styles.rowValue, { color: "#22c55e" }]}>{formatMoney(painel.faturamentoMesAtual)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Meta configurada</Text>
          <Text style={[styles.rowValue, { color: "#38bdf8" }]}>{formatMoney(metaMensal)}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(4, progressoMeta)}%` }]} />
        </View>
        <Text style={styles.progressText}>{progressoMeta}% da meta atingida</Text>

        <View style={styles.metaInputRow}>
          <TextInput
            style={styles.metaInput}
            value={metaInput}
            onChangeText={setMetaInput}
            keyboardType="decimal-pad"
            placeholder="Ex: 5000,00"
            placeholderTextColor="#64748b"
          />
          <TouchableOpacity style={styles.metaSaveBtn} onPress={() => void salvarMetaMensal()} disabled={savingMeta}>
            {savingMeta ? (
              <ActivityIndicator size="small" color="#022c22" />
            ) : (
              <>
                <Ionicons name="save-outline" size={14} color="#022c22" />
                <Text style={styles.metaSaveText}>Salvar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.grid}>
        <MetricCard label="Pedidos" value={String(painel.totalPedidos)} color="#f8fafc" icon="receipt-outline" />
        <MetricCard label="Itens vendidos" value={String(painel.totalItensVendidos)} color="#f8fafc" icon="cube-outline" />
        <MetricCard label="Pendentes" value={String(painel.pendentes)} color="#facc15" icon="time-outline" />
        <MetricCard label="Atrasados" value={String(painel.atrasados)} color="#ef4444" icon="alert-circle-outline" />
        <MetricCard label="Entregues" value={`${painel.entregues} (${painel.entreguesPercent}%)`} color="#22c55e" icon="checkmark-done-outline" />
        <MetricCard label="Estoque total" value={String(painel.estoqueTotal)} color="#38bdf8" icon="layers-outline" />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Saúde operacional</Text>
        <Row label="Produtos ativos" value={String(painel.produtosAtivos)} />
        <Row label="Produtos inativos" value={String(painel.produtosInativos)} />
        <Row label="Estoque baixo" value={String(painel.estoqueBaixo)} warning={painel.estoqueBaixo > 0} />
        <Row label="Sem estoque" value={String(painel.semEstoque)} danger={painel.semEstoque > 0} />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Alertas automáticos</Text>
        {alertas.map((alerta) => (
          <AlertItem key={alerta.id} prioridade={alerta.prioridade} text={alerta.texto} />
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Top produtos vendidos</Text>
        {painel.topProdutos.length === 0 ? (
          <Text style={styles.emptyText}>Sem vendas suficientes para ranking ainda.</Text>
        ) : (
          painel.topProdutos.map((item, idx) => (
            <View key={`${item.titulo}-${idx}`} style={styles.rankRow}>
              <View style={styles.rankLeft}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>#{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rankTitle} numberOfLines={1}>
                    {item.titulo}
                  </Text>
                  <Text style={styles.rankMeta}>
                    {item.quantidade} unidade(s) vendida(s)
                  </Text>
                </View>
              </View>
              <Text style={styles.rankValue}>{formatMoney(item.faturamento)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Repasse e monetização</Text>
        <Row label="Repasse aprovado" value={formatMoney(painel.repasseAprovado)} positive />
        <Row label="Repasse pendente" value={formatMoney(painel.repassePendente)} warning />
        <Row label="Comissão da plataforma" value={formatMoney(painel.comissaoPlataforma)} neutral />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Ações rápidas</Text>
        <View style={styles.quickGrid}>
          <QuickAction
            label="Produtos"
            icon="cube-outline"
            onPress={() => router.push("/(fornecedor)/produtos")}
            primary
          />
          <QuickAction
            label="Pedidos"
            icon="receipt-outline"
            onPress={() => router.push("/(fornecedor)/pedidos")}
          />
          <QuickAction
            label="Financeiro"
            icon="wallet-outline"
            onPress={() => router.push("/(fornecedor)/financeiro")}
          />
          <QuickAction
            label="Cadastro"
            icon="id-card-outline"
            onPress={() => router.push("/(auth)/cadastro-fornecedor")}
          />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Checklist de performance</Text>
        <ChecklistItem
          done={painel.produtosAtivos > 0}
          text="Catálogo com produtos ativos"
        />
        <ChecklistItem
          done={painel.semEstoque === 0}
          text="Sem produtos ativos com estoque zerado"
        />
        <ChecklistItem
          done={painel.atrasados === 0}
          text="Nenhum pedido em atraso logístico"
        />
        <ChecklistItem
          done={painel.entreguesPercent >= 70 || painel.totalPedidos < 5}
          text="Taxa de entrega em bom nível"
        />
      </View>

      <TouchableOpacity style={styles.buttonDanger} onPress={sair}>
        <Ionicons name="log-out-outline" size={15} color="#fecaca" />
        <Text style={styles.buttonDangerText}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MetricCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon} size={14} color="#94a3b8" />
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <Text numberOfLines={1} style={[styles.metricValue, { color }]}>
        {value}
      </Text>
    </View>
  );
}

function QuickAction({
  label,
  icon,
  onPress,
  primary,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickAction, primary ? styles.quickActionPrimary : null]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={15} color={primary ? "#022c22" : "#cbd5e1"} />
      <Text style={[styles.quickText, primary ? styles.quickTextPrimary : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Row({
  label,
  value,
  positive,
  warning,
  danger,
  neutral,
}: {
  label: string;
  value: string;
  positive?: boolean;
  warning?: boolean;
  danger?: boolean;
  neutral?: boolean;
}) {
  let color = "#e2e8f0";
  if (positive) color = "#22c55e";
  if (warning) color = "#facc15";
  if (danger) color = "#ef4444";
  if (neutral) color = "#38bdf8";

  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, { color }]}>{value}</Text>
    </View>
  );
}

function ChecklistItem({ done, text }: { done: boolean; text: string }) {
  return (
    <View style={styles.checkRow}>
      <Ionicons
        name={done ? "checkmark-circle" : "ellipse-outline"}
        size={16}
        color={done ? "#22c55e" : "#94a3b8"}
      />
      <Text style={[styles.checkText, done ? styles.checkTextDone : null]}>{text}</Text>
    </View>
  );
}

function AlertItem({ prioridade, text }: { prioridade: "alta" | "media" | "baixa"; text: string }) {
  const color = prioridade === "alta" ? "#ef4444" : prioridade === "media" ? "#facc15" : "#22c55e";
  const icon: keyof typeof Ionicons.glyphMap =
    prioridade === "alta" ? "alert-circle" : prioridade === "media" ? "warning-outline" : "checkmark-circle";
  const label = prioridade === "alta" ? "Alta" : prioridade === "media" ? "Média" : "Baixa";

  return (
    <View style={[styles.alertRow, { borderColor: color }]}>
      <Ionicons name={icon} size={16} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.alertPriority, { color }]}>{label}</Text>
        <Text style={styles.alertText}>{text}</Text>
      </View>
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
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    color: "#22c55e",
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 2,
  },
  updated: {
    color: "#64748b",
    marginTop: 5,
    fontSize: 12,
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  profileCard: {
    marginTop: 12,
    backgroundColor: "#0b1220",
    borderColor: "#1f2937",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  name: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 8,
  },
  info: {
    color: "#cbd5e1",
    marginTop: 4,
  },
  highlightCard: {
    marginTop: 12,
    backgroundColor: "#071b13",
    borderColor: "#166534",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  highlightLabel: {
    color: "#86efac",
    fontWeight: "700",
    fontSize: 12,
  },
  highlightValue: {
    color: "#f8fafc",
    fontSize: 27,
    fontWeight: "900",
    marginTop: 2,
  },
  highlightRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  highlightMeta: {
    color: "#bbf7d0",
    fontSize: 12,
    fontWeight: "700",
  },
  grid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  metricCard: {
    width: "48.8%",
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 10,
    minHeight: 80,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  metricLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "900",
  },
  sectionCard: {
    marginTop: 12,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 12,
  },
  sectionTitle: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 10,
  },
  metasSubTitle: {
    color: "#cbd5e1",
    fontWeight: "800",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },
  rowLabel: {
    color: "#94a3b8",
    fontWeight: "700",
  },
  rowValue: {
    color: "#e2e8f0",
    fontWeight: "900",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  quickAction: {
    width: "48.8%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 11,
    paddingVertical: 11,
  },
  quickActionPrimary: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  quickText: {
    color: "#cbd5e1",
    fontWeight: "800",
  },
  quickTextPrimary: {
    color: "#022c22",
  },
  progressTrack: {
    marginTop: 4,
    height: 12,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#22c55e",
  },
  progressFillWeek: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#38bdf8",
  },
  progressText: {
    marginTop: 7,
    color: "#86efac",
    fontWeight: "800",
    fontSize: 12,
  },
  progressTextWeek: {
    marginTop: 7,
    color: "#bae6fd",
    fontWeight: "800",
    fontSize: 12,
  },
  metaInputRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  metaInput: {
    flex: 1,
    backgroundColor: "#0a172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    color: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  metaSaveBtn: {
    minWidth: 94,
    backgroundColor: "#22c55e",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  metaSaveText: {
    color: "#022c22",
    fontWeight: "900",
    fontSize: 12,
  },
  metaSaveBtnWeek: {
    minWidth: 94,
    backgroundColor: "#38bdf8",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  metaSaveTextWeek: {
    color: "#082f49",
    fontWeight: "900",
    fontSize: 12,
  },
  metaDivider: {
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    marginVertical: 12,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 13,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
  },
  rankLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeText: {
    color: "#e2e8f0",
    fontWeight: "900",
    fontSize: 11,
  },
  rankTitle: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 13,
  },
  rankMeta: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 2,
  },
  rankValue: {
    color: "#22c55e",
    fontWeight: "900",
    fontSize: 13,
  },
  alertRow: {
    borderWidth: 1,
    backgroundColor: "#091322",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  alertPriority: {
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 2,
  },
  alertText: {
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 17,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 9,
  },
  checkText: {
    color: "#cbd5e1",
    fontWeight: "700",
    flex: 1,
  },
  checkTextDone: {
    color: "#86efac",
  },
  buttonDanger: {
    marginTop: 12,
    backgroundColor: "#3f1d1d",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  buttonDangerText: {
    color: "#fecaca",
    fontWeight: "800",
  },
});
