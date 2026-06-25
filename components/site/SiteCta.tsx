import { StyleSheet, Text, View } from "react-native";
import { SiteButton } from "@/components/site/SiteButton";

export function SiteCta({
  title,
  body,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: {
  title: string;
  body: string;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      <View style={styles.actions}>
        <SiteButton label={primaryLabel} onPress={onPrimary} />
        {secondaryLabel && onSecondary ? <SiteButton label={secondaryLabel} onPress={onSecondary} tone="secondary" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 30,
    borderWidth: 1.5,
    borderColor: "rgba(250, 204, 21, 0.38)",
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    gap: 20,
    shadowColor: "#facc15",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  copy: {
    gap: 14,
    maxWidth: 820,
  },
  title: {
    color: "#f8fafc",
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "900",
  },
  body: {
    color: "#e2e8f0",
    lineHeight: 25,
    fontSize: 15,
  },
  actions: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
  },
});
