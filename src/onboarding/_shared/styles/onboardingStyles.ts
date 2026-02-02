import { StyleSheet } from "react-native";

export const onboardingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040a",
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 22,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  skipText: {
    color: "#9ca3af",
    fontWeight: "800",
    fontSize: 13,
  },

  logoWrap: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },

  logo: {
    width: 85,
    height: 85,
  },

  card: {
    flex: 1,
    backgroundColor: "#071026",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#0b1220",
    justifyContent: "center",
  },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#03040a",
    borderWidth: 1,
    borderColor: "#0b1220",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  title: {
    color: "#facc15",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 10,
    lineHeight: 28,
  },

  subtitle: {
    color: "#e6e7e9",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },

  bulletsWrap: {
    gap: 10,
    marginTop: 6,
  },

  bullet: {
    color: "#9ca3af",
    fontSize: 14,
    lineHeight: 20,
  },

  bottom: {
    marginTop: 16,
    gap: 12,
  },

  primaryBtn: {
    backgroundColor: "#facc15",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 15,
  },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#374151",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryText: {
    color: "#e6e7e9",
    fontWeight: "900",
    fontSize: 14,
  },

  indicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },

  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#374151",
  },

  indicatorDotActive: {
    width: 18,
    backgroundColor: "#facc15",
  },
});
