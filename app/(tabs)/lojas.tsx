import { supabase } from "@/lib/supabase";
import { getCartItems } from "@/lib/cart";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Loja = {
  fornecedorId: string;
  nome: string;
  categoria: string;
  produtosAtivos: number;
  banner: string;
};

const fallbackBanner =
  "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=60";

export default function LojasScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [cartCount, setCartCount] = useState(0);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const cartItems = await getCartItems();
      setCartCount(cartItems.reduce((acc, item) => acc + item.quantity, 0));

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

      let produtosQuery = supabase
        .from("produtos_fornecedor")
        .select("fornecedor_id, categoria, imagem_url, ativo")
        .eq("ativo", true);

      if (tenantId) produtosQuery = produtosQuery.eq("tenant_id", tenantId);

      const { data: produtosData, error: produtosError } = await produtosQuery;

      if (produtosError || !produtosData) {
        setLojas([]);
        return;
      }

      const fornecedores = [...new Set((produtosData || []).map((p: any) => String(p.fornecedor_id || "")))].filter(Boolean);
      if (fornecedores.length === 0) {
        setLojas([]);
        return;
      }

      const [{ data: perfis }, { data: profissionais }] = await Promise.all([
        tenantId
          ? supabase.from("profiles").select("id, name").in("id", fornecedores).eq("tenant_id", tenantId)
          : supabase.from("profiles").select("id, name").in("id", fornecedores),
        tenantId
          ? supabase
              .from("profissionais")
              .select("user_id, fornecedor_categoria, fornecedor_nome_fantasia, fornecedor_ativo")
              .in("user_id", fornecedores)
              .eq("fornecedor_ativo", true)
              .eq("tenant_id", tenantId)
          : supabase
              .from("profissionais")
              .select("user_id, fornecedor_categoria, fornecedor_nome_fantasia, fornecedor_ativo")
              .in("user_id", fornecedores)
              .eq("fornecedor_ativo", true),
      ]);

      const nomeMap = new Map((perfis || []).map((p: any) => [String(p.id), String(p.name || "Loja")]));
      const profissionalMap = new Map((profissionais || []).map((p: any) => [String(p.user_id), p]));

      const grouped = new Map<string, Loja>();
      for (const row of produtosData as any[]) {
        const fornecedorId = String(row.fornecedor_id);
        const prof = profissionalMap.get(fornecedorId);
        if (!prof) continue;

        const current = grouped.get(fornecedorId);
        const categoria = String(prof.fornecedor_categoria || row.categoria || "Marketplace");
        const nomeFantasia = String(prof.fornecedor_nome_fantasia || "").trim();
        const nome = nomeFantasia || nomeMap.get(fornecedorId) || "Loja";
        const banner = String(row.imagem_url || "").trim() || fallbackBanner;

        if (!current) {
          grouped.set(fornecedorId, {
            fornecedorId,
            nome,
            categoria,
            produtosAtivos: 1,
            banner,
          });
        } else {
          current.produtosAtivos += 1;
        }
      }

      setLojas(Array.from(grouped.values()).sort((a, b) => b.produtosAtivos - a.produtosAtivos));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const titulo = useMemo(() => `Lojas (${lojas.length})`, [lojas.length]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} overScrollMode="never">
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{titulo}</Text>
          <Text style={styles.subtitle}>Escolha uma loja e navegue no catálogo dela</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.ordersBtn}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/compras",
                params: { from: "lojas" },
              })
            }
          >
            <Ionicons name="receipt-outline" size={16} color="#f8fafc" />
            <Text style={styles.ordersBtnText}>Compras</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/carrinho",
                params: { from: "lojas" },
              })
            }
          >
            <Ionicons name="cart-outline" size={18} color="#f8fafc" />
            {cartCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? <ActivityIndicator color="#facc15" style={{ marginTop: 20 }} /> : null}

      {!loading && lojas.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Ainda não há lojas com produtos ativos.</Text>
        </View>
      ) : null}

      {!loading
        ? lojas.map((loja) => (
            <TouchableOpacity
              key={loja.fornecedorId}
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/lojas/[fornecedorId]",
                  params: { fornecedorId: loja.fornecedorId },
                })
              }
            >
              <ImageBackground
                source={{ uri: loja.banner }}
                style={styles.card}
                imageStyle={styles.cardImage}
                fadeDuration={0}
              >
                <View style={styles.overlay} />
                <View style={styles.cardContent}>
                  <Text style={styles.lojaNome}>{loja.nome}</Text>
                  <Text style={styles.lojaMeta}>{loja.categoria} • {loja.produtosAtivos} produtos</Text>
                  <Text style={styles.openStore}>Entrar na loja</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))
        : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#05070d" },
  content: { padding: 16, paddingBottom: 120, gap: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: { color: "#facc15", fontSize: 26, fontWeight: "900" },
  subtitle: { color: "#94a3b8", marginBottom: 6 },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ordersBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
  },
  ordersBtnText: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "800",
  },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#facc15",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 10,
  },
  card: {
    height: 170,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "flex-end",
    marginTop: 8,
    backfaceVisibility: "hidden",
  },
  cardImage: {
    borderRadius: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  cardContent: {
    padding: 14,
  },
  lojaNome: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 19,
  },
  lojaMeta: {
    color: "#e2e8f0",
    marginTop: 4,
    marginBottom: 8,
  },
  openStore: {
    color: "#facc15",
    fontWeight: "900",
  },
  emptyCard: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },
  emptyText: {
    color: "#94a3b8",
  },
});
