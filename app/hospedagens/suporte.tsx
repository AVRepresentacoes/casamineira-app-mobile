import {
  abrirChamadoHospedagens,
  listarChamadosHospedagens,
  type CaminhoHospedagemChamado,
} from "@/lib/caminhosHospedagens";
import { useRequireHospedagensAuth } from "@/lib/hospedagensAuth";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TIPOS: { key: CaminhoHospedagemChamado["tipo"]; label: string }[] = [
  { key: "duvida", label: "Dúvida" },
  { key: "pagamento", label: "Pagamento" },
  { key: "cancelamento", label: "Cancelamento" },
  { key: "reembolso", label: "Reembolso" },
  { key: "problema_quarto", label: "Problema no quarto" },
  { key: "pousada_indisponivel", label: "Pousada indisponível" },
];

function statusLabel(status: string) {
  const map: Record<string, string> = {
    aberto: "Aberto",
    em_analise: "Em análise",
    aguardando_resposta: "Aguardando resposta",
    resolvido: "Resolvido",
    fechado: "Fechado",
  };
  return map[status] || status;
}

export default function HospedagensSuporteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [chamados, setChamados] = useState<CaminhoHospedagemChamado[]>([]);
  const [tipo, setTipo] = useState<CaminhoHospedagemChamado["tipo"]>("duvida");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { checkingAuth } = useRequireHospedagensAuth();

  const load = useCallback(() => {
    let mounted = true;
    if (checkingAuth) return () => {
      mounted = false;
    };
    setLoading(true);
    listarChamadosHospedagens("cliente")
      .then((data) => {
        if (mounted) setChamados(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [checkingAuth]);

  useFocusEffect(load);

  if (checkingAuth) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#12372A" />
      </View>
    );
  }

  async function handleOpenTicket() {
    if (!titulo.trim() || !descricao.trim()) {
      Alert.alert("Dados obrigatórios", "Informe título e descrição do chamado.");
      return;
    }
    try {
      setSaving(true);
      await abrirChamadoHospedagens({
        papel: "cliente",
        tipo,
        titulo,
        descricao,
        prioridade: tipo === "pousada_indisponivel" || tipo === "reembolso" ? "alta" : "normal",
      });
      setTitulo("");
      setDescricao("");
      setChamados(await listarChamadosHospedagens("cliente"));
      Alert.alert("Chamado aberto", "Nossa operação recebeu sua solicitação.");
    } catch (error: any) {
      Alert.alert("Atenção", error?.message || "Não foi possível abrir o chamado.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#12372A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Ajuda e suporte</Text>
          <Text style={styles.title}>Central do cliente</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Conte com a operação quando algo sair do combinado.</Text>
        <Text style={styles.heroText}>Abra chamados sobre pagamento, reserva, pousada, reembolso ou dúvidas da sua jornada.</Text>
      </View>

      <View style={styles.card}>
        <SectionTitle title="Abrir chamado" icon="chatbubble-ellipses-outline" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
          {TIPOS.map((item) => (
            <Pressable key={item.key} style={[styles.typeChip, tipo === item.key && styles.typeChipActive]} onPress={() => setTipo(item.key)}>
              <Text style={[styles.typeText, tipo === item.key && styles.typeTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Field label="Título" value={titulo} onChangeText={setTitulo} placeholder="Ex.: Dúvida sobre meu check-in" />
        <Field label="Descrição" value={descricao} onChangeText={setDescricao} placeholder="Explique o que aconteceu e informe datas, pousada ou reserva se possível." multiline />
        <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={handleOpenTicket} disabled={saving}>
          {saving ? <ActivityIndicator color="#12372A" /> : <Text style={styles.primaryButtonText}>Enviar chamado</Text>}
        </Pressable>
      </View>

      <View style={styles.card}>
        <SectionTitle title="Meus chamados" icon="list-outline" />
        {loading ? <ActivityIndicator color="#12372A" /> : null}
        {!loading && !chamados.length ? <Text style={styles.emptyText}>Você ainda não abriu chamados.</Text> : null}
        {chamados.map((item) => (
          <View key={item.id} style={styles.ticket}>
            <View style={styles.ticketHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ticketTitle}>{item.titulo}</Text>
                <Text style={styles.ticketMeta}>{item.tipo} • {statusLabel(item.status)}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.prioridade}</Text>
              </View>
            </View>
            <Text style={styles.ticketText}>{item.descricao}</Text>
            {item.respostaAdmin ? <Text style={styles.answerText}>Resposta: {item.respostaAdmin}</Text> : null}
          </View>
        ))}
      </View>
    </ScrollView>
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

function Field({
  label,
  multiline,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput {...props} multiline={multiline} placeholderTextColor="#8A7B61" style={[styles.input, multiline && styles.textArea]} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  center: { flex: 1, backgroundColor: "#F7F0DF", alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 16, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  eyebrow: { color: "#4E7C59", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#12372A", fontSize: 25, fontWeight: "900" },
  hero: { backgroundColor: "#12372A", borderRadius: 8, padding: 16, gap: 6 },
  heroTitle: { color: "#FFF9EA", fontSize: 21, lineHeight: 27, fontWeight: "900" },
  heroText: { color: "#E5D9BD", lineHeight: 20 },
  card: { backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 14, gap: 12 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { color: "#12372A", fontSize: 18, fontWeight: "900", flex: 1 },
  typeRow: { gap: 8, paddingRight: 16 },
  typeChip: { minHeight: 38, borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", backgroundColor: "#FFF9EA", justifyContent: "center", paddingHorizontal: 12 },
  typeChipActive: { backgroundColor: "#12372A", borderColor: "#12372A" },
  typeText: { color: "#12372A", fontWeight: "900" },
  typeTextActive: { color: "#F7D58B" },
  field: { gap: 6 },
  fieldLabel: { color: "#315342", fontSize: 13, fontWeight: "900" },
  input: { minHeight: 48, borderRadius: 8, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#E5D9BD", paddingHorizontal: 12, color: "#12372A", fontSize: 15 },
  textArea: { minHeight: 110, paddingTop: 12, textAlignVertical: "top" },
  primaryButton: { minHeight: 50, borderRadius: 8, backgroundColor: "#F7D58B", alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#12372A", fontWeight: "900", fontSize: 15 },
  disabled: { opacity: 0.65 },
  emptyText: { color: "#6B7280", lineHeight: 20 },
  ticket: { borderTopWidth: 1, borderTopColor: "#E5D9BD", paddingTop: 12, gap: 8 },
  ticketHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  ticketTitle: { color: "#12372A", fontSize: 16, fontWeight: "900" },
  ticketMeta: { color: "#6B7280", marginTop: 2, fontWeight: "700" },
  ticketText: { color: "#4B5563", lineHeight: 20 },
  answerText: { color: "#0F6B4F", lineHeight: 20, backgroundColor: "#ECFDF3", borderRadius: 8, padding: 10 },
  badge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "#12372A" },
  badgeText: { color: "#F7D58B", fontSize: 11, fontWeight: "900" },
});
