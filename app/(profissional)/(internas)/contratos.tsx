import { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import PressableScale from "@/components/PressableScale";
import {
  atualizarStatusMarcoEscrow,
  criarMarcosEscrowPadrao,
  listarMarcosEscrow,
} from "@/lib/stage2";
import { formatCurrencyInputBR, parseCurrencyInputBR } from "@/lib/currency";
import { supabase } from "@/lib/supabase";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";

type Contrato = {
  id: string;
  titulo: string;
  descricao: string;
  valor: number;
  status: "pendente" | "em_andamento" | "concluido" | "cancelado";
  pedido_id?: string | null;
};

type Marco = {
  id: string;
  pedido_id: string;
  ordem: number;
  titulo: string;
  valor: number;
  status: string;
};

export default function ContratosProfissional() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [lista, setLista] = useState<Contrato[]>([]);
  const [marcos, setMarcos] = useState<Marco[]>([]);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [pedidoId, setPedidoId] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const carregarContratos = useCallback(async () => {
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
      .from("contratos")
      .select("id, titulo, descricao, valor, status, pedido_id")
      .eq("profissional_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query;

    if (!error) setLista((data || []) as Contrato[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregarContratos();
  }, [carregarContratos]);

  const salvarContrato = async () => {
    if (!titulo || !valor) {
      Alert.alert("Atenção", "Informe título e valor.");
      return;
    }

    const valorNumero = parseCurrencyInputBR(valor);
    if (!valorNumero || valorNumero <= 0) {
      Alert.alert("Atenção", "Informe um valor válido.");
      return;
    }

    setSaving(true);
    try {
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

      const payload = {
        ...(tenantId ? { tenant_id: tenantId } : {}),
        profissional_id: auth.user.id,
        titulo,
        descricao,
        valor: valorNumero,
        pedido_id: pedidoId || null,
        status: "pendente",
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editId) {
        let query = supabase.from("contratos").update(payload).eq("id", editId);
        if (tenantId) {
          query = query.eq("tenant_id", tenantId);
        }
        ({ error } = await query);
      } else {
        ({ error } = await supabase.from("contratos").insert(payload));
      }

      if (error) {
        Alert.alert("Erro", error.message);
        return;
      }

      if (pedidoId && valorNumero > 0) {
        try {
          await criarMarcosEscrowPadrao({ pedidoId, valorTotal: valorNumero });
          await carregarMarcos(pedidoId);
        } catch (escrowError: any) {
          Alert.alert("Aviso", escrowError?.message || "Contrato salvo sem marcos automáticos.");
        }
      }

      limpar();
      carregarContratos();
    } finally {
      setSaving(false);
    }
  };

  const limpar = () => {
    setTitulo("");
    setDescricao("");
    setValor("");
    setPedidoId("");
    setEditId(null);
  };

  const editar = (c: Contrato) => {
    setTitulo(c.titulo);
    setDescricao(c.descricao || "");
    setValor(formatCurrencyInputBR(String(c.valor || 0)));
    setPedidoId(String(c.pedido_id || ""));
    setEditId(c.id);
  };

  const alterarStatus = async (id: string, status: Contrato["status"]) => {
    let tenantId: string | null = null;
    try {
      tenantId = await getCurrentTenantId();
    } catch {
      tenantId = null;
    }

    let query = supabase.from("contratos").update({ status }).eq("id", id);
    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }
    await query;
    carregarContratos();
  };

  const carregarMarcos = async (id: string) => {
    if (!id) {
      setMarcos([]);
      return;
    }
    try {
      const data = await listarMarcosEscrow(id);
      setMarcos((data || []) as Marco[]);
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Falha ao carregar marcos escrow.");
    }
  };

  const atualizarMarco = async (
    marcoId: string,
    status: "em_execucao" | "aprovado" | "liberado" | "disputa",
  ) => {
    try {
      await atualizarStatusMarcoEscrow({ milestoneId: marcoId, status });
      if (pedidoId) await carregarMarcos(pedidoId);
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível atualizar marco.");
    }
  };

  const valorTotal = useMemo(
    () => lista.reduce((acc, item) => acc + Number(item.valor || 0), 0),
    [lista],
  );
  const concluidos = lista.filter((item) => item.status === "concluido").length;
  const emAndamento = lista.filter((item) => item.status === "em_andamento").length;

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
        <View style={styles.titleRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="document-text-outline" size={20} color="#0B0F1A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Governança comercial</Text>
            <Text style={styles.title}>Contratos e Escrow</Text>
          </View>
        </View>
        <Text style={styles.heroText}>
          Organize contratos, marcos e liberação financeira com visão mais executiva de operação.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Contratos</Text>
          <Text style={styles.statValue}>{lista.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Concluídos</Text>
          <Text style={[styles.statValue, { color: "#22c55e" }]}>{concluidos}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Em andamento</Text>
          <Text style={[styles.statValue, { color: "#38bdf8" }]}>{emAndamento}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Valor total</Text>
          <Text style={styles.statValue}>R$ {valorTotal.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{editId ? "Editar Contrato" : "Novo Contrato"}</Text>

        <TextInput placeholder="Título do serviço" placeholderTextColor="#6b7280" style={styles.input} value={titulo} onChangeText={setTitulo} />
        <TextInput placeholder="Descrição" placeholderTextColor="#6b7280" style={[styles.input, { height: 80 }]} value={descricao} onChangeText={setDescricao} multiline />
        <TextInput
          placeholder="R$ 0,00"
          placeholderTextColor="#6b7280"
          style={styles.input}
          value={valor}
          onChangeText={(texto) => setValor(formatCurrencyInputBR(texto))}
          keyboardType="numeric"
        />
        <TextInput placeholder="Pedido ID (opcional p/ escrow)" placeholderTextColor="#6b7280" style={styles.input} value={pedidoId} onChangeText={setPedidoId} />

        <PressableScale style={[styles.primaryBtn, saving && { opacity: 0.6 }]} onPress={salvarContrato} disabled={saving}>
          <Text style={styles.primaryText}>{saving ? "Salvando..." : editId ? "Atualizar" : "Criar contrato"}</Text>
        </PressableScale>

        <View style={styles.stackRow}>
          <PressableScale style={styles.secondaryBtnFull} onPress={() => carregarMarcos(pedidoId)}>
            <Text style={styles.secondaryText}>Ver marcos escrow</Text>
          </PressableScale>
          {editId ? (
            <PressableScale style={styles.secondaryBtnFull} onPress={limpar}>
              <Text style={styles.secondaryText}>Cancelar edição</Text>
            </PressableScale>
          ) : null}
        </View>
      </View>

      {marcos.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Marcos escrow do pedido</Text>
          {marcos.map((m) => (
            <View key={m.id} style={styles.milestone}>
              <Text style={styles.itemTitle}>#{m.ordem} {m.titulo}</Text>
              <Text style={styles.desc}>R$ {Number(m.valor || 0).toFixed(2)} • {m.status}</Text>
              <View style={styles.row}>
                <PressableScale style={[styles.secondaryBtn, styles.secondaryBtnFlex]} onPress={() => atualizarMarco(m.id, "em_execucao")}>
                  <Text style={styles.secondaryText}>Iniciar</Text>
                </PressableScale>
                <PressableScale style={[styles.secondaryBtn, styles.secondaryBtnFlex]} onPress={() => atualizarMarco(m.id, "aprovado")}>
                  <Text style={styles.secondaryText}>Aprovar</Text>
                </PressableScale>
                <PressableScale style={[styles.secondaryBtn, styles.secondaryBtnFlex]} onPress={() => atualizarMarco(m.id, "liberado")}>
                  <Text style={styles.secondaryText}>Liberar</Text>
                </PressableScale>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={lista}
      keyExtractor={(i) => i.id}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={24} color="#facc15" />
          <Text style={styles.emptyTitle}>Nenhum contrato criado ainda</Text>
          <Text style={styles.emptyText}>Crie um contrato para formalizar escopo, valor e marcos da operação.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.itemTitle}>{item.titulo}</Text>
          <Text style={styles.desc}>{item.descricao || "—"}</Text>
          <Text style={styles.status}>{item.status.replace("_", " ").toUpperCase()}</Text>
          <Text style={styles.valor}>R$ {Number(item.valor || 0).toFixed(2)}</Text>

          <View style={styles.row}>
            <PressableScale style={[styles.secondaryBtn, styles.secondaryBtnFlex]} onPress={() => editar(item)}>
              <Text style={styles.secondaryText}>Editar</Text>
            </PressableScale>
            <PressableScale style={[styles.secondaryBtn, styles.secondaryBtnFlex]} onPress={() => alterarStatus(item.id, "em_andamento")}>
              <Text style={styles.secondaryText}>Iniciar</Text>
            </PressableScale>
            <PressableScale style={[styles.secondaryBtn, styles.secondaryBtnFlex]} onPress={() => alterarStatus(item.id, "concluido")}>
              <Text style={styles.secondaryText}>Concluir</Text>
            </PressableScale>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a" },
  listContent: { padding: 16, paddingBottom: 140 },
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
  title: { color: "#f8fafc", fontSize: 24, fontWeight: "900" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
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
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 12, flexWrap: "wrap" },
  statCard: {
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 0,
    backgroundColor: "#081121",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 12,
  },
  statLabel: { color: "#9ca3af", fontSize: 12, lineHeight: 16, textAlign: "center" },
  statValue: { color: "#facc15", fontWeight: "900", fontSize: 18, marginTop: 6, textAlign: "center" },
  card: {
    backgroundColor: "#081121",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: { color: "#e5e7eb", fontWeight: "900", marginBottom: 10 },
  input: {
    backgroundColor: "#03040a",
    borderRadius: 12,
    padding: 12,
    color: "#e5e7eb",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#0b1220",
  },
  primaryBtn: {
    backgroundColor: "#facc15",
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: { color: "#000", fontWeight: "900" },
  itemTitle: { color: "#e5e7eb", fontWeight: "900", fontSize: 16 },
  desc: { color: "#9ca3af", marginTop: 4 },
  status: { marginTop: 6, color: "#38bdf8", fontWeight: "900" },
  valor: { color: "#e5e7eb", fontWeight: "900", marginTop: 4 },
  row: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  stackRow: { gap: 8, marginTop: 12 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#374151",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryBtnFlex: {
    flexGrow: 1,
    flexBasis: 90,
  },
  secondaryBtnFull: {
    borderWidth: 1,
    borderColor: "#374151",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  secondaryText: { color: "#e5e7eb", fontWeight: "800", fontSize: 12, textAlign: "center", flexShrink: 1 },
  milestone: {
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: "#081121",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 18,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 16,
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
});
