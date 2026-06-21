import { useEmpresa } from "@/contexts/EmpresaContext";
import { useEmpresaCommercial } from "@/hooks/useEmpresaCommercial";
import { getMyEmpresaDashboardSummary, type DashboardSummary } from "@/lib/saas-growth";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DashboardEmpresaScreen() {
  const router = useRouter();
  const { empresa } = useEmpresa();
  const { commercial, onboarding, loadingCommercial, refreshCommercial } = useEmpresaCommercial();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryData] = await Promise.all([getMyEmpresaDashboardSummary(), refreshCommercial()]);
      setSummary(summaryData);
    } finally {
      setLoading(false);
    }
  }, [refreshCommercial]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading || loadingCommercial} onRefresh={() => void carregar()} tintColor="#facc15" />}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Primeira experiência</Text>
        <Text style={styles.title}>{empresa?.nome_exibicao || empresa?.nome || "Sua empresa"}</Text>
        <Text style={styles.subtitle}>
          Use este painel para acelerar o primeiro valor da operação e converter o trial em uso recorrente.
        </Text>
      </View>

      <View style={styles.grid}>
        <StatCard label="Pedidos" value={String(summary?.pedidos_total ?? 0)} />
        <StatCard label="Clientes" value={String(summary?.clientes_total ?? 0)} />
        <StatCard label="Profissionais" value={String(summary?.profissionais_total ?? 0)} />
        <StatCard label="Receita estimada" value={`R$ ${Number(summary?.receita_estimada ?? 0).toFixed(2)}`} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Checklist de ativação</Text>
        <ChecklistRow label="Completar perfil da empresa" done={Boolean(onboarding?.branding_ok)} />
        <ChecklistRow label="Configurar WhatsApp" done={Boolean(onboarding?.whatsapp_ok)} />
        <ChecklistRow label="Cadastrar primeiro profissional" done={Boolean(onboarding?.tem_profissional)} />
        <ChecklistRow label="Cadastrar primeiro cliente" done={Boolean(onboarding?.tem_cliente)} />
        <ChecklistRow label="Criar primeiro pedido" done={Boolean(onboarding?.tem_pedido)} />
      </View>

      <View style={styles.actionRow}>
        <ActionButton label="Editar empresa" onPress={() => router.push("/(profissional)/(internas)/empresa")} />
        <ActionButton label="Convidar profissionais" onPress={() => router.push("/(profissional)/(internas)/convites-profissionais")} />
        <ActionButton label="Ver assinatura" onPress={() => router.push("/(profissional)/(internas)/assinatura-empresa")} />
      </View>

      {commercial ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status do plano</Text>
          <Text style={styles.bodyText}>
            Plano {commercial.plano_nome || "indefinido"} • Trial {commercial.trial_ativo ? "ativo" : "inativo"} • Pedidos/mês {commercial.pedidos_mes_usados} de{" "}
            {commercial.limite_pedidos_mes ?? "ilimitado"}
          </Text>
          {commercial.usuarios_restantes === 0 || commercial.profissionais_restantes === 0 || commercial.pedidos_mes_restantes === 0 ? (
            <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push("/(profissional)/(internas)/assinatura-empresa")}>
              <Text style={styles.upgradeTitle}>Você atingiu um limite do plano atual.</Text>
              <Text style={styles.upgradeSub}>Faça upgrade para continuar crescendo sem travar a operação.</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pedidos recentes</Text>
        {(summary?.pedidos_recentes || []).length === 0 ? (
          <Text style={styles.bodyText}>Nenhum pedido recente ainda.</Text>
        ) : (
          summary?.pedidos_recentes.map((item) => (
            <View key={item.id} style={styles.listRow}>
              <Text style={styles.listTitle}>{item.categoria || "Pedido"}</Text>
              <Text style={styles.listMeta}>{item.status || "sem status"}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Atividade recente</Text>
        {(summary?.atividade_recente || []).length === 0 ? (
          <Text style={styles.bodyText}>Sem atividade recente registrada.</Text>
        ) : (
          summary?.atividade_recente.map((item, index) => (
            <View key={`${item.tipo}-${index}`} style={styles.listRow}>
              <Text style={styles.listTitle}>{item.titulo}</Text>
              <Text style={styles.listMeta}>{item.tipo}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function ChecklistRow({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={styles.listRow}>
      <Text style={styles.listTitle}>{label}</Text>
      <Text style={[styles.listMeta, done ? styles.ok : styles.warn]}>{done ? "ok" : "pendente"}</Text>
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 16, paddingBottom: 80, gap: 14 },
  hero: { backgroundColor: "#0b1220", borderRadius: 22, padding: 18, borderWidth: 1, borderColor: "#1f2937" },
  eyebrow: { color: "#facc15", fontWeight: "900", textTransform: "uppercase", fontSize: 12 },
  title: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 6 },
  subtitle: { color: "#94a3b8", marginTop: 8, lineHeight: 22 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "48%", backgroundColor: "#0b1220", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#1f2937" },
  statLabel: { color: "#94a3b8", fontSize: 12 },
  statValue: { color: "#fff", fontWeight: "900", marginTop: 8, fontSize: 18 },
  card: { backgroundColor: "#0b1220", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#1f2937" },
  cardTitle: { color: "#fff", fontWeight: "900", fontSize: 16, marginBottom: 12 },
  bodyText: { color: "#cbd5e1", lineHeight: 22 },
  actionRow: { gap: 10 },
  actionButton: { borderWidth: 1, borderColor: "#facc15", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  actionButtonText: { color: "#facc15", fontWeight: "800" },
  upgradeButton: { marginTop: 12, backgroundColor: "#111827", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#facc15" },
  upgradeTitle: { color: "#facc15", fontWeight: "900" },
  upgradeSub: { color: "#cbd5e1", marginTop: 4, lineHeight: 20 },
  listRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#111827" },
  listTitle: { color: "#e5e7eb", flex: 1, fontWeight: "700" },
  listMeta: { color: "#94a3b8", textTransform: "capitalize" },
  ok: { color: "#22c55e" },
  warn: { color: "#f59e0b" },
});
