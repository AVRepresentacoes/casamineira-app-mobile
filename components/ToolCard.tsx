import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  href: string;
  pro?: boolean;
  hasPro?: boolean;
};

export function ToolCard({ title, icon, href, pro, hasPro }: Props) {
  const handlePress = () => {
    if (pro && !hasPro) {
      Alert.alert(
        "Funcionalidade PRO",
        "Essa funcionalidade está disponível apenas para contas PRO.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Assinar", onPress: () => router.push("/assinatura") },
        ]
      );
      return;
    }

    router.push(href as any);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <MaterialCommunityIcons
        name={icon}
        size={30}
        color="#facc15"
      />

      <Text style={styles.title}>{title}</Text>

      {pro && <Text style={styles.pro}>PRO</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    padding: 16,
    width: "48%",
    marginBottom: 16,
    minHeight: 96,
    justifyContent: "space-between",
  },
  title: {
    color: "#e5e7eb",
    fontWeight: "800",
    fontSize: 14,
  },
  pro: {
    color: "#facc15",
    fontWeight: "900",
    fontSize: 12,
    alignSelf: "flex-end",
  },
});
