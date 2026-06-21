import { Ionicons } from "@expo/vector-icons";
import { formatMoney } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { resolveCurrentTenantId } from "@/lib/tenant";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Produto = {
  id: string;
  titulo: string;
  descricao?: string | null;
  categoria?: string | null;
  preco: number;
  preco_de?: number | null;
  preco_por?: number | null;
  estoque: number;
  ativo: boolean;
  created_at?: string | null;
};

type ProdutoFiltro = "todos" | "ativos" | "inativos" | "estoque_baixo" | "sem_estoque";

function onlyDigits(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function formatCurrencyInput(value: string) {
  const digits = onlyDigits(value);
  const cents = Number(digits || 0);
  const number = cents / 100;
  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function parseCurrencyInput(value: string) {
  const normalized = String(value || "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export default function FornecedorProdutos() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [precoDe, setPrecoDe] = useState("");
  const [precoPor, setPrecoPor] = useState("");
  const [estoque, setEstoque] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<ProdutoFiltro>("todos");
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const carregarProdutos = useCallback(async () => {
    try {
      setLoading(true);
      const tenantId = await resolveCurrentTenantId();
      let query = supabase
        .from("produtos_fornecedor")
        .select("id, titulo, descricao, categoria, preco, preco_de, preco_por, estoque, ativo, created_at")
        .order("created_at", { ascending: false });
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }
      const { data, error } = await query;

      if (error) throw error;
      setProdutos((data as Produto[]) || []);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível carregar produtos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarProdutos();
    }, [carregarProdutos])
  );

  const stats = useMemo(() => {
    const total = produtos.length;
    const ativos = produtos.filter((p) => Boolean(p.ativo)).length;
    const inativos = total - ativos;
    const estoqueTotal = produtos.reduce((acc, p) => acc + Number(p.estoque || 0), 0);
    const estoqueBaixo = produtos.filter((p) => Boolean(p.ativo) && Number(p.estoque || 0) > 0 && Number(p.estoque || 0) <= 3).length;
    const semEstoque = produtos.filter((p) => Boolean(p.ativo) && Number(p.estoque || 0) <= 0).length;
    const valorEstoque = produtos.reduce(
      (acc, p) => acc + Number(p.preco || 0) * Number(p.estoque || 0),
      0
    );
    return { total, ativos, inativos, estoqueTotal, estoqueBaixo, semEstoque, valorEstoque };
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    const term = busca.trim().toLowerCase();
    return produtos
      .filter((produto) => {
        if (filtro === "ativos") return Boolean(produto.ativo);
        if (filtro === "inativos") return !produto.ativo;
        if (filtro === "estoque_baixo") {
          return Boolean(produto.ativo) && Number(produto.estoque || 0) > 0 && Number(produto.estoque || 0) <= 3;
        }
        if (filtro === "sem_estoque") return Boolean(produto.ativo) && Number(produto.estoque || 0) <= 0;
        return true;
      })
      .filter((produto) => {
        if (!term) return true;
        const tituloMatch = String(produto.titulo || "").toLowerCase().includes(term);
        const categoriaMatch = String(produto.categoria || "").toLowerCase().includes(term);
        return tituloMatch || categoriaMatch;
      });
  }, [produtos, filtro, busca]);

  async function salvarProduto() {
    if (!titulo.trim() || !precoDe.trim() || !estoque.trim()) {
      Alert.alert("Atenção", "Preencha título, preço De e estoque.");
      return;
    }

    const precoDeNumero = parseCurrencyInput(precoDe);
    const precoPorNumero = parseCurrencyInput(precoPor);
    const estoqueNumero = Number(estoque);

    if (!Number.isFinite(precoDeNumero) || precoDeNumero <= 0) {
      Alert.alert("Atenção", "Preço De inválido.");
      return;
    }
    if (precoPor.trim() && (!Number.isFinite(precoPorNumero) || precoPorNumero <= 0)) {
      Alert.alert("Atenção", "Preço Por inválido.");
      return;
    }
    if (precoPor.trim() && precoPorNumero >= precoDeNumero) {
      Alert.alert("Atenção", "O preço Por deve ser menor que o preço De.");
      return;
    }
    if (!Number.isFinite(estoqueNumero) || estoqueNumero < 0) {
      Alert.alert("Atenção", "Estoque inválido.");
      return;
    }
    const precoPromocional = precoPor.trim() ? Number(precoPorNumero.toFixed(2)) : null;
    const precoEfetivo = precoPromocional && precoPromocional > 0 ? precoPromocional : Number(precoDeNumero.toFixed(2));

    try {
      setSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Usuário não autenticado.");

      const tenantId = await resolveCurrentTenantId();
      if (!tenantId) {
        throw new Error("Tenant ativo não encontrado.");
      }

      const { error } = await supabase.from("produtos_fornecedor").insert({
        tenant_id: tenantId,
        fornecedor_id: session.user.id,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        categoria: categoria.trim() || null,
        preco: precoEfetivo,
        preco_de: Number(precoDeNumero.toFixed(2)),
        preco_por: precoPromocional,
        estoque: estoqueNumero,
        ativo: true,
        imagem_url: imagemUrl.trim() || null,
      });

      if (error) throw error;

      setTitulo("");
      setDescricao("");
      setCategoria("");
      setPrecoDe("");
      setPrecoPor("");
      setEstoque("");
      setImagemUrl("");

      Alert.alert("Sucesso", "Produto cadastrado.");
      await carregarProdutos();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível salvar o produto.");
    } finally {
      setSaving(false);
    }
  }

  async function alternarAtivo(id: string, ativoAtual: boolean) {
    try {
      setTogglingId(id);
      const tenantId = await resolveCurrentTenantId();
      let query = supabase
        .from("produtos_fornecedor")
        .update({ ativo: !ativoAtual })
        .eq("id", id);
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }
      const { error } = await query;
      if (error) throw error;
      await carregarProdutos();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível atualizar status.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void carregarProdutos();
          }}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Produtos</Text>
          <Text style={styles.subtitle}>Gestão inteligente do catálogo do fornecedor</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => void carregarProdutos()}>
          <Ionicons name="refresh" size={15} color="#022c22" />
        </TouchableOpacity>
      </View>

      <View style={styles.highlightCard}>
        <Text style={styles.highlightLabel}>Valor estimado em estoque</Text>
        <Text style={styles.highlightValue}>{formatMoney(stats.valorEstoque)}</Text>
        <View style={styles.highlightRow}>
          <Text style={styles.highlightMeta}>Itens em estoque: {stats.estoqueTotal}</Text>
          <Text style={styles.highlightMeta}>Produtos ativos: {stats.ativos}</Text>
        </View>
      </View>

      <View style={styles.kpiGrid}>
        <KpiCard label="Total" value={String(stats.total)} color="#f8fafc" />
        <KpiCard label="Ativos" value={String(stats.ativos)} color="#22c55e" />
        <KpiCard label="Inativos" value={String(stats.inativos)} color="#94a3b8" />
        <KpiCard label="Estoque baixo" value={String(stats.estoqueBaixo)} color="#facc15" />
        <KpiCard label="Sem estoque" value={String(stats.semEstoque)} color="#ef4444" />
        <KpiCard label="Visíveis agora" value={String(produtosFiltrados.length)} color="#38bdf8" />
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionTopRow}>
          <Text style={styles.sectionTitle}>Cadastro de produto</Text>
          <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowForm((prev) => !prev)}>
            <Ionicons name={showForm ? "chevron-up" : "chevron-down"} size={16} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {showForm ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Título do produto"
              placeholderTextColor="#94a3b8"
              value={titulo}
              onChangeText={setTitulo}
            />
            <TextInput
              style={styles.input}
              placeholder="Descrição"
              placeholderTextColor="#94a3b8"
              value={descricao}
              onChangeText={setDescricao}
            />
            <TextInput
              style={styles.input}
              placeholder="Categoria (ex.: Ferramentas)"
              placeholderTextColor="#94a3b8"
              value={categoria}
              onChangeText={setCategoria}
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.rowInput]}
                placeholder="De (preço original)"
                placeholderTextColor="#94a3b8"
                value={precoDe}
                onChangeText={(text) => setPrecoDe(formatCurrencyInput(text))}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, styles.rowInput]}
                placeholder="Por (promoção)"
                placeholderTextColor="#94a3b8"
                value={precoPor}
                onChangeText={(text) => setPrecoPor(text ? formatCurrencyInput(text) : "")}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, styles.rowInput]}
                placeholder="Estoque"
                placeholderTextColor="#94a3b8"
                value={estoque}
                onChangeText={(text) => setEstoque(onlyDigits(text))}
                keyboardType="number-pad"
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="URL da imagem (opcional)"
              placeholderTextColor="#94a3b8"
              value={imagemUrl}
              onChangeText={setImagemUrl}
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={() => void salvarProduto()} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={16} color="#000" />
                  <Text style={styles.primaryBtnText}>Salvar produto</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.cardHint}>Formulário recolhido. Toque na seta para abrir.</Text>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Catálogo</Text>
        <TextInput
          style={styles.input}
          placeholder="Buscar por produto ou categoria"
          placeholderTextColor="#64748b"
          value={busca}
          onChangeText={setBusca}
        />

        <View style={styles.filterRow}>
          {[
            { id: "todos", label: "Todos" },
            { id: "ativos", label: "Ativos" },
            { id: "inativos", label: "Inativos" },
            { id: "estoque_baixo", label: "Estoque baixo" },
            { id: "sem_estoque", label: "Sem estoque" },
          ].map((chip) => {
            const active = filtro === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[styles.filterChip, active ? styles.filterChipActive : null]}
                onPress={() => setFiltro(chip.id as ProdutoFiltro)}
              >
                <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator color="#22c55e" style={{ marginTop: 10 }} />
        ) : produtosFiltrados.length === 0 ? (
          <Text style={styles.cardHint}>Nenhum produto encontrado para este filtro.</Text>
        ) : (
          produtosFiltrados.map((produto) => {
            const lowStock = Number(produto.estoque || 0) > 0 && Number(produto.estoque || 0) <= 3;
            const noStock = Number(produto.estoque || 0) <= 0;
            const statusColor = produto.ativo ? "#22c55e" : "#94a3b8";
            return (
              <View key={produto.id} style={styles.produtoCard}>
                <View style={styles.produtoTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.produtoTitulo}>{produto.titulo}</Text>
                    <Text style={styles.produtoMeta} numberOfLines={1}>
                      {produto.categoria || "Sem categoria"}
                    </Text>
                  </View>
                  <View style={[styles.badge, { borderColor: statusColor }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>
                      {produto.ativo ? "Ativo" : "Inativo"}
                    </Text>
                  </View>
                </View>

                <View style={styles.produtoRow}>
                  <View>
                    {Number(produto.preco_por || 0) > 0 ? (
                      <Text style={styles.produtoPrecoDe}>
                        De: {formatMoney(Number(produto.preco_de || produto.preco || 0))}
                      </Text>
                    ) : null}
                    <Text style={styles.produtoPreco}>
                      {Number(produto.preco_por || 0) > 0
                        ? `Por: ${formatMoney(Number(produto.preco_por || produto.preco || 0))}`
                        : formatMoney(Number(produto.preco || 0))}
                    </Text>
                  </View>
                  <View style={styles.estoqueGroup}>
                    <Text style={styles.estoqueLabel}>Estoque: {produto.estoque}</Text>
                    {noStock ? (
                      <View style={[styles.badge, { borderColor: "#ef4444" }]}>
                        <Text style={[styles.badgeText, { color: "#ef4444" }]}>Zerado</Text>
                      </View>
                    ) : lowStock ? (
                      <View style={[styles.badge, { borderColor: "#facc15" }]}>
                        <Text style={[styles.badgeText, { color: "#facc15" }]}>Baixo</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={styles.produtoActions}>
                  <TouchableOpacity
                    style={[
                      styles.toggleStatusBtn,
                      produto.ativo ? styles.toggleStatusBtnOn : styles.toggleStatusBtnOff,
                    ]}
                    onPress={() => void alternarAtivo(produto.id, Boolean(produto.ativo))}
                    disabled={togglingId === produto.id}
                  >
                    {togglingId === produto.id ? (
                      <ActivityIndicator size="small" color="#e5e7eb" />
                    ) : (
                      <Text style={styles.toggleStatusText}>
                        {produto.ativo ? "Desativar produto" : "Ativar produto"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/(fornecedor)/pedidos")}>
          <Ionicons name="receipt-outline" size={14} color="#cbd5e1" />
          <Text style={styles.secondaryBtnText}>Ir para Pedidos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/(fornecedor)/financeiro")}>
          <Ionicons name="wallet-outline" size={14} color="#cbd5e1" />
          <Text style={styles.secondaryBtnText}>Ir para Financeiro</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 16, paddingBottom: 26 },
  hero: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  title: { color: "#22c55e", fontSize: 26, fontWeight: "900" },
  subtitle: { color: "#94a3b8", marginTop: 3 },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22c55e",
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
    fontWeight: "900",
    fontSize: 26,
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
    fontWeight: "700",
    fontSize: 12,
  },
  kpiGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  kpiCard: {
    width: "48.8%",
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 10,
  },
  kpiLabel: {
    color: "#94a3b8",
    fontWeight: "700",
    fontSize: 11,
  },
  kpiValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "900",
    color: "#f8fafc",
  },
  sectionCard: {
    marginTop: 12,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 12,
  },
  sectionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#e2e8f0",
    fontWeight: "900",
    fontSize: 15,
  },
  toggleBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardHint: {
    color: "#94a3b8",
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#03040a",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#e5e7eb",
    marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 8 },
  rowInput: { flex: 1 },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: "#22c55e",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  primaryBtnText: { color: "#000", fontWeight: "900" },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  filterChip: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#111827",
  },
  filterChipActive: {
    borderColor: "#22c55e",
    backgroundColor: "#14532d",
  },
  filterChipText: { color: "#cbd5e1", fontWeight: "700", fontSize: 11 },
  filterChipTextActive: { color: "#dcfce7" },
  produtoCard: {
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    backgroundColor: "#03040a",
  },
  produtoTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  produtoTitulo: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 14,
  },
  produtoMeta: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 3,
  },
  produtoRow: {
    marginTop: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  produtoPreco: {
    color: "#22c55e",
    fontWeight: "900",
    fontSize: 15,
  },
  produtoPrecoDe: {
    color: "#94a3b8",
    fontSize: 11,
    textDecorationLine: "line-through",
    marginBottom: 1,
  },
  estoqueGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  estoqueLabel: {
    color: "#cbd5e1",
    fontWeight: "700",
    fontSize: 12,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#091322",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  produtoActions: {
    marginTop: 10,
  },
  toggleStatusBtn: {
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleStatusBtnOn: {
    backgroundColor: "#3f1d1d",
    borderWidth: 1,
    borderColor: "#7f1d1d",
  },
  toggleStatusBtnOff: {
    backgroundColor: "#14532d",
    borderWidth: 1,
    borderColor: "#15803d",
  },
  toggleStatusText: {
    color: "#e5e7eb",
    fontWeight: "800",
    fontSize: 12,
  },
  quickActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1220",
    flexDirection: "row",
    gap: 6,
  },
  secondaryBtnText: {
    color: "#cbd5e1",
    fontWeight: "800",
    fontSize: 12,
  },
});
