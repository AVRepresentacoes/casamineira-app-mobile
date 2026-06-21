import { supabase } from "@/lib/supabase";
import { getCurrentTenantId } from "@/lib/tenant";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Mensagem = {
  id: string;
  texto: string;
  remetente: "cliente" | "profissional";
  created_at?: string | null;
};

export default function ChatPedido() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [podeUsarChat, setPodeUsarChat] = useState(false);

  const carregarPedido = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setPedido(null);
      setPodeUsarChat(false);
      return null;
    }

    const { data } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", id)
      .eq("cliente_id", session.user.id)
      .maybeSingle();

    if (data) {
      setPedido(data);
      const permitido =
        data.status === "aceita" ||
        data.status === "em_execucao" ||
        data.status === "em_andamento" ||
        data.status === "finalizado";
      setPodeUsarChat(permitido);
      return data;
    }

    setPedido(null);
    setPodeUsarChat(false);
    return null;
  }, [id]);

  const carregarMensagens = useCallback(async () => {
    const pedidoId = String(id || "");

    const { data: rpcData, error: rpcError } = await supabase.rpc("listar_mensagens_chat", {
      p_pedido_id: pedidoId,
    });

    if (!rpcError && Array.isArray(rpcData)) {
      const listaRpc = (rpcData as any[]).map((item) => ({
        id: String(item.id),
        texto: String(item.texto || ""),
        remetente: (item.remetente || "profissional") as "cliente" | "profissional",
        created_at: item.created_at,
      }));
      setMensagens(listaRpc);
      return;
    }

    const { data } = await supabase
      .from("mensagens")
      .select("*")
      .eq("pedido_id", pedidoId)
      .order("created_at", { ascending: true });

    const lista = ((data || []) as any[]).map((item) => ({
      id: String(item.id),
      texto: String(item.texto ?? item.mensagem ?? ""),
      remetente: (item.remetente ?? item.remetente_tipo ?? "profissional") as
        | "cliente"
        | "profissional",
      created_at: item.created_at,
    }));

    setMensagens(lista);
  }, [id]);

  const inicializar = useCallback(async () => {
    setLoading(true);
    const pedidoAtual = await carregarPedido();
    if (pedidoAtual) {
      await carregarMensagens();
    } else {
      setMensagens([]);
    }
    setLoading(false);
  }, [carregarMensagens, carregarPedido]);

  useEffect(() => {
    void inicializar();
  }, [inicializar]);

  useEffect(() => {
    if (!podeUsarChat || !id) return;
    const timer = setInterval(() => {
      void carregarMensagens();
    }, 3500);
    return () => clearInterval(timer);
  }, [carregarMensagens, podeUsarChat, id]);

  async function enviarMensagem() {
    const conteudo = texto.trim();
    if (!conteudo || !podeUsarChat) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const remetenteId = session?.user?.id || null;
    const pedidoId = String(id || "");

    const { error: rpcError } = await supabase.rpc("enviar_mensagem_chat", {
      p_pedido_id: pedidoId,
      p_texto: conteudo,
      p_remetente: "cliente",
    });

    if (!rpcError) {
      setTexto("");
      await carregarMensagens();
      return;
    }

    let tenantId: string | null = null;
    try {
      tenantId = await getCurrentTenantId();
    } catch {
      tenantId = null;
    }

    const tentativas = [
      {
        tenant_id: tenantId,
        pedido_id: pedidoId,
        mensagem: conteudo,
        remetente_tipo: "cliente",
        remetente_id: remetenteId,
      },
      {
        tenant_id: tenantId,
        pedido_id: pedidoId,
        texto: conteudo,
        remetente: "cliente",
      },
      {
        tenant_id: tenantId,
        pedido_id: pedidoId,
        mensagem: conteudo,
        texto: conteudo,
        remetente_tipo: "cliente",
        remetente: "cliente",
        remetente_id: remetenteId,
      },
    ];

    let ultimoErro: any = null;
    let sucesso = false;

    for (const payload of tentativas) {
      const { error } = await supabase.from("mensagens").insert(payload as any);
      if (!error) {
        sucesso = true;
        break;
      }
      ultimoErro = error;
    }

    if (sucesso) {
      setMensagens((prev) => [
        ...prev,
        {
          id: `tmp-${Date.now()}`,
          texto: conteudo,
          remetente: "cliente",
          created_at: new Date().toISOString(),
        },
      ]);
      setTexto("");
      await carregarMensagens();
    } else {
      console.log("ERRO ENVIAR MENSAGEM CLIENTE:", ultimoErro);
      Alert.alert(
        "Erro ao enviar",
        String(ultimoErro?.message || "Não foi possível enviar a mensagem.")
      );
    }
  }

  if (loading) {
    return (
      <View style={styles.lockContainer}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={styles.lockContainer}>
        <Text style={styles.lockTitle}>Pedido não encontrado</Text>
        <Text style={styles.lockText}>
          Não foi possível carregar este chat para a sua conta.
        </Text>
      </View>
    );
  }

  if (!podeUsarChat) {
    return (
      <View style={styles.lockContainer}>
        <Text style={styles.lockTitle}>Chat indisponível</Text>
        <Text style={styles.lockText}>
          O chat será liberado após o cliente aceitar uma proposta.
        </Text>

        <TouchableOpacity
          style={styles.lockButton}
          onPress={() => router.push(`/(cliente)/pedidos/${id}`)}
        >
          <Text style={styles.lockButtonText}>Voltar ao pedido</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={mensagens}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 8, paddingBottom: 12 }}
        renderItem={({ item }) => {
          const enviadaCliente = item.remetente === "cliente";
          return (
            <View style={[styles.row, enviadaCliente ? styles.rowRight : styles.rowLeft]}>
              <View style={[styles.bubble, enviadaCliente ? styles.bubbleCliente : styles.bubbleProfissional]}>
                <Text style={styles.text}>{item.texto}</Text>
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom + 8, 14) }]}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Digite sua mensagem"
          placeholderTextColor="#6B7280"
          style={styles.input}
        />
        <TouchableOpacity style={styles.send} onPress={enviarMensagem}>
          <Text style={styles.sendText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0F1A" },
  row: {
    width: "100%",
    marginBottom: 8,
  },
  rowLeft: {
    alignItems: "flex-start",
  },
  rowRight: {
    alignItems: "flex-end",
  },
  bubble: {
    maxWidth: "82%",
    padding: 12,
    borderRadius: 12,
  },
  bubbleCliente: {
    backgroundColor: "#1d4ed8",
  },
  bubbleProfissional: {
    backgroundColor: "#111827",
  },
  text: { color: "#FFFFFF" },

  inputArea: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#1F2937",
    backgroundColor: "#0B0F1A",
  },

  input: {
    flex: 1,
    backgroundColor: "#111827",
    color: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
  },

  send: {
    backgroundColor: "#FACC15",
    marginLeft: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 10,
  },

  sendText: { fontWeight: "700" },

  lockContainer: {
    flex: 1,
    backgroundColor: "#0B0F1A",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  lockTitle: {
    color: "#FACC15",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },

  lockText: {
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 20,
  },

  lockButton: {
    backgroundColor: "#6366F1",
    padding: 14,
    borderRadius: 12,
  },

  lockButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
});
