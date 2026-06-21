import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

export function GasDistributorScene() {
  return (
    <LinearGradient
      colors={["#08111d", "#10253f", "#183b63"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.shell}
    >
      <View style={styles.glowPrimary} />
      <View style={styles.glowSecondary} />
      <View style={styles.ground} />

      <View style={styles.depot}>
        <View style={styles.depotRoof} />
        <View style={styles.signPill}>
          <Ionicons name="flame" size={12} color="#facc15" />
          <View style={styles.signDot} />
        </View>
        <View style={styles.depotDoor}>
          <View style={styles.innerShadow} />
          <View style={styles.stackRow}>
            <View style={[styles.cylinder, styles.cylinderDark]} />
            <View style={[styles.cylinder, styles.cylinderBlue]} />
            <View style={[styles.cylinder, styles.cylinderBlue]} />
          </View>
          <View style={styles.stackRow}>
            <View style={[styles.cylinder, styles.cylinderBlue]} />
            <View style={[styles.cylinder, styles.cylinderDark]} />
            <View style={[styles.cylinder, styles.cylinderBlue]} />
          </View>
        </View>
        <View style={styles.windowStrip}>
          <View style={styles.windowPane} />
          <View style={styles.windowPane} />
          <View style={styles.windowPane} />
        </View>
      </View>

      <View style={styles.deliveryTruck}>
        <View style={styles.truckCabin} />
        <View style={styles.truckBody}>
          <View style={styles.truckLogo}>
            <Ionicons name="flash" size={12} color="#eff6ff" />
          </View>
        </View>
        <View style={[styles.wheel, styles.wheelLeft]} />
        <View style={[styles.wheel, styles.wheelRight]} />
      </View>

      <View style={styles.foregroundCylinder}>
        <View style={styles.foregroundHandle} />
        <View style={styles.foregroundTop} />
        <View style={styles.foregroundBody}>
          <View style={styles.foregroundSeal}>
            <Ionicons name="flame" size={18} color="#eff6ff" />
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  shell: {
    minHeight: 216,
    borderRadius: 28,
    overflow: "hidden",
    position: "relative",
  },
  glowPrimary: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(250, 204, 21, 0.12)",
    top: -86,
    right: -42,
  },
  glowSecondary: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(96, 165, 250, 0.10)",
    left: -56,
    bottom: -64,
  },
  ground: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 66,
    backgroundColor: "#0b1220",
  },
  depot: {
    position: "absolute",
    left: 18,
    top: 34,
    width: 180,
    height: 122,
    borderRadius: 18,
    backgroundColor: "#dbe4f0",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  depotRoof: {
    position: "absolute",
    left: -6,
    right: -6,
    top: 0,
    height: 18,
    backgroundColor: "#475569",
  },
  signPill: {
    position: "absolute",
    top: 24,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#0f172a",
  },
  signDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#22c55e",
  },
  depotDoor: {
    position: "absolute",
    left: 16,
    bottom: 0,
    width: 92,
    height: 82,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: "#1e293b",
    overflow: "hidden",
    paddingTop: 20,
    paddingHorizontal: 8,
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.18)",
  },
  stackRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  cylinder: {
    width: 20,
    height: 24,
    borderRadius: 7,
  },
  cylinderBlue: {
    backgroundColor: "#2563eb",
  },
  cylinderDark: {
    backgroundColor: "#60a5fa",
  },
  windowStrip: {
    position: "absolute",
    right: 14,
    bottom: 20,
    gap: 8,
  },
  windowPane: {
    width: 44,
    height: 14,
    borderRadius: 5,
    backgroundColor: "#94a3b8",
  },
  deliveryTruck: {
    position: "absolute",
    right: 30,
    bottom: 28,
    width: 126,
    height: 52,
  },
  truckCabin: {
    position: "absolute",
    left: 0,
    bottom: 14,
    width: 34,
    height: 24,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 8,
    backgroundColor: "#f8fafc",
  },
  truckBody: {
    position: "absolute",
    left: 28,
    bottom: 14,
    width: 72,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  truckLogo: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.24)",
    alignItems: "center",
    justifyContent: "center",
  },
  wheel: {
    position: "absolute",
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#0f172a",
    borderWidth: 4,
    borderColor: "#475569",
  },
  wheelLeft: {
    left: 16,
  },
  wheelRight: {
    left: 78,
  },
  foregroundCylinder: {
    position: "absolute",
    right: 28,
    top: 34,
    alignItems: "center",
  },
  foregroundHandle: {
    width: 34,
    height: 14,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: "#93c5fd",
  },
  foregroundTop: {
    width: 56,
    height: 10,
    borderRadius: 999,
    marginTop: -1,
    backgroundColor: "#60a5fa",
  },
  foregroundBody: {
    width: 72,
    height: 82,
    marginTop: 4,
    borderRadius: 22,
    backgroundColor: "#2563eb",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  foregroundSeal: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.18)",
  },
});
