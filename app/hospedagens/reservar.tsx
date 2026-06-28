import {
  calcularReserva,
  criarReservaHospedagem,
  formatMoney,
  getQuartoById,
  obterHospedagemPublicaPorId,
  type CaminhoHospedagem,
  type CaminhoQuarto,
  type CaminhoServicoAdicional,
} from "@/lib/caminhosHospedagens";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function datePlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function ReservarHospedagemScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ hospedagemId?: string; quartoId?: string }>();
  const [hospedagem, setHospedagem] = useState<CaminhoHospedagem | null>(null);
  const [quarto, setQuarto] = useState<CaminhoQuarto | null>(null);
  const [checkin, setCheckin] = useState(datePlus(7));
  const [checkout, setCheckout] = useState(datePlus(8));
  const [hospedes, setHospedes] = useState("1");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    obterHospedagemPublicaPorId(String(params.hospedagemId || ""))
      .then((item) => {
        if (!mounted) return;
        setHospedagem(item);
        setQuarto(item ? getQuartoById(item, String(params.quartoId || "")) : null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [params.hospedagemId, params.quartoId]);

  const resumo = useMemo(() => {
    if (!hospedagem || !quarto) return null;
    return calcularReserva({
      hospedagem,
      quarto,
      checkin,
      checkout,
      hospedes: Math.max(1, Number(hospedes || 1)),
    });
  }, [checkin, checkout, hospedagem, hospedes, quarto]);

  const extrasSelecionados = useMemo(() => {
    if (!hospedagem) return [];
    return hospedagem.servicosAdicionais.filter((item) => selectedExtras.includes(item.id));
  }, [hospedagem, selectedExtras]);

  const totalExtras = useMemo(
    () => Number(extrasSelecionados.reduce((sum, item) => sum + Number(item.preco || 0), 0).toFixed(2)),
    [extrasSelecionados],
  );

  function toggleExtra(id: string) {
    setSelectedExtras((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function handleConfirm() {
    if (!hospedagem || !quarto || !resumo) return;
    if (!nome.trim() || !telefone.trim()) {
      Alert.alert("Dados obrigatórios", "Informe seu nome e WhatsApp para confirmar a reserva.");
      return;
    }

    try {
      setSaving(true);
      const extrasDescricao = extrasSelecionados.map((item) => `${item.nome} (${formatMoney(item.preco)})`).join(", ");
      const result = await criarReservaHospedagem({
        hospedagemId: hospedagem.id,
        quartoId: quarto.id,
        checkin,
        checkout,
        hospedes: Math.max(1, Number(hospedes || 1)),
        nome,
        telefone,
        observacoes: [
          observacoes.trim(),
          extrasSelecionados.length
            ? `Serviços adicionais solicitados: ${extrasDescricao}.`
            : "",
        ].filter(Boolean).join("\n"),
        servicosAdicionaisTotal: totalExtras,
        servicosAdicionaisDescricao: extrasDescricao,
      });
      router.push({
        pathname: "/hospedagens/pagar",
        params: {
          reservaId: result.reservaId,
          extrasTotal: String(totalExtras),
          extrasDescricao,
        },
      });
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível criar a reserva.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#12372A" />
      </View>
    );
  }

  if (!hospedagem || !quarto || !resumo) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Reserva indisponível</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#12372A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Confirmar reserva</Text>
          <Text style={styles.title}>{hospedagem.nome}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{quarto.nome}</Text>
        <Text style={styles.cardMeta}>{hospedagem.cidade} - {hospedagem.uf} • {quarto.capacidade} hóspede(s)</Text>
      </View>

      <View style={styles.form}>
        <TextInput style={styles.input} value={checkin} onChangeText={setCheckin} placeholder="Check-in AAAA-MM-DD" placeholderTextColor="#8A7B61" />
        <TextInput style={styles.input} value={checkout} onChangeText={setCheckout} placeholder="Check-out AAAA-MM-DD" placeholderTextColor="#8A7B61" />
        <TextInput style={styles.input} value={hospedes} onChangeText={setHospedes} keyboardType="number-pad" placeholder="Hóspedes" placeholderTextColor="#8A7B61" />
        <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome" placeholderTextColor="#8A7B61" />
        <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" placeholder="WhatsApp" placeholderTextColor="#8A7B61" />
        <TextInput style={[styles.input, styles.textArea]} value={observacoes} onChangeText={setObservacoes} multiline placeholder="Observações: chegada tarde, bike, jantar..." placeholderTextColor="#8A7B61" />
      </View>

      <View style={styles.extrasSection}>
        <View style={styles.extrasHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.extrasTitle}>Serviços adicionais</Text>
            <Text style={styles.extrasSubtitle}>Selecione os extras que deseja solicitar para esta etapa.</Text>
          </View>
          <View style={styles.extrasBadge}>
            <Text style={styles.extrasBadgeText}>{selectedExtras.length}</Text>
          </View>
        </View>
        <View style={styles.extrasList}>
          {hospedagem.servicosAdicionais.map((service) => (
            <ExtraOption
              key={service.id}
              service={service}
              selected={selectedExtras.includes(service.id)}
              onPress={() => toggleExtra(service.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Resumo financeiro</Text>
        <Row label={`${resumo.noites} noite(s) de hospedagem`} value={formatMoney(resumo.total)} />
        <Row label="Serviços adicionais" value={formatMoney(totalExtras)} />
        <Row label="Sinal obrigatório no app" value={formatMoney(resumo.sinal)} />
        <Row label="Restante da hospedagem na chegada" value={formatMoney(resumo.restanteNaPousada)} />
        <Row label="Total estimado da experiência" value={formatMoney(resumo.total + totalExtras)} strong />
        <Text style={styles.summaryNote}>Os serviços adicionais são solicitados na reserva e confirmados pela pousada conforme disponibilidade local.</Text>
      </View>

      <View style={styles.policy}>
        <Text style={styles.policyTitle}>Antes de confirmar</Text>
        <Text style={styles.policyText}>Você verá sinal, total e restante com transparência. As regras de alteração, desistência, reembolso e suporte ficam reunidas nas políticas do cliente.</Text>
        <Pressable style={styles.policyLink} onPress={() => router.push("/hospedagens/politicas-cliente")}>
          <Text style={styles.policyLinkText}>Ver políticas do cliente</Text>
          <Ionicons name="chevron-forward" size={17} color="#12372A" />
        </Pressable>
      </View>

      <Pressable style={[styles.paymentButton, saving && styles.disabled]} onPress={handleConfirm} disabled={saving}>
        {saving ? <ActivityIndicator color="#FFF9EA" /> : <Text style={styles.paymentButtonText}>Continuar para pagamento</Text>}
      </Pressable>
    </ScrollView>
  );
}

function ExtraOption({
  service,
  selected,
  onPress,
}: {
  service: CaminhoServicoAdicional;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.extraOption, selected && styles.extraOptionSelected]} onPress={onPress}>
      <View style={[styles.extraIcon, selected && styles.extraIconSelected]}>
        <Ionicons name={service.icon} size={20} color={selected ? "#F7D58B" : "#12372A"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.extraTitle, selected && styles.extraTitleSelected]}>{service.nome}</Text>
        <Text style={[styles.extraDescription, selected && styles.extraDescriptionSelected]}>{service.descricao}</Text>
        <Text style={[styles.extraConfirm, selected && styles.extraConfirmSelected]}>{service.confirmacao}</Text>
      </View>
      <View style={styles.extraRight}>
        <Ionicons name={selected ? "checkmark-circle" : "add-circle-outline"} size={22} color={selected ? "#F7D58B" : "#4E7C59"} />
        <Text style={[styles.extraPrice, selected && styles.extraPriceSelected]}>{formatMoney(service.preco)}</Text>
        <Text style={[styles.extraUnit, selected && styles.extraUnitSelected]}>{service.unidade}</Text>
      </View>
    </Pressable>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryLabelStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryValueStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  content: { padding: 16, gap: 16, paddingBottom: 34 },
  header: { flexDirection: "row", gap: 12, alignItems: "center" },
  backButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  eyebrow: { color: "#4E7C59", textTransform: "uppercase", fontSize: 12, fontWeight: "900" },
  title: { color: "#12372A", fontSize: 24, fontWeight: "900", lineHeight: 30 },
  card: { backgroundColor: "#12372A", borderRadius: 8, padding: 16, gap: 4 },
  cardTitle: { color: "#FFF9EA", fontWeight: "900", fontSize: 18 },
  cardMeta: { color: "#F7D58B", fontWeight: "700" },
  form: { gap: 10 },
  input: { minHeight: 50, borderRadius: 8, backgroundColor: "#FFFDF6", borderWidth: 1, borderColor: "#E5D9BD", paddingHorizontal: 14, color: "#12372A", fontSize: 15 },
  textArea: { minHeight: 96, paddingTop: 14, textAlignVertical: "top" },
  extrasSection: { backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 14, gap: 12 },
  extrasHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  extrasTitle: { color: "#12372A", fontSize: 18, fontWeight: "900" },
  extrasSubtitle: { color: "#4B5563", lineHeight: 19, marginTop: 3 },
  extrasBadge: { minWidth: 36, height: 36, borderRadius: 8, backgroundColor: "#12372A", alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  extrasBadgeText: { color: "#F7D58B", fontWeight: "900" },
  extrasList: { gap: 10 },
  extraOption: { flexDirection: "row", gap: 10, alignItems: "flex-start", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", backgroundColor: "#FFF9EA", padding: 12 },
  extraOptionSelected: { backgroundColor: "#12372A", borderColor: "#12372A" },
  extraIcon: { width: 38, height: 38, borderRadius: 8, backgroundColor: "#F7D58B", alignItems: "center", justifyContent: "center" },
  extraIconSelected: { backgroundColor: "rgba(247, 213, 139, 0.16)" },
  extraTitle: { color: "#12372A", fontWeight: "900", fontSize: 15 },
  extraTitleSelected: { color: "#FFF9EA" },
  extraDescription: { color: "#6B7280", lineHeight: 18, marginTop: 3 },
  extraDescriptionSelected: { color: "#E5D9BD" },
  extraConfirm: { color: "#4E7C59", fontSize: 12, fontWeight: "800", marginTop: 5 },
  extraConfirmSelected: { color: "#F7D58B" },
  extraRight: { alignItems: "flex-end", maxWidth: 88 },
  extraPrice: { color: "#12372A", fontWeight: "900", marginTop: 5 },
  extraPriceSelected: { color: "#FFF9EA" },
  extraUnit: { color: "#8A7B61", fontSize: 11, textAlign: "right", marginTop: 2 },
  extraUnitSelected: { color: "#E5D9BD" },
  summary: { backgroundColor: "#FFF9EA", borderRadius: 8, padding: 16, gap: 10, borderWidth: 1, borderColor: "#E5D9BD" },
  summaryTitle: { color: "#12372A", fontWeight: "900", fontSize: 18 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  summaryLabel: { color: "#4B5563", flex: 1 },
  summaryValue: { color: "#12372A", fontWeight: "900" },
  summaryLabelStrong: { color: "#12372A", fontWeight: "900" },
  summaryValueStrong: { color: "#12372A", fontSize: 16 },
  summaryNote: { color: "#6B7280", lineHeight: 19, fontSize: 12 },
  policy: { backgroundColor: "#FFFFFF", borderRadius: 8, padding: 16, gap: 8, borderWidth: 1, borderColor: "#E5D9BD" },
  policyTitle: { color: "#12372A", fontWeight: "900", fontSize: 18 },
  policyText: { color: "#4B5563", lineHeight: 21 },
  policyLink: { minHeight: 42, borderRadius: 8, backgroundColor: "#F7D58B", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 12 },
  policyLinkText: { color: "#12372A", fontWeight: "900" },
  primaryButton: { minHeight: 54, borderRadius: 8, backgroundColor: "#D8A84F", alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  primaryButtonText: { color: "#12372A", fontSize: 16, fontWeight: "900" },
  paymentButton: { minHeight: 56, borderRadius: 8, backgroundColor: "#0F6B4F", alignItems: "center", justifyContent: "center", paddingHorizontal: 16, borderWidth: 1, borderColor: "#F7D58B" },
  paymentButtonText: { color: "#FFF9EA", fontSize: 16, fontWeight: "900" },
  disabled: { opacity: 0.6 },
  center: { flex: 1, backgroundColor: "#F7F0DF", alignItems: "center", justifyContent: "center", padding: 20, gap: 14 },
});
