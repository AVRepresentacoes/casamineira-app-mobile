import { Image, StyleSheet, View } from "react-native";

export function HospedagensLaunchSplash() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/hospedagens-caminhos-da-fe/splash-full.png")}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#12372A",
    zIndex: 999,
    elevation: 999,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
