import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { onboardingStyles as S } from "../styles/onboardingStyles";
import OnboardingSlide from "../components/OnboardingSlide";
import WelcomeScreen from "../screens/WelcomeScreen";
import ServicesScreen from "../screens/ServicesScreen";
import ProfileTypeScreen from "../screens/ProfileTypeScreen";
import PermissionsScreen from "../screens/PermissionsScreen";
import SlideIndicator from "../components/SlideIndicator";
import SkipButton from "../components/SkipButton";
import GetStartedButton from "../components/GetStartedButton";

export default function OnboardingNavigator({
  slides,
  index,
  isLast,
  onSkip,
  onNext,
  onFinish,
}: {
  slides: any[];
  index: number;
  isLast: boolean;
  onSkip: () => void;
  onNext: () => void;
  onFinish: () => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const up = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);
    up.setValue(10);

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(up, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [index]);

  const current = slides[index];

  return (
    <View style={S.container}>
      <View style={S.topBar}>
        <View style={{ width: 50 }} />
        {!isLast ? <SkipButton onPress={onSkip} /> : <View style={{ width: 50 }} />}
      </View>

      <WelcomeScreen />

      <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: up }] }}>
        <OnboardingSlide slide={current} />

        {index === 1 ? <ServicesScreen /> : null}
        {index === 2 ? <ProfileTypeScreen /> : null}
        {index === 3 ? <PermissionsScreen /> : null}
      </Animated.View>

      <View style={S.bottom}>
        <SlideIndicator total={slides.length} index={index} />

        {!isLast ? (
          <GetStartedButton title="Continuar" onPress={onNext} />
        ) : (
          <>
            <GetStartedButton title="Entrar" onPress={onFinish} />
          </>
        )}
      </View>
    </View>
  );
}
