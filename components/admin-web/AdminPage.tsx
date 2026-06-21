import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

export function AdminPage({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerGlow} />
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Espaço executivo</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    backgroundColor: "rgba(8, 14, 29, 0.94)",
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "rgba(94, 234, 212, 0.16)",
    padding: 26,
    overflow: "hidden",
    shadowColor: "#020617",
    shadowOpacity: 0.28,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
  },
  headerGlow: {
    position: "absolute",
    right: -32,
    top: -44,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
  },
  copy: {
    flex: 1,
  },
  eyebrow: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  title: {
    color: "#f8fafc",
    fontSize: 38,
    fontWeight: "900",
  },
  subtitle: {
    color: "#94a8c6",
    marginTop: 10,
    maxWidth: 760,
    lineHeight: 25,
    fontSize: 15,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
});
