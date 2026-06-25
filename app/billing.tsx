import { SaasProductShell } from "@/components/saas/SaasProductShell";
import { getPublicSaasPlans } from "@/lib/saas-growth";
import type { SaasPlanoComercial } from "@/lib/saas-commercial";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function BillingScreen() {
  const [plans, setPlans] = useState<SaasPlanoComercial[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getPublicSaasPlans()
        .then((data) => {
          if (active) setPlans(data);
        })
        .catch(() => {
          if (active) setPlans([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <SaasProductShell title="Planos e assinatura" subtitle="Billing da Casa Mineira SaaS para créditos de IA, limites de projeto, templates e publicação de apps.">
      {loading ? <ActivityIndicator color="#facc15" /> : null}
      <View style={styles.grid}>
        {plans.map((plan) => (
          <View key={plan.id} style={styles.card}>
            <Text style={styles.eyebrow}>{plan.slug || "plano"}</Text>
            <Text style={styles.title}>{plan.nome}</Text>
            <Text style={styles.price}>R$ {Number(plan.valor || 0).toFixed(2)}<Text style={styles.suffix}>/mês</Text></Text>
            <Text style={styles.body}>{plan.descricao || "Plano para criar e operar apps com IA."}</Text>
            <Text style={styles.meta}>Usuários: {plan.limite_usuarios ?? "Ilimitado"}</Text>
            <Text style={styles.meta}>Projetos/mês: {plan.limite_pedidos_mes ?? "Ilimitado"}</Text>
          </View>
        ))}
      </View>
    </SaasProductShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    flex: 1,
    minWidth: 280,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.86)",
    padding: 20,
    gap: 10,
  },
  eyebrow: {
    color: "#22d3ee",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
  },
  price: {
    color: "#f8fafc",
    fontSize: 30,
    fontWeight: "900",
  },
  suffix: {
    color: "#94a3b8",
    fontSize: 14,
  },
  body: {
    color: "#a8b5c7",
    lineHeight: 22,
  },
  meta: {
    color: "#e2e8f0",
    fontWeight: "800",
  },
});
