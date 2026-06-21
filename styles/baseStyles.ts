import { StyleSheet } from "react-native";

export const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 20,
  },
  title: {
    color: "#facc15",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
  },
  text: {
    color: "#9ca3af",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#020b2a",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  cardActive: {
    borderWidth: 2,
    borderColor: "#facc15",
  },
  cardText: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#facc15",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#020617",
    fontWeight: "900",
    fontSize: 16,
  },
});