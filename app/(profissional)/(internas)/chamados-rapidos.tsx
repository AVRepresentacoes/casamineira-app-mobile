import ChamadoRapidoCard from "@/components/rapid/ChamadoRapidoCard";
import {
  aceitarChamadoRapido,
  expirarChamadosRapidos,
  recusarChamadoRapido,
} from "@/lib/chamadosRapidos";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

type PedidoRapidoResumo = {
  id: string;
  categoria?: string | null;
  servico?: string | null;
  tipo_servico?: string | null;
  descricao?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status_disparo?: string | null;
  expira_em?: string | null;
  tipo_atendimento?: string | null;
  status?: string | null;
};

type ChamadoRapido = {
  id: string;
  pedido_id: string;
  status: string;
  enviado_em?: string | null;
  respondido_em?: string | null;
  pedidos: PedidoRapidoResumo;
};

function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

function tempoRestante(expiraEm?: string | null) {
  if (!expiraEm) return "Sem prazo";
  const fim = new Date(expiraEm).getTime();
  const ms = fim - Date.now();
  if (ms <= 0) return "Expirado";
  const totalSeg = Math.floor(ms / 1000);
  const min = Math.floor(totalSeg / 60);
  const seg = totalSeg % 60;
  return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
}

function labelEstadoChamado(status: string, statusDisparo?: string | null) {
  if (status === "recusado") return "Chamado recusado";
  if (status === "expirado") return "Chamado expirado";
  if (statusDisparo === "aceito") return "Chamado aceito por outro profissional";
  if (statusDisparo === "expirado") return "Tempo para aceite expirado";
  if (statusDisparo === "cancelado") return "Chamado cancelado";
  return "Chamado indisponível";
}

