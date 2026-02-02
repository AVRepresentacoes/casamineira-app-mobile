import React from "react";
import { View, Text } from "react-native";
import { onboardingStyles as S } from "../styles/onboardingStyles";

export default function PermissionsScreen() {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={[S.subtitle, { color: "#9ca3af" }]}>
        Na próxima etapa você entra ou cria sua conta.
      </Text>
      <Text style={[S.bullet, { marginTop: 10 }]}>✔ Você controla suas permissões no celular</Text>
      <Text style={[S.bullet, { marginTop: 8 }]}>✔ Nada de enrolação</Text>
    </View>
  );
}
