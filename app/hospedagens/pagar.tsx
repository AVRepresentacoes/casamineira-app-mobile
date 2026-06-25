import {
  formatMoney,
  gerarPixSinalHospedagem,
  obterReservaHospedagemPorId,
  pagarSinalHospedagemComCartao,
  type HospedagemPixPagamento,
} from "@/lib/caminhosHospedagens";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MetodoPagamento = "cartao" | "pix";

type ReservaPagamento = Awaited<ReturnType<typeof obterReservaHospedagemPorId>>;

type CardTokenResponse = {
  id: string;
  payment_method_id: string;
  issuer_id?: string | null;
};

const MP_PUBLIC_KEY = String(process.env.EXPO_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "").trim();

function onlyDigits(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function formatCardNumber(value: string) {
  const digits = onlyDigits(value).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string) {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function parseExpiry(value: string) {
  const digits = onlyDigits(value);
  if (digits.length !== 4) {
    throw new Error("Validade inválida. Use MM/AA.");
  }

  const month = Number(digits.slice(0, 2));
  const year = Number(`20${digits.slice(2, 4)}`);

  if (!Number.isFinite(month) || month < 1 || month > 12) {
    throw new Error("Mês da validade inválido.");
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    throw new Error("Cartão com validade expirada.");
  }

  return { month, year };
}

function statusLabel(status?: string) {
  if (status === "aprovada") return "Pagamento aprovado";
  if (status === "recusada") return "Pagamento recusado";
  if (status === "estornada") return "Pagamento estornado";
  return "Aguardando pagamento";
}

function statusColor(status?: string) {
  if (status === "aprovada") return "#15803D";
  if (status === "recusada") return "#B91C1C";
  if (status === "estornada") return "#C2410C";
  return "#A16207";
}

export default function PagarHospedagemScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { reservaId, extrasTotal, extrasDescricao } = useLocalSearchParams<{
    reservaId?: string;
    extrasTotal?: string;
    extrasDescricao?: string;
  }>();
  const [reserva, setReserva] = useState<ReservaPagamento>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [metodoSelecionado, setMetodoSelecionado] = useState<MetodoPagamento>("pix");
  const [pixData, setPixData] = useState<HospedagemPixPagamento | null>(null);
  const [numeroCartao, setNumeroCartao] = useState("");
  const [nomeTitular, setNomeTitular] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [cpfTitular, setCpfTitular] = useState("");

  const carregarReserva = useCallback(async () => {
    if (!reservaId) return;
    try {
      setLoading(true);
      const data = await obterReservaHospedagemPorId(String(reservaId));
      setReserva(data);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível carregar a reserva.");
    } finally {
      setLoading(false);
    }
  }, [reservaId]);

  useEffect(() => {
    void carregarReserva();
  }, [carregarReserva]);

  async function tokenizarCartao(): Promise<CardTokenResponse> {
    if (!MP_PUBLIC_KEY) {
      throw new Error("Configure EXPO_PUBLIC_MERCADO_PAGO_PUBLIC_KEY para ativar cartão no app.");
    }

    const cardNumberDigits = onlyDigits(numeroCartao);
    const cvvDigits = onlyDigits(cvv);
    const cpfDigits = onlyDigits(cpfTitular);

    if (nomeTitular.trim().length < 3) throw new Error("Informe o nome completo do titular.");
    if (cardNumberDigits.length < 13) throw new Error("Número do cartão inválido.");
    if (cvvDigits.length < 3) throw new Error("CVV inválido.");
    if (cpfDigits.length !== 11) throw new Error("CPF inválido.");

    const { month, year } = parseExpiry(validade);
    const response = await fetch(
      `https://api.mercadopago.com/v1/card_tokens?public_key=${encodeURIComponent(MP_PUBLIC_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_number: cardNumberDigits,
          security_code: cvvDigits,
          expiration_month: month,
          expiration_year: year,
          cardholder: {
            name: nomeTitular.trim(),
            identification: { type: "CPF", number: cpfDigits },
          },
        }),
      },
    );

    const json = await response.json();
    if (!response.ok) {
      throw new Error(String(json?.cause?.[0]?.description || json?.message || "Falha ao tokenizar cartão."));
    }

    const token = String(json?.id || "");
    let paymentMethodId = String(json?.payment_method_id || json?.payment_method?.id || "").trim();
    const issuerId = json?.issuer?.id ? String(json.issuer.id) : null;

    if (!paymentMethodId) {
      const bin = cardNumberDigits.slice(0, 6);
      const pmResponse = await fetch(
        `https://api.mercadopago.com/v1/payment_methods/search?public_key=${encodeURIComponent(MP_PUBLIC_KEY)}&bins=${encodeURIComponent(bin)}`,
      );
      const pmJson = await pmResponse.json();
      paymentMethodId = String(pmJson?.results?.[0]?.id || "").trim();
    }

    if (!token || !paymentMethodId) {
      throw new Error("Mercado Pago não retornou token válido do cartão.");
    }

    return { id: token, payment_method_id: paymentMethodId, issuer_id: issuerId };
  }

  async function gerarPix() {
    if (!reserva?.id) return;
    try {
      setProcessing(true);
      const pix = await gerarPixSinalHospedagem(reserva.id);
      setPixData(pix);
      await carregarReserva();

      if (pix.checkoutConfigured === false) {
        Alert.alert("Pagamento pronto para configurar", pix.message || "Adicione as credenciais do provedor para ativar o Pix real.");
        return;
      }

      Alert.alert("PIX gerado", "Escaneie o QR Code ou copie o código PIX para pagar o sinal.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível gerar o PIX.");
    } finally {
      setProcessing(false);
    }
  }

  async function pagarCartao() {
    if (!reserva?.id) return;
    try {
      setProcessing(true);
      const token = await tokenizarCartao();
      const cpfDigits = onlyDigits(cpfTitular);
      const cardDigits = onlyDigits(numeroCartao);

      const result = await pagarSinalHospedagemComCartao(reserva.id, {
        token: token.id,
        payment_method_id: token.payment_method_id,
        issuer_id: token.issuer_id,
        installments: 1,
        identification_type: "CPF",
        identification_number: cpfDigits,
        last_four_digits: cardDigits.slice(-4),
      });

      await carregarReserva();

      if (result.checkoutConfigured === false) {
        Alert.alert("Pagamento pronto para configurar", result.message || "Adicione as credenciais do provedor para ativar cartão real.");
        return;
      }

      if (result.status_pagamento === "aprovada") {
        Alert.alert("Pagamento aprovado", "Seu sinal foi aprovado e a reserva está confirmada.");
        return;
      }

      if (result.status_pagamento === "recusada") {
        Alert.alert("Pagamento recusado", result.status_detail || "Tente outro cartão ou use Pix.");
        return;
      }

      Alert.alert("Pagamento em análise", "A transação foi recebida e pode levar alguns instantes para atualizar.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível pagar com cartão.");
    } finally {
      setProcessing(false);
    }
  }

  async function copiarPix() {
    if (!pixData?.qr_code) return;
    await Share.share({ title: "Código PIX", message: pixData.qr_code });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D8A84F" size="large" />
      </View>
    );
  }

  if (!reserva) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Reserva não encontrada</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.replace("/hospedagens")}>
          <Text style={styles.primaryButtonText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const pago = reserva.statusPagamento === "aprovada";
  const hasExtrasTotalParam = typeof extrasTotal === "string" && extrasTotal.trim() !== "";
  const extrasTotalParam = Number(String(extrasTotal || "").replace(",", "."));
  const servicosAdicionaisTotal = hasExtrasTotalParam && Number.isFinite(extrasTotalParam)
    ? extrasTotalParam
    : Number(reserva.servicosAdicionaisTotal || 0);
  const servicosDescricao =
    String(extrasDescricao || "").trim() || String(reserva.servicosAdicionaisDescricao || "").trim();
  const totalNaPousada = Number((reserva.restanteNaPousada + servicosAdicionaisTotal).toFixed(2));
  const totalExperiencia = Number((reserva.total + servicosAdicionaisTotal).toFixed(2));

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#12372A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Pagamento seguro</Text>
          <Text style={styles.title}>Pagar sinal da reserva</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Sinal a pagar agora</Text>
        <Text style={styles.heroValue}>{formatMoney(reserva.sinal)}</Text>
        <Text style={styles.heroMeta}>{reserva.hospedagemNome} • {reserva.quartoNome}</Text>
        <View style={[styles.statusBadge, { borderColor: statusColor(reserva.statusPagamento) }]}>
          <Ionicons name={pago ? "checkmark-circle" : "time-outline"} size={15} color={statusColor(reserva.statusPagamento)} />
          <Text style={[styles.statusText, { color: statusColor(reserva.statusPagamento) }]}>
            {statusLabel(reserva.statusPagamento)}
          </Text>
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Resumo da reserva</Text>
        <Row label="Total da hospedagem" value={formatMoney(reserva.total)} />
        <Row label="Serviços adicionais solicitados" value={formatMoney(servicosAdicionaisTotal)} />
        {servicosDescricao ? <Text style={styles.extrasDescription}>{servicosDescricao}</Text> : null}
        <View style={styles.divider} />
        <Row label="Você paga agora no app" value={formatMoney(reserva.sinal)} strong />
        <Row label="Restante da hospedagem na pousada" value={formatMoney(reserva.restanteNaPousada)} />
        <Row label="Serviços adicionais na pousada" value={formatMoney(servicosAdicionaisTotal)} />
        <Row label="Total previsto a pagar na pousada" value={formatMoney(totalNaPousada)} strong />
        <View style={styles.totalBox}>
          <Text style={styles.totalBoxLabel}>Total estimado da experiência</Text>
          <Text style={styles.totalBoxValue}>{formatMoney(totalExperiencia)}</Text>
        </View>
        <Text style={styles.summaryNote}>O sinal confirma a hospedagem. O restante e os serviços adicionais são pagos diretamente na pousada, conforme confirmação de disponibilidade.</Text>
      </View>

      <View style={styles.methodBox}>
        <Text style={styles.methodTitle}>Escolha como pagar</Text>
        <View style={styles.methodRow}>
          <MethodCard
            icon="qr-code-outline"
            title="PIX"
            subtitle="QR Code no app"
            active={metodoSelecionado === "pix"}
            disabled={pago}
            onPress={() => setMetodoSelecionado("pix")}
          />
          <MethodCard
            icon="card-outline"
            title="Cartão"
            subtitle="Checkout transparente"
            active={metodoSelecionado === "cartao"}
            disabled={pago}
            onPress={() => setMetodoSelecionado("cartao")}
          />
        </View>
      </View>

      <View style={styles.securityCard}>
        <Ionicons name="shield-checkmark-outline" size={19} color="#12372A" />
        <Text style={styles.securityText}>Pagamento processado pelo provedor configurado, com dados de cartão tokenizados e sem armazenamento no app.</Text>
      </View>

      {pago ? (
        <View style={styles.approvedCard}>
          <Ionicons name="checkmark-circle" size={22} color="#15803D" />
          <Text style={styles.approvedText}>Reserva confirmada. O comprovante fica disponível em Minhas hospedagens.</Text>
        </View>
      ) : metodoSelecionado === "pix" ? (
        <View style={styles.paymentCard}>
          <Pressable style={[styles.primaryButton, processing && styles.disabled]} onPress={gerarPix} disabled={processing}>
            {processing ? <ActivityIndicator color="#12372A" /> : <Ionicons name="qr-code" size={18} color="#12372A" />}
            <Text style={styles.primaryButtonText}>Gerar PIX no app</Text>
          </Pressable>

          {pixData?.qr_code ? (
            <View style={styles.pixPanel}>
              {pixData.qr_code_base64 ? (
                <Image source={{ uri: `data:image/png;base64,${pixData.qr_code_base64}` }} style={styles.pixQr} />
              ) : null}
              <Text style={styles.pixHint}>Escaneie no app do seu banco ou copie o código PIX.</Text>
              <Text selectable style={styles.pixCode}>{pixData.qr_code}</Text>
              <Pressable style={styles.secondaryButton} onPress={copiarPix}>
                <Ionicons name="copy-outline" size={16} color="#FFF9EA" />
                <Text style={styles.secondaryButtonText}>Copiar código PIX</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.paymentCard}>
          <Text style={styles.formTitle}>Dados do cartão</Text>
          <TextInput style={styles.input} placeholder="Número do cartão" placeholderTextColor="#8A7B61" keyboardType="number-pad" value={numeroCartao} onChangeText={(value) => setNumeroCartao(formatCardNumber(value))} maxLength={19} />
          <TextInput style={styles.input} placeholder="Nome do titular" placeholderTextColor="#8A7B61" autoCapitalize="words" value={nomeTitular} onChangeText={setNomeTitular} />
          <View style={styles.inputRow}>
            <TextInput style={[styles.input, styles.halfInput]} placeholder="MM/AA" placeholderTextColor="#8A7B61" keyboardType="number-pad" value={validade} onChangeText={(value) => setValidade(formatExpiry(value))} maxLength={5} />
            <TextInput style={[styles.input, styles.halfInput]} placeholder="CVV" placeholderTextColor="#8A7B61" keyboardType="number-pad" value={cvv} onChangeText={(value) => setCvv(onlyDigits(value).slice(0, 4))} maxLength={4} secureTextEntry />
          </View>
          <TextInput style={styles.input} placeholder="CPF do titular" placeholderTextColor="#8A7B61" keyboardType="number-pad" value={cpfTitular} onChangeText={(value) => setCpfTitular(formatCpf(value))} maxLength={14} />
          <Text style={styles.formHint}>Cobrança em 1x. O cartão é tokenizado pelo Mercado Pago.</Text>

          <Pressable style={[styles.primaryButton, processing && styles.disabled]} onPress={pagarCartao} disabled={processing}>
            {processing ? <ActivityIndicator color="#12372A" /> : <Ionicons name="card" size={18} color="#12372A" />}
            <Text style={styles.primaryButtonText}>Pagar com cartão</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.refreshButton} onPress={carregarReserva}>
        <Ionicons name="refresh" size={16} color="#12372A" />
        <Text style={styles.refreshText}>Atualizar status</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.rowStrong]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowStrong]}>{value}</Text>
    </View>
  );
}

