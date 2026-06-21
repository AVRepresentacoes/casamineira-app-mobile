import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBranding } from "@/hooks/useBranding";
import {
  createGasCheckoutOrder,
  formatGasPrice,
  listActiveGasRevendedores,
  type GasRevendedor,
} from "@/lib/gas";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type GasCylinderType = "P13" | "P20" | "P45";

type DeliveryForm = {
  recebedor: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  referencia: string;
};

const GAS_DELIVERY_STORAGE_KEY = "@gas_delivery_form";
const CTA_BUTTON_COLOR = "#FACC15";

function buildEtaLabel(value: number | null) {
  if (!value || value <= 0) return "Entrega sob consulta";
  const min = Math.max(10, value - 5);
  const max = value + 10;
  return `${min}-${max} min`;
}

function isDeliveryFormComplete(form: DeliveryForm) {
  return Boolean(
    form.recebedor.trim() &&
      form.endereco.trim() &&
      form.numero.trim() &&
      form.bairro.trim() &&
      form.cidade.trim(),
  );
}

function buildAddressLines(form: DeliveryForm) {
  const line1 = [form.endereco.trim(), form.numero.trim()].filter(Boolean).join(", ");
  const line2 = [form.bairro.trim(), form.cidade.trim()].filter(Boolean).join(" • ");
  const line3 = [form.recebedor.trim(), form.referencia.trim() ? `Referência: ${form.referencia.trim()}` : ""]
    .filter(Boolean)
    .join(" • ");

  return [line1, line2, line3].filter(Boolean);
}

