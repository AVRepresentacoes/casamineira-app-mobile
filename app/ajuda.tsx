import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SAAS_SITE_TEXT } from "@/lib/saas-site-content";

export default function AjudaPage() {
  return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{SAAS_SITE_TEXT.docsTitle}</Text>
        {SAAS_SITE_TEXT.docsArticles.map((item) => (
          <View key={item.title} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardText}>{item.body}</Text>
          </View>
        ))}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 20, paddingBottom: 80, gap: 14 },
  title: { color: "#fff", fontSize: 30, fontWeight: "900" },
  card: { backgroundColor: "#0b1220", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#1f2937" },
  cardTitle: { color: "#fff", fontSize: 18, fontWeight: "900", marginBottom: 8 },
  cardText: { color: "#cbd5e1", lineHeight: 22 },
});
