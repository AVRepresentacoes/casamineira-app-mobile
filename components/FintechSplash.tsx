import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import { useEffect } from "react";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type FintechSplashProps = {
  onFinish?: () => void;
  durationMs?: number;
  logoSource?: ImageSourcePropType;
};

const BG = "#0B0F1A";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const GOLD = "#FACC15";

type TileProps = {
  index: number;
  grid: number;
  tile: number;
  logoSize: number;
  logoSource: ImageSourcePropType;
};

function FintechTile({ index, grid, tile, logoSize, logoSource }: TileProps) {
  const row = Math.floor(index / grid);
  const col = index % grid;

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const r = useSharedValue(0);
  const s = useSharedValue(0.92);
  const o = useSharedValue(0);

  useEffect(() => {
    const dx = Math.random() * 180 - 90;
    const dy = Math.random() * 220 - 110;
    const rot = Math.random() * 36 - 18;
    const stagger = 180 + index * 30;

    x.value = dx;
    y.value = dy;
    r.value = rot;
    s.value = 0.88;
    o.value = 0;

    o.value = withDelay(stagger, withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }));
    x.value = withDelay(stagger, withTiming(0, { duration: 780, easing: Easing.out(Easing.cubic) }));
    y.value = withDelay(stagger, withTiming(0, { duration: 780, easing: Easing.out(Easing.cubic) }));
    r.value = withDelay(stagger, withTiming(0, { duration: 780, easing: Easing.out(Easing.cubic) }));
    s.value = withDelay(stagger, withTiming(1, { duration: 780, easing: Easing.out(Easing.cubic) }));
  }, [index, o, r, s, x, y]);

  const pieceStyle = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotateZ: `${r.value}deg` },
      { scale: s.value },
    ],
  }));

  return (
    <Animated.View
      style={[styles.tile, { width: tile, height: tile, left: col * tile, top: row * tile }, pieceStyle]}
    >
      <Image
        source={logoSource}
        style={{
          width: logoSize,
          height: logoSize,
          transform: [{ translateX: -col * tile }, { translateY: -row * tile }],
        }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

export default function FintechSplash({
  onFinish,
  durationMs = 3800,
  logoSource = require("../assets/splash.png"),
}: FintechSplashProps) {
  const GRID = 4;
  const logoSize = 208;
  const tile = Math.round(logoSize / GRID);

  const bgFade = useSharedValue(0);
  const logoPulse = useSharedValue(1);
  const logoGlow = useSharedValue(0);
  const shimmerX = useSharedValue(-logoSize);

  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(10);

  useEffect(() => {
    bgFade.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });

    logoPulse.value = withDelay(
      1250,
      withSequence(
        withTiming(1.04, { duration: 180, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }),
      ),
    );

    logoGlow.value = withDelay(
      1220,
      withSequence(
        withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 440, easing: Easing.out(Easing.cubic) }),
      ),
    );

    shimmerX.value = withDelay(
      1340,
      withTiming(logoSize, { duration: 560, easing: Easing.inOut(Easing.cubic) }),
    );

    titleOpacity.value = withDelay(1500, withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) }));
    titleY.value = withDelay(1500, withTiming(0, { duration: 460, easing: Easing.out(Easing.cubic) }));

    const timer = setTimeout(() => onFinish?.(), durationMs);
    return () => clearTimeout(timer);
  }, [bgFade, durationMs, logoGlow, logoPulse, onFinish, shimmerX, titleOpacity, titleY]);

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgFade.value }));
  const logoWrapStyle = useAnimatedStyle(() => ({ transform: [{ scale: logoPulse.value }] }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: logoGlow.value,
    transform: [{ scale: interpolate(logoGlow.value, [0, 1], [0.98, 1.03], Extrapolation.CLAMP) }],
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
    opacity: interpolate(
      shimmerX.value,
      [-logoSize, -logoSize * 0.3, logoSize * 0.3, logoSize],
      [0, 1, 1, 0],
      Extrapolation.CLAMP,
    ),
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: BG }, bgStyle]} />
      <View style={styles.center}>
        <Animated.View style={[styles.logoBox, { width: logoSize, height: logoSize }, logoWrapStyle]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glow,
              { width: logoSize * 1.08, height: logoSize * 1.08, borderRadius: logoSize * 0.54 },
              glowStyle,
            ]}
          />

          <View style={{ width: logoSize, height: logoSize }}>
            {Array.from({ length: GRID * GRID }).map((_, i) => (
              <FintechTile
                key={`tile-${i}`}
                index={i}
                grid={GRID}
                tile={tile}
                logoSize={logoSize}
                logoSource={logoSource}
              />
            ))}
          </View>

          <Animated.View pointerEvents="none" style={[styles.shimmerWrap, { height: logoSize }, shimmerStyle]}>
            <View
              style={{
                width: Math.round(logoSize * 0.48),
                height: logoSize,
                backgroundColor: "rgba(250,204,21,0.35)",
                transform: [{ skewX: "-18deg" }],
                borderRadius: 10,
              }}
            />
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.textWrap, titleStyle]}>
          <Text style={styles.title}>Casa Mineira Serviços</Text>
          <Text style={styles.sub}>Segurança • Agilidade • Confiança</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoBox: { alignItems: "center", justifyContent: "center" },
  tile: {
    position: "absolute",
    overflow: "hidden",
    borderRadius: 10,
  },
  glow: {
    position: "absolute",
    backgroundColor: "rgba(250,204,21,0.10)",
    shadowColor: GOLD,
    shadowOpacity: 0.38,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  shimmerWrap: {
    position: "absolute",
    left: -999,
    top: 0,
    justifyContent: "center",
  },
  textWrap: { marginTop: 22, alignItems: "center" },
  title: {
    color: WHITE,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0.25,
  },
  sub: {
    marginTop: 8,
    color: MUTED,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
