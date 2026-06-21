import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  calculateTrustScore,
  generateReferralCode,
  rankProfessionalsForRequest,
  suggestDynamicPrice,
  type NivelDemanda,
  type Urgencia,
} from "@/lib/innovation";

const profissionaisDemo = [
  {
    id: "p1",
    nome: "Carlos Silva",
    notaMedia: 4.9,
    slaMinutos: 12,
    distanciaKm: 4,
    taxaAceite: 0.92,
  },
  {
    id: "p2",
    nome: "Rita Souza",
    notaMedia: 4.7,
    slaMinutos: 20,
    distanciaKm: 8,
    taxaAceite: 0.88,
  },
  {
    id: "p3",
    nome: "Bruno Lima",
    notaMedia: 4.5,
    slaMinutos: 14,
    distanciaKm: 11,
    taxaAceite: 0.8,
  },
];

export default function CentroInovacaoProfissional() {
  const [base, setBase] = useState("180");
  const [distanciaKm, setDistanciaKm] = useState("8");
  const [urgencia, setUrgencia] = useState<Urgencia>("media");
  const [demanda, setDemanda] = useState<NivelDemanda>("normal");

  const pricing = useMemo(() => {
    return suggestDynamicPrice({
      base: Number(base || 0),
      distanciaKm: Number(distanciaKm || 0),
      urgencia,
      demanda,
      reputacaoProfissional: 4.8,
    });
  }, [base, distanciaKm, urgencia, demanda]);

  const ranking = useMemo(
    () => rankProfessionalsForRequest(profissionaisDemo),
    [],
  );

  const trustScore = useMemo(
    () =>
      calculateTrustScore({
        notaMedia: 4.8,
        totalAvaliacoes: 57,
        taxaCancelamento: 0.05,
        taxaNoShow: 0.01,
        taxaConflito: 0.02,
      }),
    [],
  );

  const referralCode = useMemo(
    () => generateReferralCode("8d6bf8da-ef4e-4d2f-acf5-9e20f8e1b001"),
    [],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.titleRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles-outline" size={20} color="#0B0F1A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Lab estratégico</Text>
            <Text style={styles.title}>Centro de Inovação</Text>
          </View>
        </View>
        <Text style={styles.heroText}>
          Simule precificação, reputação, matching e crescimento em um painel de inovação aplicado à operação.
        </Text>
        <View style={styles.heroMetrics}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Preço sugerido</Text>
            <Text style={styles.metricValue}>R$ {pricing.sugerido.toFixed(2)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Trust score</Text>
            <Text style={styles.metricValue}>{trustScore}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pricing intelligence</Text>
        <TextInput
          style={styles.input}
          value={base}
          onChangeText={setBase}
          keyboardType="numeric"
          placeholder="Preco base"
          placeholderTextColor="#6b7280"
        />
        <TextInput
          style={styles.input}
          value={distanciaKm}
          onChangeText={setDistanciaKm}
          keyboardType="numeric"
          placeholder="Distancia (km)"
          placeholderTextColor="#6b7280"
        />
        <View style={styles.row}>
          {(["baixa", "media", "alta"] as const).map((u) => (
            <Pressable
              key={u}
              onPress={() => setUrgencia(u)}
              style={[styles.pill, urgencia === u && styles.pillActive]}
            >
              <Text style={[styles.pillText, urgencia === u && styles.pillTextActive]}>{u}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.row}>
          {(["normal", "alta", "pico"] as const).map((d) => (
            <Pressable
              key={d}
              onPress={() => setDemanda(d)}
              style={[styles.pill, demanda === d && styles.pillActive]}
            >
              <Text style={[styles.pillText, demanda === d && styles.pillTextActive]}>{d}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.metric}>Sugerido: R$ {pricing.sugerido.toFixed(2)}</Text>
        <Text style={styles.meta}>Faixa: R$ {pricing.minimo.toFixed(2)} - R$ {pricing.maximo.toFixed(2)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>2) Matching preditivo</Text>
        {ranking.map((item, idx) => (
          <Text key={item.id} style={styles.meta}>
            #{idx + 1} {item.nome}: score {item.score}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>3) Reputacao antifraude</Text>
        <Text style={styles.metric}>Trust score: {trustScore}</Text>
        <Text style={styles.meta}>Baseado em nota, volume e incidentes operacionais.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>4) Escrow, contratos e pos-servico</Text>
        <Text style={styles.meta}>- Escrow: status pronto para fluxo de liberacao por marco</Text>
        <Text style={styles.meta}>- Contrato digital: checklist e aceite por etapa</Text>
        <Text style={styles.meta}>- Pos-servico: garantia, reabertura e recorrencia</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>5) Agenda, analytics e crescimento</Text>
        <Text style={styles.meta}>- Agenda operacional com janelas e SLA</Text>
        <Text style={styles.meta}>- Analytics: funil proposta-aceite-pagamento</Text>
        <Text style={styles.meta}>- Referral: {referralCode}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  heroCard: {
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
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
  heroText: { color: "#94a3b8", lineHeight: 20, fontSize: 13 },
  heroMetrics: { flexDirection: "row", gap: 10, marginTop: 14 },
  metricCard: {
    flex: 1,
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 16,
    padding: 12,
  },
  metricLabel: { color: "#94a3b8", fontSize: 11 },
  metricValue: { color: "#f8fafc", fontWeight: "900", marginTop: 6, fontSize: 16 },
  card: {
    backgroundColor: "#071026",
    borderWidth: 1,
    borderColor: "#0b1220",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    color: "#e5e7eb",
    fontWeight: "900",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#03040a",
    borderWidth: 1,
    borderColor: "#0b1220",
    borderRadius: 10,
    color: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#03040a",
  },
  pillActive: {
    borderColor: "#facc15",
    backgroundColor: "#1a1705",
  },
  pillText: {
    color: "#94a3b8",
    fontWeight: "700",
  },
  pillTextActive: {
    color: "#facc15",
  },
  metric: {
    color: "#22c55e",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  meta: {
    color: "#9ca3af",
    marginTop: 6,
  },
});
