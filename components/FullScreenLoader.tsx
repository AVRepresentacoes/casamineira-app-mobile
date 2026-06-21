import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function FullScreenLoader() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#facc15" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040a",
    alignItems: "center",
    justifyContent: "center",
  },
});
