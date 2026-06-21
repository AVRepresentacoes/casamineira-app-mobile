import { Ionicons } from "@expo/vector-icons";
import {
  CartItem,
  clearCart,
  formatMoney,
  getCartItems,
  removeFromCart,
  summarizeCart,
  updateCartQuantity,
} from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CarrinhoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string; fornecedorId?: string }>();
  const [items, setItems] = useState<CartItem[]>([]);

  const load = useCallback(async () => {
    const data = await getCartItems();
    setItems(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const summary = useMemo(() => summarizeCart(items), [items]);

  async function plus(productId: string, qty: number) {
    const next = await updateCartQuantity(productId, qty + 1);
    setItems(next);
  }

  async function minus(productId: string, qty: number) {
    const next = await updateCartQuantity(productId, qty - 1);
    setItems(next);
  }

  async function remove(productId: string) {
    const next = await removeFromCart(productId);
    setItems(next);
  }

  async function onCheckout() {
    if (items.length === 0) return;
    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const { data, error } = await supabase.functions.invoke("create-marketplace-order", {
        body: payload,
      });

      if (error) {
        let details = "";
        const ctx = (error as any)?.context;
        if (ctx && typeof ctx.json === "function") {
          try {
            const body = await ctx.json();
            details = String(body?.error || body?.message || "").trim();
          } catch {
            // noop
          }
        }
        throw new Error(details || error.message || "Falha ao criar pedido do marketplace.");
      }

      const pedidoId = String((data as any)?.pedidoId || "");
      const pedidoIds = Array.isArray((data as any)?.pedidoIds)
        ? ((data as any).pedidoIds as string[])
        : pedidoId
        ? [pedidoId]
        : [];

      if (!pedidoId) {
        throw new Error("Pedido do marketplace não foi criado corretamente.");
      }

      await clearCart();
      setItems([]);

      if (pedidoIds.length > 1) {
        Alert.alert(
          "Pedidos criados",
          `${pedidoIds.length} pedidos foram criados (um por fornecedor). Você será direcionado para pagar o primeiro agora.`,
          [
            {
              text: "Ir para pagamento",
              onPress: () =>
                router.push(`/(cliente)/pedidos/${pedidoIds[0]}/pagar`),
            },
          ]
        );
        return;
      }

      router.push(`/(cliente)/pedidos/${pedidoId}/pagar`);
    } catch (error: any) {
      Alert.alert("Erro no checkout", error?.message || "Não foi possível finalizar a compra.");
    }
  }

  async function onClear() {
    await clearCart();
    setItems([]);
  }

  function voltarTelaAnterior() {
    const from = String(params.from || "");
    if (from === "marketplace") {
      router.replace("/(tabs)/marketplace");
      return;
    }
    if (from === "lojas") {
      router.replace("/(tabs)/lojas");
      return;
    }
    if (from === "loja" && params.fornecedorId) {
      router.replace({
        pathname: "/(tabs)/lojas/[fornecedorId]",
        params: { fornecedorId: String(params.fornecedorId) },
      });
      return;
    }
    if (from === "compras") {
      router.replace({
        pathname: "/(tabs)/compras",
        params: { from: "carrinho" },
      });
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/marketplace");
  }

  function continuarComprando() {
    const from = String(params.from || "");
    if (from === "loja" && params.fornecedorId) {
      router.replace({
        pathname: "/(tabs)/lojas/[fornecedorId]",
        params: { fornecedorId: String(params.fornecedorId) },
      });
      return;
    }
    if (from === "lojas") {
      router.replace("/(tabs)/lojas");
      return;
    }
    router.replace("/(tabs)/marketplace");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={voltarTelaAnterior} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#facc15" />
        </TouchableOpacity>
        <Text style={styles.title}>Carrinho</Text>
        <TouchableOpacity onPress={continuarComprando}>
          <Text style={styles.link}>Continuar comprando</Text>
        </TouchableOpacity>
      </View>

      {items.map((item) => (
        <View key={item.productId} style={styles.itemCard}>
          <Image source={{ uri: item.product.image }} style={styles.image} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.itemTitle}>
              {item.product.title}
            </Text>
            <Text numberOfLines={1} style={styles.itemSub}>
              {item.product.fornecedorNome}
            </Text>
            <Text style={styles.itemPrice}>{formatMoney(item.product.price)}</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => minus(item.productId, item.quantity)}>
                <Ionicons name="remove" size={14} color="#e2e8f0" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => plus(item.productId, item.quantity)}>
                <Ionicons name="add" size={14} color="#e2e8f0" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={() => remove(item.productId)}>
                <Text style={styles.removeText}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Seu carrinho está vazio.</Text>
        </View>
      ) : null}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumo do pedido</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatMoney(summary.subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Frete</Text>
          <Text style={styles.summaryValue}>{summary.delivery === 0 ? "Grátis" : formatMoney(summary.delivery)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryTotalRow]}>
          <Text style={styles.summaryTotalLabel}>Total</Text>
          <Text style={styles.summaryTotalValue}>{formatMoney(summary.total)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutBtn, items.length === 0 ? { opacity: 0.5 } : null]}
          onPress={onCheckout}
          disabled={items.length === 0}
        >
          <Text style={styles.checkoutText}>Finalizar compra</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.clearBtn, items.length === 0 ? { opacity: 0.5 } : null]}
          onPress={onClear}
          disabled={items.length === 0}
        >
          <Text style={styles.clearText}>Limpar carrinho</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05070d",
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  title: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "900",
  },
  link: {
    color: "#facc15",
    fontWeight: "700",
  },
  itemCard: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  image: {
    width: 82,
    height: 82,
    borderRadius: 10,
  },
  itemTitle: {
    color: "#f8fafc",
    fontWeight: "800",
  },
  itemSub: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
  },
  itemPrice: {
    color: "#22c55e",
    fontWeight: "900",
    marginTop: 6,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    color: "#e2e8f0",
    fontWeight: "800",
    minWidth: 16,
    textAlign: "center",
  },
  removeBtn: {
    marginLeft: "auto",
  },
  removeText: {
    color: "#fda4af",
    fontWeight: "700",
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
  },
  summaryTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    color: "#94a3b8",
  },
  summaryValue: {
    color: "#e2e8f0",
    fontWeight: "700",
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    paddingTop: 10,
    marginTop: 4,
  },
  summaryTotalLabel: {
    color: "#f8fafc",
    fontWeight: "900",
  },
  summaryTotalValue: {
    color: "#22c55e",
    fontWeight: "900",
    fontSize: 17,
  },
  checkoutBtn: {
    backgroundColor: "#facc15",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 10,
  },
  checkoutText: {
    color: "#000",
    fontWeight: "900",
  },
  clearBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 10,
    backgroundColor: "#111827",
  },
  clearText: {
    color: "#e2e8f0",
    fontWeight: "800",
  },
});
