import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

type GasArtworkVariant = "hero" | "card" | "promo";

type GasArtworkProps = {
  variant?: GasArtworkVariant;
  compact?: boolean;
};

const VARIANT_COLORS: Record<GasArtworkVariant, readonly [string, string, string]> = {
  hero: ["#07111f", "#10233f", "#16335e"],
  card: ["#08111d", "#0f2745", "#173f6b"],
  promo: ["#091322", "#112b4b", "#1a4d7d"],
};

export function GasArtwork({ variant = "hero", compact = false }: GasArtworkProps) {
  return (
    <LinearGradient
      colors={VARIANT_COLORS[variant]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.shell, compact ? styles.shellCompact : null]}
    >
      <View style={[styles.blurOrb, styles.blurOrbPrimary, compact ? styles.blurOrbPrimaryCompact : null]} />
      <View style={[styles.blurOrb, styles.blurOrbSecondary]} />
      <View style={[styles.gridLine, styles.gridLineOne]} />
      <View style={[styles.gridLine, styles.gridLineTwo]} />
      <View style={[styles.gridLine, styles.gridLineThree]} />
      <View style={[styles.cornerFrame, styles.cornerFrameTop]} />
      <View style={[styles.cornerFrame, styles.cornerFrameBottom]} />
      <View style={[styles.signalPill, compact ? styles.signalPillCompact : null]}>
        <Ionicons name="flash" size={compact ? 11 : 13} color="#facc15" />
        <View style={styles.signalDot} />
      </View>

      <View style={[styles.cylinderWrap, compact ? styles.cylinderWrapCompact : null]}>
        <View style={[styles.cylinderShadow, compact ? styles.cylinderShadowCompact : null]} />
        <View style={[styles.cylinderHandle, compact ? styles.cylinderHandleCompact : null]} />
        <View style={[styles.cylinderTop, compact ? styles.cylinderTopCompact : null]} />
        <View style={[styles.cylinderBody, compact ? styles.cylinderBodyCompact : null]}>
          <View style={[styles.highlightStripe, compact ? styles.highlightStripeCompact : null]} />
          <View style={[styles.softReflection, compact ? styles.softReflectionCompact : null]} />
          <View style={[styles.centerSeal, compact ? styles.centerSealCompact : null]}>
            <Ionicons name="flame" size={compact ? 14 : 18} color="#eff6ff" />
          </View>
        </View>
        <View style={[styles.cylinderBase, compact ? styles.cylinderBaseCompact : null]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  shell: {
    minHeight: 220,
    borderRadius: 28,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
  },
  shellCompact: {
    minHeight: 148,
    borderRadius: 22,
  },
  blurOrb: {
    position: "absolute",
    borderRadius: 999,
  },
  blurOrbPrimary: {
    width: 220,
    height: 220,
    top: -72,
    right: -54,
    backgroundColor: "rgba(250, 204, 21, 0.14)",
  },
  blurOrbPrimaryCompact: {
    width: 150,
    height: 150,
    top: -44,
    right: -34,
  },
  blurOrbSecondary: {
    width: 150,
    height: 150,
    left: -40,
    bottom: -52,
    backgroundColor: "rgba(96, 165, 250, 0.14)",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  gridLineOne: {
    top: "32%",
  },
  gridLineTwo: {
    top: "64%",
  },
  gridLineThree: {
    top: "78%",
    opacity: 0.5,
  },
  cornerFrame: {
    position: "absolute",
    width: 54,
    height: 54,
    borderColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
  },
  cornerFrameTop: {
    top: 14,
    left: 14,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerFrameBottom: {
    right: 16,
    bottom: 16,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  signalPill: {
    position: "absolute",
    top: 18,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(8, 15, 28, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.18)",
  },
  signalPillCompact: {
    top: 14,
    right: 14,
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  signalDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#22c55e",
  },
  cylinderWrap: {
    position: "absolute",
    right: 28,
    bottom: 20,
    width: 124,
    alignItems: "center",
  },
  cylinderWrapCompact: {
    right: 18,
    bottom: 12,
    width: 88,
  },
  cylinderShadow: {
    position: "absolute",
    bottom: -2,
    width: 110,
    height: 18,
    borderRadius: 999,
    backgroundColor: "rgba(2, 6, 23, 0.38)",
  },
  cylinderShadowCompact: {
    width: 78,
    height: 14,
  },
  cylinderHandle: {
    width: 48,
    height: 18,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 4,
    borderBottomWidth: 0,
    borderColor: "#93c5fd",
    backgroundColor: "transparent",
    zIndex: 2,
  },
  cylinderHandleCompact: {
    width: 34,
    height: 14,
    borderWidth: 3,
    borderBottomWidth: 0,
  },
  cylinderTop: {
    width: 76,
    height: 12,
    borderRadius: 999,
    marginTop: -2,
    backgroundColor: "#60a5fa",
    zIndex: 2,
  },
  cylinderTopCompact: {
    width: 54,
    height: 10,
  },
  cylinderBody: {
    width: 98,
    height: 108,
    marginTop: 4,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  cylinderBodyCompact: {
    width: 72,
    height: 78,
    borderRadius: 22,
  },
  highlightStripe: {
    position: "absolute",
    top: 18,
    width: 76,
    height: 16,
    borderRadius: 999,
    backgroundColor: "rgba(219, 234, 254, 0.78)",
  },
  highlightStripeCompact: {
    top: 12,
    width: 54,
    height: 12,
  },
  softReflection: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 28,
    height: 72,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  softReflectionCompact: {
    top: 8,
    right: 8,
    width: 20,
    height: 50,
  },
  centerSeal: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerSealCompact: {
    width: 30,
    height: 30,
  },
  cylinderBase: {
    width: 104,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#93c5fd",
    marginTop: 5,
  },
  cylinderBaseCompact: {
    width: 74,
    height: 10,
    marginTop: 4,
  },
});
