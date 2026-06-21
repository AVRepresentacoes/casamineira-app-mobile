import { supabase } from "@/lib/supabase";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PedidosProfissional() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);

  const RAIO_MAXIMO = 20; // km

  useEffect(() => {
    async function getLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

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
        const { error: locationError } = await supabase.from("profissionais").upsert({
          user_id: session.user.id,
          latitude: novaLocalizacao.latitude,
          longitude: novaLocalizacao.longitude,
          location_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (locationError) {
          console.log("ERRO ATUALIZAR LOCALIZACAO PROFISSIONAL:", locationError);
        }
      }
    }

    getLocation();
  }, []);

  const load = useCallback(async () => {
    if (!userLocation) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .in("status", ["aguardando_proposta", "proposta_recebida"]);

    if (error) {
      console.log(error);
      setPedidos([]);
      setLoading(false);
      return;
    }

    const pedidosComDistancia =
      data?.filter((p: any) => p.tipo_atendimento !== "rapido").map((p: any) => {
        if (!p.latitude || !p.longitude) return null;

        const distancia = calcularDistancia(
          userLocation.latitude,
          userLocation.longitude,
          p.latitude,
          p.longitude
        );

        return { ...p, distancia };
      })
      .filter((p: any) => p && p.distancia <= RAIO_MAXIMO)
      .sort((a: any, b: any) => a.distancia - b.distancia) || [];

    setPedidos(pedidosComDistancia);
    setLoading(false);
    setRefreshing(false);
  }, [userLocation]);

  useEffect(() => {
    if (userLocation) void load();
  }, [load, userLocation]);

  function calcularDistancia(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pedidos Próximos</Text>

      {loading ? (
        <ActivityIndicator color="#facc15" />
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              Nenhum pedido próximo no momento.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push(`/(profissional)/pedidos/${item.id}`)
              }
              activeOpacity={0.8}
            >
              <View style={styles.headerRow}>
                <Text style={styles.cardCategory}>
                  {item.categoria}
                </Text>

                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.distancia} km
                  </Text>
                </View>
              </View>

              <Text style={styles.cardServico}>
                {item.servico}
              </Text>

              <Text style={styles.location}>
                📍 {item.bairro || "Bairro"} - {item.cidade || "Cidade"}
              </Text>

              <Text style={styles.cardDescricao}>
                {item.descricao}
              </Text>

              <Text style={styles.cardAction}>
                Enviar proposta →
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 20,
  },
  title: {
    color: "#facc15",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 16,
  },
  empty: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 40,
  },
  card: {
    backgroundColor: "#0b1220",
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#111827",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardCategory: {
    color: "#facc15",
    fontWeight: "800",
  },
  badge: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: "#000",
    fontWeight: "800",
  },
  cardServico: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 6,
  },
  location: {
    color: "#38bdf8",
    marginBottom: 6,
  },
  cardDescricao: {
    color: "#9ca3af",
    marginBottom: 8,
  },
  cardAction: {
    color: "#22c55e",
    fontWeight: "900",
  },
});
