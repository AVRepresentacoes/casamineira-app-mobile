import { colors, radius } from "@/src/saas/design-system";
import { StyleSheet, Text, TextInput as NativeTextInput, TextInputProps, View } from "react-native";

export function PremiumTextInput({ label, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <NativeTextInput placeholderTextColor="#7c8798" {...props} style={[styles.input, props.style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 7,
  },
  label: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "900",
  },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#2c3648",
    backgroundColor: colors.surfaceElevated,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
