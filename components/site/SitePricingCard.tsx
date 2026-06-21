import { StyleSheet, Text, View } from "react-native";
import { SiteButton } from "@/components/site/SiteButton";
import type { SaasPlanoComercial } from "@/lib/saas-commercial";
import { normalizeAdminPlanoNome } from "@/lib/admin-display";

export function SitePricingCard({
  plan,
  highlighted,
  onPress,
}: {
  plan: SaasPlanoComercial;
  highlighted?: boolean;
  onPress: () => void;
}) {
  const planName = normalizeAdminPlanoNome(plan.nome, plan.slug);
  const planTag =
    plan.slug === "starter"
      ? "Entrada"
      : plan.slug === "pro"
      ? "Escala"
      : plan.slug === "enterprise"
      ? "Premium"
      : "Plano";

  return (
    <View style={[styles.card, highlighted ? styles.cardHighlighted : null]}>
      {highlighted ? <Text style={styles.badge}>Plano recomendado</Text> : null}
      <Text style={styles.eyebrow}>{planTag}</Text>
      <Text style={styles.title}>{planName || "Plano"}</Text>
      <Text style={styles.price}>R$ {Number(plan.valor || 0).toFixed(2)}<Text style={styles.priceSuffix}>/mês</Text></Text>
      <Text style={styles.description}>{plan.descricao || "Plano desenhado para escalar sua operação com mais controle."}</Text>
      <View style={styles.highlightStrip}>
        <View style={styles.metricChip}>
          <Text style={styles.metricLabel}>Equipe</Text>
          <Text style={styles.metricValue}>{plan.limite_profissionais ?? "Livre"}</Text>
        </View>
        <View style={styles.metricChip}>
          <Text style={styles.metricLabel}>Uso mensal</Text>
          <Text style={styles.metricValue}>{plan.limite_pedidos_mes ?? "Livre"}</Text>
        </View>
      </View>
      <View style={styles.list}>
        <Text style={styles.item}>Usuários: {plan.limite_usuarios ?? "Ilimitado"}</Text>
        <Text style={styles.item}>Profissionais: {plan.limite_profissionais ?? "Ilimitado"}</Text>
        <Text style={styles.item}>Pedidos/mês: {plan.limite_pedidos_mes ?? "Ilimitado"}</Text>
        <Text style={styles.item}>Marca própria: {plan.white_label ? "Incluída" : "Não incluída"}</Text>
        <Text style={styles.item}>Relatórios: {plan.acesso_relatorios ? "Incluídos" : "Não incluídos"}</Text>
      </View>
      <SiteButton label="Começar teste grátis" onPress={onPress} tone={highlighted ? "primary" : "secondary"} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 280,
    flex: 1,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "rgba(9, 15, 31, 0.82)",
    padding: 24,
    gap: 14,
  },
  cardHighlighted: {
    borderColor: "rgba(250, 204, 21, 0.42)",
    backgroundColor: "rgba(250, 204, 21, 0.08)",
  },
  badge: {
    alignSelf: "flex-start",
    color: "#08101c",
    backgroundColor: "#facc15",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  eyebrow: {
    color: "#67e8f9",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  price: {
    color: "#f8fafc",
    fontSize: 34,
    fontWeight: "900",
  },
  priceSuffix: {
    fontSize: 15,
    color: "#96aac7",
    fontWeight: "700",
  },
  description: {
    color: "#96aac7",
    lineHeight: 22,
  },
  highlightStrip: {
    flexDirection: "row",
    gap: 10,
  },
  metricChip: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(15, 23, 42, 0.64)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  metricLabel: {
    color: "#96aac7",
    fontSize: 11,
    fontWeight: "700",
  },
  metricValue: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
  },
  list: {
    gap: 8,
    paddingTop: 4,
  },
  item: {
    color: "#dbe7f4",
    lineHeight: 22,
  },
});
