import { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export function AdminTable({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.glow} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            {columns.map((column) => (
              <Text key={column} style={styles.headerCell}>
                {column}
              </Text>
            ))}
          </View>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

export function AdminTableRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

export function AdminTableCell({
  children,
  flex = 1,
}: {
  children: ReactNode;
  flex?: number;
}) {
  return <View style={[styles.cell, { flex }]}>{typeof children === "string" ? <Text style={styles.cellText}>{children}</Text> : children}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(9, 15, 31, 0.88)",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.28)",
    overflow: "hidden",
    position: "relative",
  },
  glow: {
    position: "absolute",
    right: -20,
    top: -30,
    width: 220,
    height: 140,
    borderRadius: 999,
    backgroundColor: "rgba(56, 189, 248, 0.08)",
  },
  table: {
    minWidth: 920,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.18)",
  },
  headerCell: {
    flex: 1,
    color: "#8fb0d6",
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.12)",
  },
  cell: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "center",
  },
  cellText: {
    color: "#e2e8f0",
    fontSize: 14,
  },
});
