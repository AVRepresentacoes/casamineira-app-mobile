import { Image } from "expo-image";
import { ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

export function AuthMarketingShell({
  logoSource,
  eyebrow,
  title,
  description,
  highlights,
  children,
  footerActionLabel,
  onFooterAction,
}: {
  logoSource: any;
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  children: ReactNode;
  footerActionLabel?: string;
  onFooterAction?: () => void;
}) {
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS !== "web" || width < 900;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.backdropA, isMobile ? styles.backdropAMobile : null]} />
      <View style={[styles.backdropB, isMobile ? styles.backdropBMobile : null]} />

      <View style={styles.wrap}>
        <View style={[styles.hero, isMobile ? styles.heroMobile : null]}>
          <View style={[styles.heroCopy, isMobile ? styles.heroCopyMobile : null]}>
            <Image source={logoSource} style={[styles.logo, isMobile ? styles.logoMobile : null]} contentFit="contain" />
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={[styles.title, isMobile ? styles.titleMobile : null]}>{title}</Text>
            <Text style={[styles.description, isMobile ? styles.descriptionMobile : null]}>{description}</Text>
          </View>

          <View style={[styles.highlightCard, isMobile ? styles.highlightCardMobile : null]}>
            <Text style={styles.highlightTitle}>O que você vai ativar</Text>
            <View style={styles.highlightList}>
              {highlights.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <View style={styles.highlightDot} />
                  <Text style={styles.highlightText}>{item}</Text>
                </View>
              ))}
            </View>
            {footerActionLabel && onFooterAction ? (
              <Pressable style={[styles.secondaryButton, isMobile ? styles.secondaryButtonMobile : null]} onPress={onFooterAction}>
                <Text style={styles.secondaryButtonText}>{footerActionLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.formArea}>{children}</View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050914",
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  backdropA: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: "rgba(56, 189, 248, 0.10)",
  },
  backdropB: {
    position: "absolute",
    left: -80,
    top: 420,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(250, 204, 21, 0.08)",
  },
  wrap: {
    maxWidth: 1320,
    width: "100%",
    alignSelf: "center",
    gap: 22,
  },
  hero: {
    flexDirection: "row",
    gap: 20,
    alignItems: "stretch",
  },
  heroMobile: {
    flexDirection: "column",
    gap: 16,
  },
  heroCopy: {
    flex: 1.35,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "rgba(9, 15, 31, 0.82)",
    padding: 26,
    gap: 14,
  },
  heroCopyMobile: {
    flex: 0,
    borderRadius: 28,
    padding: 20,
    gap: 12,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  logoMobile: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  eyebrow: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    color: "#f8fafc",
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "900",
    maxWidth: 760,
  },
  titleMobile: {
    fontSize: 28,
    lineHeight: 34,
    maxWidth: "100%",
  },
  description: {
    color: "#90a7c4",
    lineHeight: 26,
    fontSize: 16,
    maxWidth: 760,
  },
  descriptionMobile: {
    fontSize: 14,
    lineHeight: 22,
    maxWidth: "100%",
  },
  highlightCard: {
    flex: 1,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "rgba(9, 15, 31, 0.82)",
    padding: 24,
    gap: 16,
  },
  highlightCardMobile: {
    flex: 0,
    borderRadius: 28,
    padding: 20,
    gap: 14,
  },
  highlightTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  highlightList: {
    gap: 12,
  },
  highlightRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  highlightDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#facc15",
    marginTop: 6,
  },
  highlightText: {
    flex: 1,
    color: "#dbe7f4",
    lineHeight: 23,
  },
  secondaryButton: {
    marginTop: "auto",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.24)",
    backgroundColor: "rgba(15, 23, 42, 0.76)",
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonMobile: {
    marginTop: 4,
  },
  secondaryButtonText: {
    color: "#f8fafc",
    fontWeight: "900",
  },
  formArea: {
    gap: 18,
  },
  backdropAMobile: {
    width: 240,
    height: 240,
    top: -60,
    right: -100,
  },
  backdropBMobile: {
    width: 220,
    height: 220,
    left: -90,
    top: 320,
  },
});
