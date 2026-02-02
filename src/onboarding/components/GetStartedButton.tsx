import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { onboardingStyles as S } from "../styles/onboardingStyles";

export default function GetStartedButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={S.primaryBtn} onPress={onPress}>
      <Text style={S.primaryText}>{title}</Text>
    </TouchableOpacity>
  );
}
