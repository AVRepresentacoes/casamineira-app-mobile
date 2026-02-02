import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { onboardingStyles as S } from "../styles/onboardingStyles";

export default function SkipButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={S.skipText}>Pular</Text>
    </TouchableOpacity>
  );
}
