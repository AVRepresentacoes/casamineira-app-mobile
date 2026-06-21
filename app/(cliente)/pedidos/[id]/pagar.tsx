import PressableScale from "@/components/PressableScale";
import { getProfessionalCommissionDecimal, loadProfessionalSubscriptionContext } from "@/lib/pro-subscription";
import {
  gerarPagamentoCartaoMercadoPago,
  gerarPagamentoPixMercadoPago,
  obterPagamentoPorPedido,
  type PixPagamento,
} from "@/lib/payments";
import { supabase } from "@/lib/supabase";
import { resolveCurrentTenantId } from "@/lib/tenant";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Share,
  TouchableOpacity,
  View,
} from "react-native";

type Pedido = {
  id: string;
  categoria: string;
  descricao: string;
  valor_final?: number | null;
  profissional_id?: string | null;
  prestador_id?: string | null;
};

type MetodoPagamento = "cartao" | "pix";

type CardTokenResponse = {
  id: string;
  payment_method_id: string;
  issuer_id?: string | null;
};

const MP_PUBLIC_KEY = String(process.env.EXPO_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "").trim();

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
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

export default function PagarPedido() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [statusPagamento, setStatusPagamento] = useState<string>("pendente");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [commissionRate, setCommissionRate] = useState(0.2);

  const [metodoSelecionado, setMetodoSelecionado] = useState<MetodoPagamento>("cartao");
  const [pixData, setPixData] = useState<PixPagamento | null>(null);

  const [numeroCartao, setNumeroCartao] = useState("");
  const [nomeTitular, setNomeTitular] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [cpfTitular, setCpfTitular] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateAnim]);

  const carregarPedido = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        Alert.alert("Erro", "Sessão inválida.");
        setNotFound(true);
        return;
      }
      const tenantId = await resolveCurrentTenantId();

      let pedidoQuery = supabase
        .from("pedidos")
        .select("id, categoria, descricao, valor_final, profissional_id, prestador_id")
        .eq("id", id)
        .eq("cliente_id", session.user.id);
      if (tenantId) {
        pedidoQuery = pedidoQuery.eq("tenant_id", tenantId);
      }
      const { data: pedidoData, error: pedidoError } = await pedidoQuery.maybeSingle();

      if (pedidoError || !pedidoData) {
        console.log("ERRO PEDIDO PAGAR:", pedidoError);
        Alert.alert("Erro", "Pedido não encontrado para sua conta.");
        setPedido(null);
        setNotFound(true);
        return;
      }

      setPedido(pedidoData as Pedido);
      setNotFound(false);

      const profissionalId =
        (pedidoData as Pedido).profissional_id || (pedidoData as Pedido).prestador_id || "";
      if (profissionalId) {
        const subscription = await loadProfessionalSubscriptionContext(profissionalId).catch(() => null);
        setCommissionRate(subscription ? getProfessionalCommissionDecimal(subscription.tier) : 0.2);
      } else {
        setCommissionRate(0.2);
      }

      const pagamento = await obterPagamentoPorPedido(id);
      if (pagamento?.status_pagamento) {
        setStatusPagamento(pagamento.status_pagamento);
      } else {
        setStatusPagamento("pendente");
      }
    } catch (error: any) {
      console.log("ERRO CARREGAR PAGAMENTO:", error);
      Alert.alert("Erro", error?.message || "Falha ao carregar pagamento.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void carregarPedido();
  }, [carregarPedido, id]);

  function textoStatus(status: string) {
    if (status === "aprovada") return "Pagamento aprovado";
    if (status === "recusada") return "Pagamento recusado";
    if (status === "estornada") return "Pagamento estornado";
    return "Pagamento aguardando";
  }

  function corStatus(status: string) {
    if (status === "aprovada") return "#22c55e";
    if (status === "recusada") return "#ef4444";
    if (status === "estornada") return "#f97316";
    return "#facc15";
  }

  function iconeStatus(status: string) {
    if (status === "aprovada") return "checkmark-circle";
    if (status === "recusada") return "close-circle";
    if (status === "estornada") return "refresh-circle";
    return "time";
  }