export default function GasCheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { branding } = useBranding();
  const checkoutTokenRef = useRef(`gas_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
  const params = useLocalSearchParams<{
    revendedorId?: string;
    tipoBotijao?: string;
  }>();

  const revendedorId = String(params.revendedorId || "").trim();
  const tipoBotijao = (String(params.tipoBotijao || "P13").trim().toUpperCase() || "P13") as GasCylinderType;
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [supplier, setSupplier] = useState<GasRevendedor | null>(null);
  const [storageScope, setStorageScope] = useState<string | null>(null);
  const [deliveryForm, setDeliveryForm] = useState<DeliveryForm>({
    recebedor: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "Itajubá",
    referencia: "",
  });

  useEffect(() => {
    let active = true;

    const resolveStorageScope = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;
        setStorageScope(session?.user?.id?.trim() || "guest");
      } catch (error) {
        console.log("ERRO AO DEFINIR ESCOPO DO CHECKOUT GAS:", error);
        if (active) {
          setStorageScope("guest");
        }
      }
    };

    void resolveStorageScope();

    return () => {
      active = false;
    };
  }, []);

  const loadCheckout = useCallback(async () => {
    if (!storageScope) return;
    try {
      setLoading(true);
      const [suppliers, rawForm] = await Promise.all([
        listActiveGasRevendedores(),
        AsyncStorage.getItem(`${GAS_DELIVERY_STORAGE_KEY}:${storageScope}`),
      ]);

      const currentSupplier = suppliers.find((item) => item.id === revendedorId) || null;
      setSupplier(currentSupplier);

      if (rawForm) {
        const parsed = JSON.parse(rawForm) as Partial<DeliveryForm>;
        setDeliveryForm((current) => ({
          ...current,
          recebedor: typeof parsed.recebedor === "string" ? parsed.recebedor : current.recebedor,
          endereco: typeof parsed.endereco === "string" ? parsed.endereco : current.endereco,
          numero: typeof parsed.numero === "string" ? parsed.numero : current.numero,
          complemento: typeof parsed.complemento === "string" ? parsed.complemento : current.complemento,
          bairro: typeof parsed.bairro === "string" ? parsed.bairro : current.bairro,
          cidade: typeof parsed.cidade === "string" && parsed.cidade.trim() ? parsed.cidade : current.cidade,
          referencia: typeof parsed.referencia === "string" ? parsed.referencia : current.referencia,
        }));
      }
    } catch (error) {
      console.log("ERRO CHECKOUT GAS:", error);
      Alert.alert("Erro", "Não foi possível carregar o checkout do gás.");
    } finally {
      setLoading(false);
    }
  }, [revendedorId, storageScope]);

  useEffect(() => {
    void loadCheckout();
  }, [loadCheckout]);

  const precoGas = Number(supplier?.preco_p13 || 0);
  const taxaEntrega = 0;
  const taxaServico = 0;
  const total = Number((precoGas + taxaEntrega + taxaServico).toFixed(2));
  const addressReady = isDeliveryFormComplete(deliveryForm);
  const addressLines = buildAddressLines(deliveryForm);
  const paymentMethods = useMemo(() => ["Pix", "Cartão"], []);

  const handlePay = useCallback(async () => {
    if (!supplier) {
      Alert.alert("Fornecedor indisponível", "Não encontramos esse revendedor para concluir o pagamento.");
      return;
    }

    if (!addressReady) {
      Alert.alert("Confirme a entrega", "Volte um passo e informe o endereço para continuar.");
      return;
    }

    try {
      setProcessing(true);
      const result = await createGasCheckoutOrder({
        revendedorId: supplier.id,
        tipoBotijao,
        checkoutToken: checkoutTokenRef.current,
        recebedor: deliveryForm.recebedor,
        endereco: deliveryForm.endereco,
        numero: deliveryForm.numero,
        complemento: deliveryForm.complemento,
        bairro: deliveryForm.bairro,
        cidade: deliveryForm.cidade,
        referencia: deliveryForm.referencia,
      });

      if (!result.pedidoId) {
        throw new Error("O checkout do gás não retornou um pedido válido.");
      }

      router.replace(`/(cliente)/pedidos/${result.pedidoId}/pagar`);
    } catch (error: any) {
      Alert.alert("Erro no checkout", error?.message || "Não foi possível iniciar o pagamento do gás.");
    } finally {
      setProcessing(false);
    }
  }, [addressReady, deliveryForm, router, supplier, tipoBotijao]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={branding.primaryColor || CTA_BUTTON_COLOR} />
      </View>
    );
  }

  if (!supplier) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Fornecedor indisponível</Text>
        <Text style={styles.emptyText}>Volte para a tela de gás e escolha uma opção disponível.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: 170 + insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color="#f8fafc" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Finalizar pedido</Text>
            <Text style={styles.headerSubtitle}>Pagamento seguro no app</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Resumo do pedido</Text>
          <Text style={styles.title}>{tipoBotijao} com {supplier.nome}</Text>
          <Text style={styles.meta}>{buildEtaLabel(supplier.tempo_entrega_min)} • {[supplier.bairro, supplier.cidade].filter(Boolean).join(" • ") || "Itajubá e região"}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTop}>
            <View>
              <Text style={styles.sectionLabel}>Entregar em</Text>
              <Text style={styles.sectionHint}>Seu pedido será enviado com esses dados</Text>
            </View>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.linkText, { color: branding.primaryColor || CTA_BUTTON_COLOR }]}>Alterar</Text>
            </TouchableOpacity>
          </View>

          {addressLines.length > 0 ? (
            addressLines.map((line) => (
              <Text key={line} style={styles.addressLine}>{line}</Text>
            ))
          ) : (
            <Text style={styles.addressMissing}>Adicione seu endereço para concluir o pedido.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Pagamento</Text>
          <Text style={styles.sectionHint}>Escolha Pix ou cartão na próxima etapa</Text>
          <View style={styles.methodsRow}>
            {paymentMethods.map((method) => (
              <View key={method} style={styles.methodChip}>
                <Text style={styles.methodChipText}>{method}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Resumo financeiro</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Botijão {tipoBotijao}</Text>
            <Text style={styles.summaryValue}>{formatGasPrice(precoGas)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxa de entrega</Text>
            <Text style={styles.summaryValue}>{formatGasPrice(taxaEntrega)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxa de serviço</Text>
            <Text style={styles.summaryValue}>{formatGasPrice(taxaServico)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={[styles.summaryTotalValue, { color: branding.primaryColor || CTA_BUTTON_COLOR }]}>
              {formatGasPrice(total)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footerCopy}>
          <Text style={styles.footerLabel}>{tipoBotijao} • {formatGasPrice(total)}</Text>
          <Text style={styles.footerHint}>
            {addressReady ? `${buildEtaLabel(supplier.tempo_entrega_min)} • Confira e siga para o pagamento` : "Confirme a entrega para continuar"}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.payButton,
            { backgroundColor: branding.primaryColor || CTA_BUTTON_COLOR },
            processing ? styles.payButtonDisabled : null,
          ]}
          activeOpacity={0.88}
          onPress={() => void handlePay()}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <Text style={styles.payButtonText}>Pagar e pedir</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#05070d" },
  container: { flex: 1, backgroundColor: "#05070d" },
  content: { padding: 16, gap: 14 },
  center: {
    flex: 1,
    backgroundColor: "#05070d",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900" },
  headerSubtitle: { color: "#94a3b8", fontSize: 13, marginTop: 2 },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionLabel: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  sectionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 6,
  },
  sectionHint: { color: "#94a3b8", fontSize: 13 },
  title: { color: "#f8fafc", fontSize: 22, fontWeight: "900", lineHeight: 28 },
  meta: { color: "#cbd5e1", fontSize: 14, marginTop: 8 },
  addressLine: { color: "#f8fafc", fontSize: 14, lineHeight: 21, marginTop: 4 },
  addressMissing: { color: "#f59e0b", fontSize: 14 },
  linkText: { fontSize: 13, fontWeight: "800" },
  methodsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  methodChip: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  methodChipText: { color: "#e2e8f0", fontSize: 12, fontWeight: "800" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  summaryLabel: { color: "#cbd5e1", fontSize: 14 },
  summaryValue: { color: "#f8fafc", fontSize: 14, fontWeight: "700" },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 12,
    marginTop: 14,
  },
  summaryTotalLabel: { color: "#f8fafc", fontSize: 15, fontWeight: "800" },
  summaryTotalValue: { fontSize: 22, fontWeight: "900" },
  footer: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 0,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.32)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  footerCopy: { marginBottom: 12 },
  footerLabel: { color: "#f8fafc", fontSize: 16, fontWeight: "900" },
  footerHint: { color: "#cbd5e1", fontSize: 13, marginTop: 4 },
  payButton: {
    minHeight: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: CTA_BUTTON_COLOR,
    shadowOpacity: 0.34,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  payButtonDisabled: { opacity: 0.72 },
  payButtonText: { color: "#111827", fontSize: 16, fontWeight: "900" },
  emptyTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900" },
  emptyText: { color: "#94a3b8", fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 18 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#0f172a",
  },
  secondaryButtonText: { color: "#f8fafc", fontWeight: "800" },
});
