import { Pressable, StyleSheet, Text, View } from "react-native";

export type AdminSegmentedOption = {
  label: string;
  value: string;
};

export function AdminSegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: AdminSegmentedOption[];
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable key={option.value} style={[styles.item, active ? styles.itemActive : null]} onPress={() => onChange(option.value)}>
            <Text style={[styles.text, active ? styles.textActive : null]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    padding: 6,
    borderRadius: 999,
    backgroundColor: "rgba(8, 14, 28, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(94, 234, 212, 0.14)",
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.58)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.12)",
  },
  itemActive: {
    backgroundColor: "#facc15",
    borderColor: "rgba(250, 204, 21, 0.98)",
    shadowColor: "#facc15",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  text: {
    color: "#dbe7f4",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  textActive: {
    color: "#08101c",
  },
});
