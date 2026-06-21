import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

export function SiteSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 24,
  },
  header: {
    gap: 12,
    maxWidth: 860,
  },
  eyebrow: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    color: "#f8fafc",
    fontSize: 38,
    lineHeight: 46,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  description: {
    color: "#90a7c4",
    fontSize: 16,
    lineHeight: 27,
  },
});