export default function ChamadosRapidosProfissional() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [chamados, setChamados] = useState<ChamadoRapido[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((v) => v + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function carregarLocalizacao() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setUserLocation(null);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const novaLocalizacao = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(novaLocalizacao);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id) {
        await supabase.from("profissionais").upsert({
          user_id: session.user.id,
          latitude: novaLocalizacao.latitude,
          longitude: novaLocalizacao.longitude,
          location_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    void carregarLocalizacao();
  }, []);

  const carregarChamados = useCallback(async () => {
    try {
      setLoading(true);

      await expirarChamadosRapidos();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setChamados([]);
        return;
      }

      const { data, error } = await supabase
        .from("disparo_pedidos")
        .select(
          "id, pedido_id, status, enviado_em, respondido_em, pedidos!inner(id, categoria, servico, tipo_servico, descricao, bairro, cidade, latitude, longitude, status_disparo, expira_em, tipo_atendimento, status)",
        )
        .eq("profissional_id", session.user.id)
        .in("status", ["pendente", "visualizado", "recusado", "expirado"])
        .eq("pedidos.tipo_atendimento", "rapido")
        .in("pedidos.status_disparo", ["disparado", "aceito", "expirado", "cancelado"])
        .order("enviado_em", { ascending: false });

      if (error) {
        console.log("ERRO CHAMADOS RAPIDOS:", error);
        setChamados([]);
        return;
      }

      const lista = ((data || []) as (
        Omit<ChamadoRapido, "pedidos"> & { pedidos: PedidoRapidoResumo | PedidoRapidoResumo[] }
      )[])
        .map((item) => ({
          ...item,
          pedidos: Array.isArray(item.pedidos) ? item.pedidos[0] : item.pedidos,
        }))
        .filter((item) => Boolean(item.pedidos?.id)) as ChamadoRapido[];

      setChamados(lista);
    } catch (error) {
      console.log("ERRO CARREGAR CHAMADOS RAPIDOS:", error);
      setChamados([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarChamados();
    }, [carregarChamados]),
  );

  async function aceitar(item: ChamadoRapido) {
    try {
      setProcessingId(item.id);
      const ok = await aceitarChamadoRapido(item.pedido_id);
      if (!ok) {
        await carregarChamados();
        return;
      }
      router.replace(`/(profissional)/pedidos/${item.pedido_id}`);
    } catch (error) {
      console.log("ERRO ACEITAR CHAMADO RAPIDO:", error);
    } finally {
      setProcessingId(null);
    }
  }

  async function recusar(item: ChamadoRapido) {
    try {
      setProcessingId(item.id);
      await recusarChamadoRapido(item.pedido_id);
      await carregarChamados();
    } catch (error) {
      console.log("ERRO RECUSAR CHAMADO RAPIDO:", error);
    } finally {
      setProcessingId(null);
    }
  }

  const chamadosEnriquecidos = useMemo(() => {
    return chamados.map((item) => {
      let distancia: number | null = null;
      if (
        userLocation &&
        typeof item.pedidos?.latitude === "number" &&
        typeof item.pedidos?.longitude === "number"
      ) {
        distancia = calcularDistanciaKm(
          userLocation.latitude,
          userLocation.longitude,
          item.pedidos.latitude,
          item.pedidos.longitude,
        );
      }
      return { ...item, distancia_km: distancia };
    });
  }, [chamados, userLocation]);
  const disponiveis = useMemo(
    () =>
      chamadosEnriquecidos.filter((item) => {
        const restante = tempoRestante(item.pedidos?.expira_em);
        return item.status !== "recusado" && item.status !== "expirado" && item.pedidos?.status_disparo === "disparado" && restante !== "Expirado";
      }).length,
    [chamadosEnriquecidos],
  );

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.header}>
          <View style={styles.heroIcon}>
            <Ionicons name="flash-outline" size={20} color="#0B0F1A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Resposta imediata</Text>
            <Text style={styles.title}>Chamados Rápidos</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Aceite rápido para prioridade de atendimento. Primeiro aceite válido confirma o chamado.
        </Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Disponíveis agora</Text>
            <Text style={styles.metricValue}>{disponiveis}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total recebido</Text>
            <Text style={styles.metricValue}>{chamadosEnriquecidos.length}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#facc15" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={chamadosEnriquecidos}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void carregarChamados();
              }}
            />
          }
          contentContainerStyle={chamadosEnriquecidos.length === 0 ? styles.emptyWrap : { paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="flash-off-outline" size={24} color="#facc15" />
              <Text style={styles.emptyTitle}>Nenhum chamado rápido agora</Text>
              <Text style={styles.emptyText}>
                Assim que surgir uma oportunidade compatível com sua operação, ela aparece aqui.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const processando = processingId === item.id;
            const restante = tempoRestante(item.pedidos?.expira_em);
            const indisponivel =
              item.status === "recusado" ||
              item.status === "expirado" ||
              item.pedidos?.status_disparo !== "disparado" ||
              restante === "Expirado";

            if (indisponivel) {
              return (
                <View style={styles.stateCard}>
                  <Text style={styles.stateTitle}>
                    {item.pedidos?.tipo_servico || item.pedidos?.servico || "Chamado rápido"}
                  </Text>
                  <Text style={styles.stateText}>
                    {labelEstadoChamado(item.status, item.pedidos?.status_disparo)}
                  </Text>
                </View>
              );
            }

            return (
              <ChamadoRapidoCard
                categoria={item.pedidos?.categoria || "Serviço"}
                servico={item.pedidos?.tipo_servico || item.pedidos?.servico || "Serviço solicitado"}
                descricao={item.pedidos?.descricao || "Sem descrição."}
                bairro={item.pedidos?.bairro || "Bairro"}
                cidade={item.pedidos?.cidade || "Cidade"}
                distanciaKm={typeof (item as any).distancia_km === "number" ? (item as any).distancia_km : null}
                tempoRestante={restante}
                processando={processando}
                onAceitar={() => aceitar(item)}
                onRecusar={() => recusar(item)}
              />
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 16,
  },
  heroCard: {
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
  },
  eyebrow: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: "#94a3b8",
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 16,
    padding: 12,
  },
  metricLabel: {
    color: "#94a3b8",
    fontSize: 11,
  },
  metricValue: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
  },
  emptyWrap: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyCard: {
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 16,
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
  stateCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  stateTitle: {
    color: "#e2e8f0",
    fontWeight: "800",
    marginBottom: 6,
  },
  stateText: {
    color: "#94a3b8",
    fontSize: 12,
  },
});
