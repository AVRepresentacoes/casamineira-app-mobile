import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { onboardingStyles as S } from "../styles/onboardingStyles";

type Slide = {
  title: string;
  subtitle: string;
  bullets?: string[];
  icon?: any;
};

export default function OnboardingSlide({ slide }: { slide: Slide }) {
  return (
    <View style={S.card}>
      <View style={S.iconCircle}>
        <Ionicons name={slide.icon || "sparkles"} size={24} color="#facc15" />
      </View>

      <Text style={S.title}>{slide.title}</Text>
      <Text style={S.subtitle}>{slide.subtitle}</Text>

      <View style={S.bulletsWrap}>
        {(slide.bullets || []).map((b, idx) => (
          <Text key={idx} style={S.bullet}>
            ✔ {b}
          </Text>
        ))}
      </View>
    </View>
  );
}
