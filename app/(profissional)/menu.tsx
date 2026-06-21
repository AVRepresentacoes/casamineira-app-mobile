import { Ionicons } from "@expo/vector-icons";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  route: string;
};

export default function MenuProfissional() {
  const router = useRouter();
  const { empresa } = useEmpresa();

  const opcoes: MenuItem[] = [
    { icon: "calendar-outline", title: "Agenda Inteligente", route: "/(profissional)/(internas)/agenda" },
    { icon: "stats-chart-outline", title: "Analytics", route: "/(profissional)/(internas)/analytics" },
    { icon: "card-outline", title: "Assinatura PRO", route: "/(profissional)/(internas)/assinatura" },
    { icon: "star-outline", title: "Avaliações", route: "/(profissional)/(internas)/avaliacoes" },
    { icon: "sparkles-outline", title: "Centro de Inovação", route: "/(profissional)/(internas)/inovacao" },
    { icon: "flash-outline", title: "Chamados Rápidos", route: "/(profissional)/(internas)/chamados-rapidos" },
    { icon: "settings-outline", title: "Configurações", route: "/(profissional)/(internas)/configuracoes" },
    { icon: "document-text-outline", title: "Contratos", route: "/(profissional)/(internas)/contratos" },
    { icon: "trending-up-outline", title: "Crescimento", route: "/(profissional)/(internas)/crescimento" },
    { icon: "clipboard-outline", title: "Meus Pedidos", route: "/(profissional)/(internas)/meus-pedidos" },
    { icon: "notifications-outline", title: "Notificações", route: "/(profissional)/(internas)/notificacoes" },
    { icon: "images-outline", title: "Portfólio", route: "/(profissional)/(internas)/portfolio" },
    { icon: "paper-plane-outline", title: "Propostas Enviadas", route: "/(profissional)/(internas)/propostas" },
    { icon: "trophy-outline", title: "Ranking", route: "/(profissional)/(internas)/ranking" },
    { icon: "briefcase-outline", title: "Serviços", route: "/(profissional)/(internas)/servicos" },
  ];

  if (["owner", "admin", "admin_empresa"].includes(String(empresa?.role || ""))) {
    opcoes.splice(7, 0, {
      icon: "grid-outline",
      title: "Dashboard Empresa",
      route: "/(profissional)/(internas)/dashboard-empresa",
    });
    opcoes.splice(8, 0, {
      icon: "business-outline",
      title: "Empresa",
      route: "/(profissional)/(internas)/empresa",
    });
    opcoes.splice(9, 0, {
      icon: "layers-outline",
      title: "Assinatura Empresa",
      route: "/(profissional)/(internas)/assinatura-empresa",
    });
    opcoes.splice(10, 0, {
      icon: "mail-open-outline",
      title: "Convites Profissionais",
      route: "/(profissional)/(internas)/convites-profissionais",
    });
  }

  const Item = ({ icon, title, route }: MenuItem) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => router.push(route as never)}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={22} color="#facc15" />
      <Text style={styles.text}>{title}</Text>
      <Ionicons name="chevron-forward-outline" size={18} color="#6b7280" style={{ marginLeft: "auto" }} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu</Text>

      <FlatList
        data={opcoes}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <Item icon={item.icon} title={item.title} route={item.route} />
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    color: "#facc15",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b1220",
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#111827",
  },
  text: {
    color: "#ffffff",
    marginLeft: 14,
    fontWeight: "700",
    fontSize: 15,
  },
});
