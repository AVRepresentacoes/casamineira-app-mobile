import { aceitarPropostaComComissao } from "@/lib/marketplace";
import { supabase } from "@/lib/supabase";
import { resolveCurrentTenantId } from "@/lib/tenant";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AceitarProposta() {
  const { id, profissional_id } = useLocalSearchParams<{
    id: string;
    profissional_id: string;
  }>();

  const router = useRouter();

  async function aceitar() {
    try {
      if (!id || !profissional_id) {
        Alert.alert("Erro", "Dados da proposta inválidos.");
        return;
      }
      const tenantId = await resolveCurrentTenantId();

      let propostaQuery = supabase
        .from("propostas")
        .select("id")
        .eq("pedido_id", id)
        .eq("profissional_id", profissional_id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (tenantId) {
        propostaQuery = propostaQuery.eq("tenant_id", tenantId);
      }
      const { data: proposta, error: propostaError } = await propostaQuery.single();

      if (propostaError || !proposta?.id) {
        Alert.alert("Erro", "Proposta não encontrada.");
        return;
      }

      await aceitarPropostaComComissao({
        pedidoId: id,
        propostaId: proposta.id,
      });

      // 1️⃣ Buscar token do profissional
      let perfilQuery = supabase
        .from("profiles")
        .select("expo_push_token")
        .eq("id", profissional_id);
      if (tenantId) {
        perfilQuery = perfilQuery.eq("tenant_id", tenantId);
      }
      const { data: perfil } = await perfilQuery.single();

      // 2️⃣ Enviar push notification
      if (perfil?.expo_push_token) {
        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: perfil.expo_push_token,
            title: "Proposta aceita 🎉",
            body: "Um cliente aceitou sua proposta!",
          }),
        });
      }

      // 3️⃣ Ir para pagamento após aceite
      router.replace(`/(cliente)/pedidos/${id}/pagar`);
    } catch {
      Alert.alert("Erro", "Não foi possível aceitar a proposta.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aceitar proposta</Text>

      <Text style={styles.text}>
        Ao aceitar a proposta, o serviço será iniciado e o chat será liberado.
      </Text>

      <TouchableOpacity style={styles.button} onPress={aceitar}>
        <Text style={styles.buttonText}>Aceitar proposta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F1A",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    color: "#FACC15",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
  },
  text: {
    color: "#9CA3AF",
    marginBottom: 24,
    fontSize: 15,
  },
  button: {
    backgroundColor: "#22C55E",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 16,
  },
});