async function tokenizarCartao(): Promise<CardTokenResponse> {
    if (!MP_PUBLIC_KEY) {
      throw new Error("Configure EXPO_PUBLIC_MERCADO_PAGO_PUBLIC_KEY para checkout transparente.");
    }

    const cardNumberDigits = onlyDigits(numeroCartao);
    const cvvDigits = onlyDigits(cvv);
    const cpfDigits = onlyDigits(cpfTitular);

    if (nomeTitular.trim().length < 3) {
      throw new Error("Informe o nome completo do titular.");
    }

    if (cardNumberDigits.length < 13) {
      throw new Error("Número do cartão inválido.");
    }

    if (cvvDigits.length < 3) {
      throw new Error("CVV inválido.");
    }

    if (cpfDigits.length !== 11) {
      throw new Error("CPF inválido.");
    }

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
            identification: {
              type: "CPF",
              number: cpfDigits,
            },
          },
        }),
      },
    );

    const json = await response.json();

    if (!response.ok) {
      const detalhe =
        json?.cause?.[0]?.description ||
        json?.message ||
        json?.error ||
        "Falha ao tokenizar cartão.";
      throw new Error(String(detalhe));
    }

  const token = String(json?.id || "");
  let paymentMethodId = String(
    json?.payment_method_id || json?.payment_method?.id || "",
  ).trim();
  const issuerId = json?.issuer?.id ? String(json.issuer.id) : null;

  // Fallback: em alguns cenários o MP não retorna payment_method_id diretamente.
  if (!paymentMethodId) {
    const bin = cardNumberDigits.slice(0, 6);
    if (bin.length === 6) {
      try {
        const pmResponse = await fetch(
          `https://api.mercadopago.com/v1/payment_methods/search?public_key=${encodeURIComponent(
            MP_PUBLIC_KEY,
          )}&bins=${encodeURIComponent(bin)}`,
        );
        const pmJson = await pmResponse.json();
        paymentMethodId = String(pmJson?.results?.[0]?.id || "").trim();
      } catch {
        // ignora erro de fallback e valida abaixo
      }
    }
  }

  if (!token || !paymentMethodId) {
    throw new Error(
      "Mercado Pago não retornou token válido do cartão. Verifique Public Key, dados do cartão e se está usando cartão de teste homologado.",
    );
  }

    return {
      id: token,
      payment_method_id: paymentMethodId,
      issuer_id: issuerId,
    };
  }

  async function pagarComCartaoNoApp() {
    if (!id) return;
    if (statusPagamento === "aprovada") {
      Alert.alert("Pagamento já aprovado", "Este pedido já foi pago e está bloqueado para novo pagamento.");
      return;
    }

    try {
      setProcessing(true);

      const token = await tokenizarCartao();
      const cpfDigits = onlyDigits(cpfTitular);
      const numeroCartaoDigits = onlyDigits(numeroCartao);

      const resultado = await gerarPagamentoCartaoMercadoPago(id, {
        token: token.id,
        payment_method_id: token.payment_method_id,
        issuer_id: token.issuer_id,
        installments: 1,
        identification_type: "CPF",
        identification_number: cpfDigits,
        last_four_digits: numeroCartaoDigits.slice(-4),
      });

      setStatusPagamento(resultado.status_pagamento);
      await carregarPedido();

      if (resultado.status_pagamento === "aprovada") {
        Alert.alert("Pagamento aprovado", "Cartão aprovado e pedido liberado para execução.");
        return;
      }

      if (resultado.status_pagamento === "recusada") {
        Alert.alert(
          "Pagamento recusado",
          resultado.status_detail || "O emissor recusou a cobrança. Tente outro cartão.",
        );
        return;
      }

      Alert.alert(
        "Pagamento em análise",
        "Recebemos a transação. O status pode levar alguns instantes para atualizar.",
      );
    } catch (error: any) {
      console.log("ERRO PAGAMENTO CARTAO TRANSPARENTE:", error);
      Alert.alert("Erro", error?.message || "Não foi possível processar pagamento com cartão.");
    } finally {
      setProcessing(false);
    }
  }

  async function gerarPixNoApp() {
    if (!id) return;
    if (statusPagamento === "aprovada") {
      Alert.alert("Pagamento já aprovado", "Este pedido já foi pago e está bloqueado para novo pagamento.");
      return;
    }

    try {
      setProcessing(true);
      const pix = await gerarPagamentoPixMercadoPago(id);
      setPixData(pix);
      setMetodoSelecionado("pix");
      Alert.alert("PIX gerado", "Use o QR Code ou o botão copiar código PIX para pagar.");
    } catch (error: any) {
      console.log("ERRO PIX:", error);
      Alert.alert("Erro", error?.message || "Não foi possível gerar PIX.");
    } finally {
      setProcessing(false);
    }
  }

  async function copiarPix() {
    if (!pixData?.qr_code) return;

    try {
      await Share.share({
        title: "Código PIX",
        message: pixData.qr_code,
      });
      Alert.alert("Código PIX", "Abra o menu de compartilhamento e escolha copiar.");
    } catch {
      Alert.alert(
        "Código PIX",
        "Não foi possível abrir compartilhamento. Use o código abaixo para copiar manualmente:\n\n" +
          pixData.qr_code,
      );
    }
  }

  const valorTotal = useMemo(() => Number(pedido?.valor_final || 0), [pedido]);
  const rotaVoltar = useMemo(
    () =>
      String(pedido?.categoria || "").toLowerCase() === "marketplace"
        ? "/(tabs)/compras"
        : "/(tabs)/pedidos",
    [pedido?.categoria]
  );
  const taxaPlataforma = useMemo(() => Number((valorTotal * commissionRate).toFixed(2)), [commissionRate, valorTotal]);
  const valorProfissional = useMemo(
    () => Number((valorTotal - taxaPlataforma).toFixed(2)),
    [valorTotal, taxaPlataforma],
  );
  const taxaPercentualLabel = useMemo(() => `${Math.round(commissionRate * 100)}%`, [commissionRate]);
  const resumoDistribuicao = useMemo(
    () =>
      `Nesta cobrança de R$ ${valorTotal.toFixed(2)}, a plataforma recebe R$ ${taxaPlataforma.toFixed(2)} e o profissional recebe R$ ${valorProfissional.toFixed(2)}.`,
    [taxaPlataforma, valorProfissional, valorTotal],
  );

  const cartaoDesabilitado = processing || statusPagamento === "aprovada";

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FACC15" />
      </View>
    );
  }

  if (!pedido || notFound) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="wallet-outline" size={34} color="#facc15" />
        <Text style={styles.title}>Pagamento</Text>
        <Text style={{ color: "#d1d5db", textAlign: "center" }}>Pedido não disponível para sua conta.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/(tabs)/pedidos")}>
          <Text style={styles.backText}>Voltar para pedidos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: translateAnim }],
        }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#facc15" />
          </TouchableOpacity>
          <Text style={styles.title}>Pagamento Seguro</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.highlightCard}>
          <Text style={styles.label}>Total do pedido</Text>
          <Text style={styles.valor}>R$ {valorTotal.toFixed(2)}</Text>
          <View style={[styles.statusBadge, { borderColor: corStatus(statusPagamento) }]}>
            <Ionicons name={iconeStatus(statusPagamento) as any} size={14} color={corStatus(statusPagamento)} />
            <Text style={[styles.statusBadgeText, { color: corStatus(statusPagamento) }]}>{textoStatus(statusPagamento)}</Text>
          </View>
        </View>

        <View style={styles.methodWrap}>
          <Text style={styles.cardTitle}>Escolha como pagar</Text>
          <View style={styles.methodRow}>
            <TouchableOpacity
              style={[styles.methodCard, metodoSelecionado === "cartao" && styles.methodCardActive]}
              onPress={() => {
                if (statusPagamento === "aprovada") return;
                setMetodoSelecionado("cartao");
              }}
              disabled={statusPagamento === "aprovada"}
            >
              <Ionicons name="card-outline" size={20} color={metodoSelecionado === "cartao" ? "#111827" : "#e5e7eb"} />
              <Text style={[styles.methodTitle, metodoSelecionado === "cartao" && styles.methodTitleActive]}>
                Cartão
              </Text>
              <Text style={[styles.methodSubtitle, metodoSelecionado === "cartao" && styles.methodSubtitleActive]}>
                Checkout transparente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodCard, metodoSelecionado === "pix" && styles.methodCardActive]}
              onPress={() => {
                if (statusPagamento === "aprovada") return;
                setMetodoSelecionado("pix");
              }}
              disabled={statusPagamento === "aprovada"}
            >
              <Ionicons name="qr-code-outline" size={20} color={metodoSelecionado === "pix" ? "#111827" : "#e5e7eb"} />
              <Text style={[styles.methodTitle, metodoSelecionado === "pix" && styles.methodTitleActive]}>PIX</Text>
              <Text style={[styles.methodSubtitle, metodoSelecionado === "pix" && styles.methodSubtitleActive]}>
                Instantâneo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo financeiro</Text>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Serviço</Text>
            <Text style={styles.servico}>{pedido.categoria}</Text>
          </View>

          <Text style={styles.label}>Descrição</Text>
          <Text style={styles.descricao}>{pedido.descricao}</Text>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <Text style={styles.detailLabel}>Valor do serviço</Text>
            <Text style={styles.detailValue}>R$ {valorTotal.toFixed(2)}</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.detailLabel}>Taxa da plataforma ({taxaPercentualLabel})</Text>
            <Text style={styles.detailMuted}>R$ {taxaPlataforma.toFixed(2)}</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.detailLabel}>Repasse ao profissional</Text>
            <Text style={styles.detailGreen}>R$ {valorProfissional.toFixed(2)}</Text>
          </View>

          <View style={styles.distributionCard}>
            <Text style={styles.distributionTitle}>Distribuição do pagamento</Text>
            <Text style={styles.distributionText}>{resumoDistribuicao}</Text>
          </View>
        </View>

        <View style={styles.securityCard}>
          <Ionicons name="shield-checkmark" size={16} color="#38bdf8" />
          <Text style={styles.securityText}>
            Experiência profissional: pagamento com cartão e PIX sem sair do app, com conciliação automática.
          </Text>
        </View>

        {statusPagamento === "aprovada" ? (
          <View style={styles.lockCard}>
            <Ionicons name="lock-closed" size={16} color="#22c55e" />
            <Text style={styles.lockText}>
              Pagamento aprovado. Este pedido está bloqueado para novo pagamento.
            </Text>
          </View>
        ) : metodoSelecionado === "cartao" ? (
          <>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Dados do cartão</Text>

              <TextInput
                style={styles.input}
                placeholder="Número do cartão"
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                value={numeroCartao}
                onChangeText={(value) => setNumeroCartao(formatCardNumber(value))}
                maxLength={19}
              />

              <TextInput
                style={styles.input}
                placeholder="Nome do titular"
                placeholderTextColor="#64748b"
                autoCapitalize="words"
                value={nomeTitular}
                onChangeText={setNomeTitular}
              />

              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="MM/AA"
                  placeholderTextColor="#64748b"
                  keyboardType="number-pad"
                  value={validade}
                  onChangeText={(value) => setValidade(formatExpiry(value))}
                  maxLength={5}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="CVV"
                  placeholderTextColor="#64748b"
                  keyboardType="number-pad"
                  value={cvv}
                  onChangeText={(value) => setCvv(onlyDigits(value).slice(0, 4))}
                  maxLength={4}
                  secureTextEntry
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="CPF do titular"
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                value={cpfTitular}
                onChangeText={(value) => setCpfTitular(formatCpf(value))}
                maxLength={14}
              />

              <Text style={styles.formHint}>Cobrança em 1x. Dados protegidos e tokenizados pelo Mercado Pago.</Text>
            </View>

            <PressableScale style={[styles.button, cartaoDesabilitado && { opacity: 0.6 }]} onPress={pagarComCartaoNoApp} disabled={cartaoDesabilitado}>
              {processing ? <ActivityIndicator color="#000" /> : <Ionicons name="card" size={16} color="#000" />}
              <Text style={styles.buttonText}>
                {statusPagamento === "aprovada" ? "Pagamento aprovado" : "Pagar com cartão"}
              </Text>
            </PressableScale>
          </>
        ) : (
          <>
            <PressableScale
              style={[styles.button, processing && { opacity: 0.6 }]}
              onPress={gerarPixNoApp}
              disabled={processing || statusPagamento === "aprovada"}
            >
              {processing ? <ActivityIndicator color="#000" /> : <Ionicons name="qr-code" size={16} color="#000" />}
              <Text style={styles.buttonText}>
                {statusPagamento === "aprovada" ? "Pagamento aprovado" : "Gerar PIX no app"}
              </Text>
            </PressableScale>

            {pixData ? (
              <View style={styles.pixPanel}>
                <Text style={styles.pixTitle}>PIX pronto para pagamento</Text>
                <Image source={{ uri: `data:image/png;base64,${pixData.qr_code_base64}` }} style={styles.pixQr} />
                <Text style={styles.pixHint}>Escaneie no app do seu banco ou copie o código abaixo:</Text>
                <Text selectable style={styles.pixCode}>{pixData.qr_code}</Text>
                <PressableScale style={styles.copyBtn} onPress={copiarPix} disabled={statusPagamento === "aprovada"}>
                  <Ionicons name="copy-outline" size={14} color="#e5e7eb" />
                  <Text style={styles.copyText}>Copiar código PIX</Text>
                </PressableScale>
              </View>
            ) : null}
          </>
        )}

        <PressableScale style={styles.refreshBtn} onPress={carregarPedido}>
          <Ionicons name="refresh" size={14} color="#e5e7eb" />
          <Text style={styles.refreshText}>Atualizar status</Text>
        </PressableScale>

        <PressableScale style={styles.backBtn} onPress={() => router.replace(rotaVoltar)}>
          <Text style={styles.backText}>
            {String(pedido?.categoria || "").toLowerCase() === "marketplace"
              ? "Voltar para minhas compras"
              : "Voltar para pedidos"}
          </Text>
        </PressableScale>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: "#05070f",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "#05070f",
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#253045",
    backgroundColor: "#0b1220",
  },
  title: {
    color: "#FACC15",
    fontSize: 22,
    fontWeight: "900",
  },
  highlightCard: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1b2640",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  statusBadge: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  methodWrap: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1b2640",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  methodRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  methodCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2b3a57",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#0a1427",
    gap: 4,
  },
  methodCardActive: {
    borderColor: "#facc15",
    backgroundColor: "#facc15",
  },
  methodTitle: {
    color: "#e5e7eb",
    fontWeight: "800",
    fontSize: 14,
  },
  methodTitleActive: {
    color: "#111827",
  },
  methodSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  methodSubtitleActive: {
    color: "#1f2937",
  },
  card: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1b2640",
    padding: 20,
    borderRadius: 18,
    marginBottom: 12,
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  label: {
    color: "#8da1c2",
    fontSize: 13,
    marginTop: 8,
  },
  servico: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  descricao: {
    color: "#D1D5DB",
    marginBottom: 8,
    marginTop: 4,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#253045",
    marginVertical: 13,
  },
  valor: {
    color: "#22C55E",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 3,
  },
  detailLabel: {
    color: "#cbd5e1",
    fontSize: 13,
    marginBottom: 8,
  },
  detailValue: {
    color: "#f8fafc",
    fontWeight: "800",
    marginBottom: 8,
  },
  detailMuted: {
    color: "#facc15",
    fontWeight: "700",
    marginBottom: 8,
  },
  detailGreen: {
    color: "#22c55e",
    fontWeight: "800",
    marginBottom: 2,
  },
  distributionCard: {
    marginTop: 14,
    backgroundColor: "#0a1427",
    borderWidth: 1,
    borderColor: "#273244",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  distributionTitle: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 12,
  },
  distributionText: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 18,
  },
  securityCard: {
    backgroundColor: "#07162a",
    borderWidth: 1,
    borderColor: "#153252",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  securityText: {
    color: "#dbeafe",
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  lockCard: {
    backgroundColor: "#052e16",
    borderWidth: 1,
    borderColor: "#166534",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  lockText: {
    color: "#dcfce7",
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1b2640",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  formTitle: {
    color: "#e5e7eb",
    fontWeight: "800",
    fontSize: 14,
  },
  input: {
    backgroundColor: "#0a1427",
    borderWidth: 1,
    borderColor: "#273244",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: "#f8fafc",
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  formHint: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 17,
  },
  button: {
    backgroundColor: "#FACC15",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 16,
  },
  pixPanel: {
    marginTop: 12,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1b2640",
    borderRadius: 14,
    padding: 14,
  },
  pixTitle: {
    color: "#e5e7eb",
    fontWeight: "800",
    marginBottom: 8,
  },
  pixQr: {
    width: 220,
    height: 220,
    alignSelf: "center",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  pixHint: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 8,
  },
  pixCode: {
    color: "#d1d5db",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  copyBtn: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#273244",
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  copyText: {
    color: "#e5e7eb",
    fontWeight: "700",
  },
  refreshBtn: {
    marginTop: 12,
    backgroundColor: "#111827",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "#273244",
  },
  refreshText: {
    color: "#e5e7eb",
    fontWeight: "700",
  },
  backBtn: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 8,
  },
  backText: {
    color: "#9CA3AF",
    fontWeight: "700",
  },
});
