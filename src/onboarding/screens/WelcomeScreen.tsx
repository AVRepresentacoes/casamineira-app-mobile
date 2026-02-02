import React from "react";
import { Image, View } from "react-native";
import { onboardingStyles as S } from "../styles/onboardingStyles";

export default function WelcomeScreen() {
  return (
    <View style={S.logoWrap}>
      <Image source={require("../../../assets/images/icon.png")} style={S.logo} resizeMode="contain" />
    </View>
  );
}
