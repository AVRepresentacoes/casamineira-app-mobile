import { assertEmpresaCanPerform } from "@/lib/saas-commercial";
import { supabase } from "@/lib/supabase";
import { dispararPedidoRapido } from "@/lib/chamadosRapidos";
import { getCurrentTenantId } from "@/lib/tenant";
import TipoAtendimentoCard from "@/components/rapid/TipoAtendimentoCard";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ConfirmarPedido() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const categoria =
    typeof params.categoria === "string" ? params.categoria : "";

  const servico =
    typeof params.servico === "string" ? params.servico : "";

  const descricao =
    typeof params.descricao === "string" ? params.descricao : "";

  const [loading, setLoading] = useState(false);
  const [tipoAtendimento, setTipoAtendimento] = useState<"orcamento" | "rapido">("orcamento");

  async function criarPedido() {
    if (loading) return;

    if (!categoria.trim() || !servico.trim() || !descricao.trim()) {
      Alert.alert(
        "Dados incompletos",
        "Preencha categoria, serviço e descrição."
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        Alert.alert("Erro", "Usuário não autenticado.");
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      const tenantId = await getCurrentTenantId();
      await assertEmpresaCanPerform("create_pedido");

      // 📍 PEDIR PERMISSÃO DE LOCALIZAÇÃO
      const { status } = await Location.requestForegroundPermissionsAsync();

      let latitude = null;
      let longitude = null;
      let cidade = null;
      let bairro = null;

      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;

        const address = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (address.length > 0) {
          cidade = address[0].city || null;
          bairro = address[0].district || null;
        }
      }

      const { data: pedidoCriado, error } = await supabase.from("pedidos").insert({
        tenant_id: tenantId,
        cliente_id: userId,
        categoria: categoria.trim(),
        servico: servico.trim(),
        descricao: descricao.trim(),
        status: "aguardando_proposta",
        tipo_atendimento: tipoAtendimento,
        status_disparo: tipoAtendimento === "rapido" ? "pendente" : null,
        latitude,
        longitude,
        cidade,
        bairro,
      }).select("id").single();

      if (error) {
        console.log("ERRO INSERT:", error);
        Alert.alert("Erro ao criar pedido", error.message);
        setLoading(false);
        return;
      }

      let profissionaisDisparados = 0;
      if (tipoAtendimento === "rapido" && pedidoCriado?.id) {
        try {
          profissionaisDisparados = await dispararPedidoRapido(String(pedidoCriado.id), {
            raioKm: 15,
            limite: 5,
            janelaMinutos: 10,
          });
        } catch (dispatchError: any) {
          console.log("ERRO DISPARO RAPIDO:", dispatchError);
        }
      }

      router.replace({
        pathname: "/(cliente)/pedidos/criar/enviado",
        params: {
          modo: tipoAtendimento,
          disparados: String(profissionaisDisparados),
        },
      });
    } catch (err) {
      console.log("ERRO INESPERADO:", err);
      Alert.alert("Erro", "Erro inesperado ao criar pedido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Revise seu pedido</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Categoria</Text>
        <Text style={styles.cardValue}>{categoria}</Text>

        <Text style={styles.cardLabel}>Serviço</Text>
        <Text style={styles.cardValue}>{servico}</Text>

        <Text style={styles.cardLabel}>Descrição</Text>
        <Text style={styles.cardDescription}>{descricao}</Text>
      </View>

      <View style={styles.modoContainer}>
        <Text style={styles.modoTitle}>Receba propostas ou peça atendimento rápido</Text>
        <Text style={styles.modoSubtitle}>
          Escolha a melhor estratégia para seu pedido.
        </Text>

        <TipoAtendimentoCard
          title="Receber propostas"
          description="Profissionais analisam seu pedido e enviam propostas para você escolher a melhor opção."
          badge="Mais opções"
          selected={tipoAtendimento === "orcamento"}
          onPress={() => setTipoAtendimento("orcamento")}
          icon="document-text-outline"
        />

        <TipoAtendimentoCard
          title="Atendimento rápido"
          description="Seu pedido será enviado para profissionais próximos e disponíveis. O primeiro que aceitar assume o chamado."
          badge="Mais rápido"
          selected={tipoAtendimento === "rapido"}
          onPress={() => setTipoAtendimento("rapido")}
          icon="flash-outline"
        />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={criarPedido}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Enviar Pedido</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 20,
  },
  header: {
    color: "#facc15",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#0b1220",
    padding: 20,
    borderRadius: 18,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#111827",
  },
  cardLabel: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 10,
  },
  cardValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  cardDescription: {
    color: "#e5e7eb",
    marginTop: 6,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#facc15",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "900",
    color: "#000",
  },
  modoContainer: {
    backgroundColor: "#0b1220",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#111827",
    marginBottom: 14,
  },
  modoTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },
  modoSubtitle: {
    color: "#94a3b8",
    marginTop: 4,
    marginBottom: 12,
    fontSize: 12,
  },
});
