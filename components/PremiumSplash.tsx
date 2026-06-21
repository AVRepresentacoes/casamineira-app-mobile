import { useEffect, useMemo } from "react";
import { ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type PremiumSplashProps = {
  onFinish?: () => void;
  durationMs?: number;
  logoSource?: ImageSourcePropType;
};

type PieceConfig = {
  key: string;
  initialX: number;
  initialY: number;
  targetX: number;
  targetY: number;
  delay: number;
  size: number;
  color: string;
};

function DustPiece({ initialX, initialY, targetX, targetY, delay, size, color }: PieceConfig) {
  const x = useSharedValue(initialX);
  const y = useSharedValue(initialY);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay - 120, withTiming(0.9, { duration: 240 }));
    x.value = withDelay(
      delay,
      withTiming(targetX, { duration: 980, easing: Easing.out(Easing.cubic) }),
    );
    y.value = withDelay(
      delay,
      withTiming(targetY, { duration: 980, easing: Easing.out(Easing.cubic) }),
    );
    scale.value = withDelay(delay, withTiming(1, { duration: 980 }));
    opacity.value = withDelay(delay + 920, withTiming(0, { duration: 320 }));
  }, [delay, opacity, scale, targetX, targetY, x, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dustPiece, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />;
}

export default function PremiumSplash({
  onFinish,
  durationMs = 3800,
  logoSource = require("../assets/splash.png"),
}: PremiumSplashProps) {
  const bgOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(16);
  const glowOpacity = useSharedValue(0.06);
  const glowScale = useSharedValue(0.86);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(1.08);

  const dustPieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 26;
        const startRadius = 170 + (i % 5) * 18;
        const targetRadius = 18 + (i % 7) * 8;
        return {
          key: `dust-${i}`,
          initialX: Math.cos(angle) * startRadius,
          initialY: Math.sin(angle) * startRadius,
          targetX: Math.cos(angle) * targetRadius + (i % 2 === 0 ? -8 : 8),
          targetY: Math.sin(angle) * targetRadius + (i % 3 === 0 ? -6 : 6),
          delay: 300 + i * 36,
          size: 5 + (i % 4),
          color: "#facc15",
        };
      }),
    [],
  );

  useEffect(() => {
    bgOpacity.value = withTiming(1, { duration: 550 });

    glowOpacity.value = withDelay(
      260,
      withSequence(
        withTiming(0.62, { duration: 540, easing: Easing.out(Easing.cubic) }),
        withTiming(0.48, { duration: 520, easing: Easing.out(Easing.cubic) }),
      ),
    );
    glowScale.value = withDelay(280, withTiming(1.04, { duration: 900, easing: Easing.out(Easing.cubic) }));
    logoOpacity.value = withDelay(1080, withTiming(1, { duration: 700 }));
    logoScale.value = withDelay(1080, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));

    textOpacity.value = withDelay(1520, withTiming(1, { duration: 640 }));
    textY.value = withDelay(1520, withTiming(0, { duration: 640, easing: Easing.out(Easing.cubic) }));

    const timer = setTimeout(() => onFinish?.(), durationMs);
    return () => clearTimeout(timer);
  }, [bgOpacity, durationMs, glowOpacity, glowScale, logoOpacity, logoScale, onFinish, textOpacity, textY]);

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const glowStyleSoft = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * 0.6,
    transform: [{ scale: glowScale.value * 1.18 }],
  }));

  const glowStyleBlue = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * 0.72,
    transform: [{ scale: glowScale.value * 1.12 }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, bgStyle]}>
      <View style={styles.heroWrap}>
        <Animated.View style={[styles.glowBlue, glowStyleBlue]} />
        <Animated.View style={[styles.glowSoft, glowStyleSoft]} />
        <Animated.View style={[styles.glow, glowStyle]} />

        <View style={styles.logoContainer}>
          {dustPieces.map((piece) => (
            <DustPiece
              key={piece.key}
              initialX={piece.initialX}
              initialY={piece.initialY}
              targetX={piece.targetX}
              targetY={piece.targetY}
              delay={piece.delay}
              size={piece.size}
              color={piece.color}
            />
          ))}
          <Animated.Image source={logoSource} style={[styles.logoPiece, logoStyle]} resizeMode="contain" />
        </View>
      </View>

      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={styles.title}>Casa Mineira Serviços</Text>
        <Text style={styles.subtitle}>Conectando clientes e profissionais</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B0F1A",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  logoContainer: {
    zIndex: 2,
    width: 290,
    height: 290,
    alignItems: "center",
    justifyContent: "center",
  },
  heroWrap: {
    width: 430,
    height: 430,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(250,204,21,0.18)",
    zIndex: 1,
  },
  glowBlue: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(59,130,246,0.20)",
    zIndex: 0,
  },
  glowSoft: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: "rgba(250,204,21,0.08)",
    zIndex: 0,
  },
  logoPiece: {
    position: "absolute",
    width: 300,
    height: 300,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 12,
  },
  dustPiece: {
    position: "absolute",
    shadowColor: "#facc15",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
  },
  textContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0.25,
  },
  subtitle: {
    marginTop: 8,
    color: "#E5E7EB",
    fontSize: 14,
    letterSpacing: 0.25,
    fontWeight: "600",
  },
});