function MethodCard({
  icon,
  title,
  subtitle,
  active,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.methodCard, active && styles.methodCardActive, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Ionicons name={icon} size={21} color={active ? "#12372A" : "#4E7C59"} />
      <Text style={[styles.methodCardTitle, active && styles.methodCardTitleActive]}>{title}</Text>
      <Text style={[styles.methodCardSub, active && styles.methodCardSubActive]}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  content: { padding: 16, gap: 16, paddingBottom: 34 },
  center: { flex: 1, backgroundColor: "#F7F0DF", alignItems: "center", justifyContent: "center", padding: 20, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  eyebrow: { color: "#4E7C59", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#12372A", fontSize: 25, fontWeight: "900" },
  emptyTitle: { color: "#12372A", fontSize: 20, fontWeight: "900" },
  heroCard: { backgroundColor: "#12372A", borderRadius: 8, padding: 18, gap: 7 },
  heroLabel: { color: "#F7D58B", fontWeight: "900" },
  heroValue: { color: "#FFF9EA", fontSize: 34, fontWeight: "900" },
  heroMeta: { color: "#E5D9BD", fontWeight: "700" },
  statusBadge: { alignSelf: "flex-start", marginTop: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF9EA" },
  statusText: { fontWeight: "900", fontSize: 12 },
  summary: { backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 16, gap: 10 },
  summaryTitle: { color: "#12372A", fontSize: 18, fontWeight: "900" },
  extrasDescription: { color: "#4E7C59", backgroundColor: "#F7F0DF", borderRadius: 8, padding: 10, lineHeight: 19, fontSize: 12, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#E5D9BD", marginVertical: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  rowLabel: { color: "#4B5563", flex: 1 },
  rowValue: { color: "#12372A", fontWeight: "900" },
  rowStrong: { color: "#12372A", fontWeight: "900" },
  totalBox: { backgroundColor: "#12372A", borderRadius: 8, padding: 12, gap: 4 },
  totalBoxLabel: { color: "#F7D58B", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  totalBoxValue: { color: "#FFF9EA", fontSize: 22, fontWeight: "900" },
  summaryNote: { color: "#6B7280", fontSize: 12, lineHeight: 18 },
  methodBox: { backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 14, gap: 10 },
  methodTitle: { color: "#12372A", fontSize: 18, fontWeight: "900" },
  methodRow: { flexDirection: "row", gap: 10 },
  methodCard: { flex: 1, minHeight: 98, borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", backgroundColor: "#FFF9EA", padding: 12, gap: 5 },
  methodCardActive: { backgroundColor: "#F7D58B", borderColor: "#D8A84F" },
  methodCardTitle: { color: "#12372A", fontWeight: "900", fontSize: 16 },
  methodCardTitleActive: { color: "#12372A" },
  methodCardSub: { color: "#4B5563", fontSize: 12, lineHeight: 16 },
  methodCardSubActive: { color: "#315342" },
  securityCard: { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: "#FFF9EA", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 14 },
  securityText: { color: "#315342", lineHeight: 20, flex: 1 },
  approvedCard: { flexDirection: "row", gap: 10, backgroundColor: "#ECFDF3", borderColor: "#BBF7D0", borderWidth: 1, borderRadius: 8, padding: 14 },
  approvedText: { color: "#14532D", lineHeight: 20, flex: 1, fontWeight: "800" },
  paymentCard: { backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 14, gap: 12 },
  formTitle: { color: "#12372A", fontSize: 18, fontWeight: "900" },
  input: { minHeight: 50, borderRadius: 8, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#E5D9BD", paddingHorizontal: 12, color: "#12372A", fontSize: 15 },
  inputRow: { flexDirection: "row", gap: 10 },
  halfInput: { flex: 1 },
  formHint: { color: "#6B7280", lineHeight: 19, fontSize: 12 },
  primaryButton: { minHeight: 54, borderRadius: 8, backgroundColor: "#D8A84F", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16 },
  primaryButtonText: { color: "#12372A", fontSize: 16, fontWeight: "900" },
  secondaryButton: { minHeight: 44, borderRadius: 8, backgroundColor: "#12372A", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 14 },
  secondaryButtonText: { color: "#FFF9EA", fontWeight: "900" },
  pixPanel: { gap: 10, alignItems: "center" },
  pixQr: { width: 220, height: 220, borderRadius: 8, backgroundColor: "#FFFFFF" },
  pixHint: { color: "#4B5563", lineHeight: 20, textAlign: "center" },
  pixCode: { color: "#12372A", backgroundColor: "#F7F0DF", borderRadius: 8, padding: 10, fontSize: 12, lineHeight: 17 },
  refreshButton: { minHeight: 46, borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", backgroundColor: "#FFF9EA", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  refreshText: { color: "#12372A", fontWeight: "900" },
  disabled: { opacity: 0.6 },
});
