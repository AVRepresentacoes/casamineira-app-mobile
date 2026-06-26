import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

type BrandLogoSize = "small" | "medium" | "large";

const LOGO_SIZE: Record<BrandLogoSize, number> = {
  small: 34,
  medium: 46,
  large: 64,
};

export function BrandLogo({
  size = "small",
  showText = true,
}: {
  size?: BrandLogoSize;
  showText?: boolean;
}) {
  const logoSize = LOGO_SIZE[size];

  return (
    <View style={styles.row}>
      <View style={[styles.logoFrame, { width: logoSize, height: logoSize, borderRadius: 8 }]}>
        <Image source={require("@/assets/images/icons/icon.png")} style={styles.logo} contentFit="contain" />
      </View>
      {showText ? (
        <View>
          <Text style={[styles.title, size === "large" ? styles.titleLarge : null]}>Casa Mineira SaaS</Text>
          <Text style={styles.subtitle}>Transformamos ideias em empresas digitais</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoFrame: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.16)",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    padding: 4,
    shadowColor: "#67e8f9",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  title: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
  },
  titleLarge: {
    fontSize: 20,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
  },
});
