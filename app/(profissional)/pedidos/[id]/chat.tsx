import { supabase } from "@/lib/supabase";
import { getCurrentTenantId } from "@/lib/tenant";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
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
};

export default function ChatProfissional() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [mensagem, setMensagem] = useState("");
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    const pedidoId = String(id || "");

    const { data: rpcData, error: rpcError } = await supabase.rpc("listar_mensagens_chat", {
      p_pedido_id: pedidoId,
    });

    if (!rpcError && Array.isArray(rpcData)) {
      const listaRpc = (rpcData as any[]).map((item) => ({
        id: String(item.id),
        texto: String(item.texto || ""),
        remetente: (item.remetente || "cliente") as "cliente" | "profissional",
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
      remetente: (item.remetente ?? item.remetente_tipo ?? "cliente") as "cliente" | "profissional",
    }));

    setMensagens(lista);
  }, [id]);

  async function enviar() {
    const conteudo = mensagem.trim();
    if (!conteudo || enviando) return;
    setEnviando(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const remetenteId = session?.user?.id || null;
    const pedidoId = String(id || "");

    const { error: rpcError } = await supabase.rpc("enviar_mensagem_chat", {
      p_pedido_id: pedidoId,
      p_texto: conteudo,
      p_remetente: "profissional",
    });

    if (!rpcError) {
      setMensagem("");
      await carregar();
      setEnviando(false);
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
        remetente_tipo: "profissional",
        remetente_id: remetenteId,
      },
      {
        tenant_id: tenantId,
        pedido_id: pedidoId,
        texto: conteudo,
        remetente: "profissional",
      },
      {
        tenant_id: tenantId,
        pedido_id: pedidoId,
        mensagem: conteudo,
        texto: conteudo,
        remetente_tipo: "profissional",
        remetente: "profissional",
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
          remetente: "profissional",
        },
      ]);
      setMensagem("");
      await carregar();
      setEnviando(false);
    } else {
      console.log("ERRO ENVIAR MENSAGEM PROFISSIONAL:", ultimoErro);
      Alert.alert(
        "Erro ao enviar",
        String(ultimoErro?.message || "Não foi possível enviar a mensagem.")
      );
      setEnviando(false);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await carregar();
      setLoading(false);
    })();
  }, [carregar]);

  useEffect(() => {
    if (!id) return;
    const timer = setInterval(() => {
      void carregar();
    }, 3500);
    return () => clearInterval(timer);
  }, [carregar, id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#0B0F1A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Canal do profissional</Text>
            <Text style={styles.title}>Chat do pedido</Text>
          </View>
        </View>
        <Text style={styles.heroText}>
          Centralize a conversa com o cliente e mantenha o histórico do pedido em um fluxo claro e profissional.
        </Text>
      </View>

        <FlatList
          data={mensagens}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => {
          const enviadoProfissional = item.remetente === "profissional";
          return (
            <View style={[styles.row, enviadoProfissional ? styles.rowRight : styles.rowLeft]}>
              <View
                style={[
                  styles.messageWrap,
                  enviadoProfissional ? styles.messageWrapRight : styles.messageWrapLeft,
                ]}
              >
                <Text style={styles.messageAuthor}>{enviadoProfissional ? "Você" : "Cliente"}</Text>
                <View
                  style={[
                    styles.bubble,
                    enviadoProfissional ? styles.bubbleProfissional : styles.bubbleCliente,
                  ]}
                >
                  <Text style={[styles.text, !enviadoProfissional && styles.textClient]}>
                    {item.texto}
                  </Text>
                </View>
              </View>
            </View>
          );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={30} color="#facc15" />
              <Text style={styles.emptyTitle}>Nenhuma mensagem ainda</Text>
              <Text style={styles.emptyText}>
                Quando a conversa começar, o histórico vai aparecer aqui.
              </Text>
            </View>
          }
        />

        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom + 8, 14) }]}>
          <TextInput
            placeholder="Digite sua mensagem"
            placeholderTextColor="#9CA3AF"
            value={mensagem}
            onChangeText={setMensagem}
            style={styles.input}
          />

          <TouchableOpacity onPress={enviar} style={styles.send} disabled={enviando}>
            {enviando ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="send-outline" size={16} color="#000" />
                <Text style={styles.sendText}>Enviar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0F1A" },
  center: {
    flex: 1,
    backgroundColor: "#0B0F1A",
    justifyContent: "center",
    alignItems: "center",
  },
  heroCard: {
    margin: 12,
    marginBottom: 6,
    backgroundColor: "#081121",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
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
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
    flexGrow: 1,
  },
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
  messageWrap: {
    maxWidth: "84%",
  },
  messageWrapLeft: {
    alignItems: "flex-start",
  },
  messageWrapRight: {
    alignItems: "flex-end",
  },
  messageAuthor: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  bubbleProfissional: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  bubbleCliente: {
    backgroundColor: "#111827",
    borderColor: "#304767",
  },
  text: { color: "#0B0F1A", fontWeight: "700", lineHeight: 20 },
  textClient: { color: "#E5E7EB" },
  inputArea: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#223854",
    backgroundColor: "#0B0F1A",
  },
  input: {
    flex: 1,
    backgroundColor: "#111827",
    color: "#fff",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#304767",
  },
  send: {
    backgroundColor: "#FACC15",
    marginLeft: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    borderRadius: 16,
  },
  sendText: { fontWeight: "800", color: "#000" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  emptyTitle: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 18,
    marginTop: 14,
    marginBottom: 6,
    textAlign: "center",
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
});
