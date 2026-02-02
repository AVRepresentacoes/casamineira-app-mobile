import React from "react";
import { View, Text } from "react-native";
import { onboardingStyles as S } from "../styles/onboardingStyles";
import { servicesData } from "../data/servicesData";

export default function ServicesScreen() {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={[S.subtitle, { color: "#9ca3af", marginBottom: 10 }]}>
        Serviços populares:
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {servicesData.map((s) => (
          <View
            key={s.id}
            style={{
              borderWidth: 1,
              borderColor: "#0b1220",
              backgroundColor: "#03040a",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: "#e6e7e9", fontWeight: "800" }}>{s.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
