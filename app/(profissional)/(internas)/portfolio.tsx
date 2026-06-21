import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import PressableScale from "@/components/PressableScale";
import { supabase } from "@/lib/supabase";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";
import { uploadImageAsync } from "@/lib/uploadImage";
import {
  getUsageLabel,
  hasReachedLimit,
  loadProfessionalSubscriptionContext,
  type ProfessionalSubscriptionContext,
} from "@/lib/pro-subscription";

type Portfolio = {
  id: string;
  titulo: string;
  descricao: string;
  imagem_url: string;
};

export default function PortfolioProfissional() {
  const router = useRouter();
  const [lista, setLista] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [subscription, setSubscription] = useState<ProfessionalSubscriptionContext | null>(null);

  const carregamentoMidia = useMemo(
    () => lista.filter((item) => Boolean(item.imagem_url)).length,
    [lista],
  );
  const destaque = lista[0] || null;

  const carregar = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setLoading(false);
      return;
    }

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

    let query = supabase
      .from("portfolio")
      .select("id, titulo, descricao, imagem_url")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query;

    if (!error) {
      setLista((data || []) as Portfolio[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    loadProfessionalSubscriptionContext().then(setSubscription).catch(() => setSubscription(null));
  }, []);

  const escolherImagem = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão necessária", "Autorize acesso à galeria para enviar imagens.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setSaving(true);
    try {
      const publicUrl = await uploadImageAsync(result.assets[0].uri);
      setImagemUrl(publicUrl);
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Falha ao enviar imagem.");
    } finally {
      setSaving(false);
    }
  };

  const salvar = async () => {
    if (!titulo || !imagemUrl) {
      Alert.alert("Erro", "Informe título e imagem");
      return;
    }

    if (subscription && hasReachedLimit(lista.length, subscription.plan.limits.portfolio)) {
      Alert.alert(
        "Limite do plano atingido",
        `Seu plano ${subscription.plan.label} permite ${subscription.plan.limits.portfolio} projetos no portfólio. Faça upgrade para ampliar sua vitrine.`,
      );
      return;
    }

    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

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

      const { error } = await supabase.from("portfolio").insert({
        ...(tenantId ? { tenant_id: tenantId } : {}),
        user_id: auth.user.id,
        titulo,
        descricao,
        imagem_url: imagemUrl,
      });

      if (error) {
        Alert.alert("Erro", error.message);
        return;
      }

      setTitulo("");
      setDescricao("");
      setImagemUrl("");
      carregar();
    } finally {
      setSaving(false);
    }
  };

  const excluir = async (id: string) => {
    let tenantId: string | null = null;
    try {
      tenantId = await getCurrentTenantId();
    } catch {
      tenantId = null;
    }

    let query = supabase.from("portfolio").delete().eq("id", id);
    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }
    await query;
    carregar();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  const header = (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <View style={styles.titleRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="images-outline" size={20} color="#0B0F1A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Vitrine de projetos</Text>
            <Text style={styles.title}>Meu Portfólio</Text>
          </View>
        </View>
        <Text style={styles.heroText}>
          Destaque seus melhores trabalhos com imagem e descrição para aumentar confiança, percepção de qualidade e fechamento.
        </Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaChip}>
            <Ionicons name="sparkles-outline" size={14} color="#facc15" />
            <Text style={styles.heroMetaText}>{lista.length} projetos publicados</Text>
          </View>
          <View style={styles.heroMetaChip}>
            <Ionicons name="image-outline" size={14} color="#facc15" />
            <Text style={styles.heroMetaText}>{carregamentoMidia} com mídia validada</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Projetos publicados</Text>
          <Text style={styles.statValue}>{lista.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Com mídia</Text>
          <Text style={styles.statValue}>{carregamentoMidia}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Projeto em destaque</Text>
          <Text style={styles.statValueSmall}>{destaque ? destaque.titulo : "Nenhum ainda"}</Text>
        </View>
      </View>

      {subscription ? (
        <View style={styles.limitCard}>
          <View>
            <Text style={styles.limitTitle}>Capacidade do plano</Text>
            <Text style={styles.limitText}>
              {subscription.plan.label} • {getUsageLabel(lista.length, subscription.plan.limits.portfolio)}
            </Text>
            <PressableScale style={styles.upgradeButton} onPress={() => router.push("/(profissional)/(internas)/assinatura")}>
              <Text style={styles.upgradeButtonTitle}>Fazer upgrade de plano</Text>
              <Text style={styles.upgradeButtonSub}>Expanda sua vitrine e publique mais cases estratégicos.</Text>
            </PressableScale>
          </View>
          <View style={styles.limitBadge}>
            <Text style={styles.limitBadgeText}>
              {subscription.plan.limits.portfolio === null ? "Ilimitado" : `${subscription.plan.limits.portfolio} max`}
            </Text>
          </View>
        </View>
      ) : null}

      {destaque ? (
        <View style={styles.showcaseCard}>
          <Image source={{ uri: destaque.imagem_url }} style={styles.showcaseImage} />
          <View style={styles.showcaseOverlay} />
          <View style={styles.showcaseBadge}>
            <Text style={styles.showcaseBadgeText}>Projeto em destaque</Text>
          </View>
          <View style={styles.showcaseContent}>
            <Text style={styles.showcaseTitle}>{destaque.titulo}</Text>
            <Text style={styles.showcaseText} numberOfLines={3}>
              {destaque.descricao || "Adicione uma descrição estratégica para valorizar esse case."}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Novo case do portfólio</Text>
          <Text style={styles.sectionHint}>Curadoria visual</Text>
        </View>

        <TextInput placeholder="Título do trabalho" placeholderTextColor="#6b7280" style={styles.input} value={titulo} onChangeText={setTitulo} />
        <TextInput placeholder="Descrição" placeholderTextColor="#6b7280" style={[styles.input, styles.textArea]} value={descricao} onChangeText={setDescricao} multiline textAlignVertical="top" />

        <PressableScale style={styles.secondaryBtn} onPress={escolherImagem}>
          <Text style={styles.secondaryText}>{imagemUrl ? "Trocar imagem" : "Selecionar imagem da galeria"}</Text>
        </PressableScale>

        {imagemUrl ? (
          <View style={styles.previewCard}>
            <Image source={{ uri: imagemUrl }} style={styles.preview} />
            <View style={styles.previewOverlay}>
              <Text style={styles.previewLabel}>Prévia editorial</Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderCard}>
            <Ionicons name="image-outline" size={28} color="#facc15" />
            <Text style={styles.placeholderTitle}>Escolha uma imagem de impacto</Text>
            <Text style={styles.placeholderText}>
              Cases com boa composição visual convertem melhor e fortalecem percepção de autoridade.
            </Text>
          </View>
        )}

        <PressableScale style={[styles.btn, saving && { opacity: 0.7 }]} onPress={salvar} disabled={saving}>
          <Text style={styles.btnText}>{saving ? "Salvando..." : "Adicionar ao Portfólio"}</Text>
        </PressableScale>
      </View>
    </>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      {header}
      {lista.length === 0 ? <Text style={styles.empty}>Seu portfólio ainda está vazio.</Text> : null}
      {lista.map((item) => (
        <View key={item.id} style={styles.item}>
          <Image source={{ uri: item.imagem_url }} style={styles.image} />
          <View style={styles.itemTopRow}>
            <Text style={styles.itemTitle}>{item.titulo}</Text>
            <View style={styles.itemTag}>
              <Text style={styles.itemTagText}>Case</Text>
            </View>
          </View>
          <Text style={styles.itemDesc}>
            {item.descricao || "Sem descrição adicional."}
          </Text>

          <View style={styles.itemFooter}>
            <Text style={styles.itemFooterText}>Pronto para apresentação comercial</Text>
            <PressableScale onPress={() => excluir(item.id)}>
              <Text style={styles.delete}>Excluir</Text>
            </PressableScale>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a" },
  listContent: { padding: 16, paddingBottom: 120 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#03040a" },
  heroCard: {
    backgroundColor: "#081121",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: -24,
    right: -12,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#facc1514",
  },
  title: { color: "#f8fafc", fontSize: 24, fontWeight: "900" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: { flex: 1 },
  eyebrow: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  heroText: { color: "#94a3b8", fontSize: 13, lineHeight: 20 },
  heroMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  heroMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  heroMetaText: { color: "#e2e8f0", fontSize: 12, fontWeight: "700" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  statCard: {
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 104,
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 18,
    padding: 12,
  },
  statLabel: { color: "#9ca3af", fontSize: 12 },
  statValue: { color: "#facc15", fontSize: 18, fontWeight: "900", marginTop: 6 },
  statValueSmall: { color: "#f8fafc", fontSize: 15, fontWeight: "800", marginTop: 6 },
  showcaseCard: {
    height: 260,
    borderRadius: 26,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
  },
  showcaseImage: {
    width: "100%",
    height: "100%",
  },
  showcaseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 10, 24, 0.45)",
  },
  showcaseBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "#facc15",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  showcaseBadgeText: {
    color: "#0B0F1A",
    fontWeight: "900",
    fontSize: 11,
  },
  showcaseContent: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  showcaseTitle: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 8,
  },
  showcaseText: {
    color: "#e2e8f0",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#081121",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "900",
  },
  sectionHint: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 12,
    color: "#e5e7eb",
    borderWidth: 1,
    borderColor: "#304767",
    marginBottom: 10,
  },
  textArea: {
    minHeight: 96,
  },
  btn: { backgroundColor: "#facc15", padding: 14, borderRadius: 16, alignItems: "center", marginTop: 8 },
  btnText: { color: "#000", fontWeight: "900" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: "#0c172d",
  },
  secondaryText: { color: "#cbd5e1", fontWeight: "800" },
  previewCard: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#304767",
  },
  preview: {
    width: "100%",
    height: 180,
    backgroundColor: "#03040a",
  },
  previewOverlay: {
    position: "absolute",
    left: 12,
    top: 12,
    backgroundColor: "rgba(8, 17, 33, 0.78)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  previewLabel: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "800",
  },
  placeholderCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#304767",
    backgroundColor: "#0c172d",
    padding: 18,
    alignItems: "center",
    marginBottom: 8,
  },
  placeholderTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    marginTop: 10,
    marginBottom: 6,
  },
  placeholderText: {
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
  limitCard: {
    backgroundColor: "#081121",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  limitTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 14,
  },
  limitText: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 12,
  },
  upgradeButton: {
    marginTop: 12,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#facc15",
    borderRadius: 14,
    padding: 12,
  },
  upgradeButtonTitle: {
    color: "#facc15",
    fontWeight: "900",
    fontSize: 13,
  },
  upgradeButtonSub: {
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  limitBadge: {
    backgroundColor: "#facc15",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  limitBadgeText: {
    color: "#0B0F1A",
    fontWeight: "900",
    fontSize: 11,
  },
  item: {
    backgroundColor: "#081121",
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#26466f",
  },
  image: {
    width: "100%",
    height: 190,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: "#000",
  },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  itemTitle: { color: "#e5e7eb", fontWeight: "900", fontSize: 18, flex: 1 },
  itemTag: {
    backgroundColor: "#facc15",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  itemTagText: {
    color: "#0B0F1A",
    fontWeight: "900",
    fontSize: 11,
  },
  itemDesc: { color: "#9ca3af", marginTop: 8, lineHeight: 20 },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  itemFooterText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  delete: { color: "#f87171", fontWeight: "800" },
  empty: { color: "#6b7280", textAlign: "center", marginTop: 24 },
});
