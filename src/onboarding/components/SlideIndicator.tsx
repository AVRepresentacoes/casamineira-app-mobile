import React from "react";
import { View } from "react-native";
import { onboardingStyles as S } from "../styles/onboardingStyles";

export default function SlideIndicator({ total, index }: { total: number; index: number }) {
  return (
    <View style={S.indicatorRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[S.indicatorDot, i === index && S.indicatorDotActive]} />
      ))}
    </View>
  );
}
