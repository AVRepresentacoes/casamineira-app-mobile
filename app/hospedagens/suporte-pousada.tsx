import {
  abrirChamadoHospedagens,
  listarChamadosHospedagens,
  type CaminhoHospedagemChamado,
} from "@/lib/caminhosHospedagens";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TIPOS: { key: CaminhoHospedagemChamado["tipo"]; label: string }[] = [
  { key: "pagamento", label: "Pagamento" },
  { key: "cancelamento", label: "Cancelamento" },
  { key: "no_show", label: "No-show" },
  { key: "divergencia_preco", label: "Divergência" },
  { key: "problema_quarto", label: "Quarto" },
  { key: "outro", label: "Outro" },
];

export default function HospedagensSuportePousadaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pousadaId } = useLocalSearchParams<{ pousadaId?: string }>();
  const [chamados, setChamados] = useState<CaminhoHospedagemChamado[]>([]);
  const [tipo, setTipo] = useState<CaminhoHospedagemChamado["tipo"]>("pagamento");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    listarChamadosHospedagens("pousada")
      .then((data) => {
        if (mounted) setChamados(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(load);

  async function handleOpenTicket() {
    if (!titulo.trim() || !descricao.trim()) {
      Alert.alert("Dados obrigatórios", "Informe título e descrição do chamado.");
      return;
    }
    try {
      setSaving(true);
      await abrirChamadoHospedagens({
        papel: "pousada",
        tipo,
        titulo,
        descricao,
        prioridade: ["no_show", "pagamento", "divergencia_preco"].includes(tipo) ? "alta" : "normal",
        pousadaId: pousadaId || null,
      });
      setTitulo("");
      setDescricao("");
      setChamados(await listarChamadosHospedagens("pousada"));
      Alert.alert("Chamado aberto", "A administração recebeu sua solicitação.");
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
          <Text style={styles.eyebrow}>Suporte da pousada</Text>
          <Text style={styles.title}>Ocorrências operacionais</Text>
        </View>
      </View>

      <View style={styles.cardDark}>
        <Text style={styles.heroTitle}>Registre problemas antes que virem prejuízo.</Text>
        <Text style={styles.heroText}>Use esta central para divergências de reserva, pagamento, no-show, cancelamentos e suporte ao hóspede.</Text>
      </View>

      <View style={styles.card}>
        <SectionTitle title="Novo chamado" icon="construct-outline" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
          {TIPOS.map((item) => (
            <Pressable key={item.key} style={[styles.typeChip, tipo === item.key && styles.typeChipActive]} onPress={() => setTipo(item.key)}>
              <Text style={[styles.typeText, tipo === item.key && styles.typeTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Field label="Título" value={titulo} onChangeText={setTitulo} placeholder="Ex.: Cliente não compareceu" />
        <Field label="Descrição" value={descricao} onChangeText={setDescricao} placeholder="Descreva a reserva, data, contato e providências já tomadas." multiline />
        <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={handleOpenTicket} disabled={saving}>
          {saving ? <ActivityIndicator color="#12372A" /> : <Text style={styles.primaryButtonText}>Enviar para administração</Text>}
        </Pressable>
      </View>

      <View style={styles.card}>
        <SectionTitle title="Chamados da operação" icon="list-outline" />
        {loading ? <ActivityIndicator color="#12372A" /> : null}
        {!loading && !chamados.length ? <Text style={styles.emptyText}>Nenhum chamado aberto pela pousada.</Text> : null}
        {chamados.map((item) => (
          <View key={item.id} style={styles.ticket}>
            <Text style={styles.ticketTitle}>{item.titulo}</Text>
            <Text style={styles.ticketMeta}>{item.tipo} • {item.status} • {item.prioridade}</Text>
            <Text style={styles.ticketText}>{item.descricao}</Text>
            {item.respostaAdmin ? <Text style={styles.answerText}>Admin: {item.respostaAdmin}</Text> : null}
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

function Field({ label, multiline, ...props }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput {...props} multiline={multiline} placeholderTextColor="#8A7B61" style={[styles.input, multiline && styles.textArea]} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  content: { padding: 16, gap: 16, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  eyebrow: { color: "#4E7C59", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#12372A", fontSize: 24, lineHeight: 30, fontWeight: "900" },
  cardDark: { backgroundColor: "#12372A", borderRadius: 8, padding: 16, gap: 6 },
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
  ticket: { borderTopWidth: 1, borderTopColor: "#E5D9BD", paddingTop: 12, gap: 6 },
  ticketTitle: { color: "#12372A", fontSize: 16, fontWeight: "900" },
  ticketMeta: { color: "#6B7280", fontWeight: "700" },
  ticketText: { color: "#4B5563", lineHeight: 20 },
  answerText: { color: "#0F6B4F", lineHeight: 20, backgroundColor: "#ECFDF3", borderRadius: 8, padding: 10 },
});
