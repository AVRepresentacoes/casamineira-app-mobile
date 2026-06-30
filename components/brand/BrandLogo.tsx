import { Image, StyleSheet, Text, View } from "react-native";

type BrandLogoSize = "small" | "medium" | "large";

const LOGO_SIZE: Record<BrandLogoSize, number> = {
  small: 38,
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
        <Image source={require("@/assets/images/icons/icon.png")} style={styles.logo} resizeMode="contain" />
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
    flexShrink: 0,
  },
  logoFrame: {
    overflow: "hidden",
    borderWidth: 0,
    backgroundColor: "transparent",
    padding: 0,
    shadowColor: "#67e8f9",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
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
