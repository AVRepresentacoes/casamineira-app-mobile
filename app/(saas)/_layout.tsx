import { isCurrentUserSuperAdmin } from "@/lib/saas-admin";
import { supabase } from "@/lib/supabase";
import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function SaasLayout() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [superAdmin, setSuperAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function validateAccess() {
      try {
        setChecking(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;

        if (!session?.user) {
          setAuthenticated(false);
          setSuperAdmin(false);
          return;
        }

        setAuthenticated(true);
        const allowed = await isCurrentUserSuperAdmin();
        if (!active) return;
        setSuperAdmin(allowed);
      } catch (error) {
        console.log("SAAS ACCESS CHECK ERROR:", error);
        if (!active) return;
        setAuthenticated(false);
        setSuperAdmin(false);
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    void validateAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void validateAccess();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  if (!authenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!superAdmin) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      initialRouteName="empresas"
      screenOptions={{
        headerStyle: { backgroundColor: "#020617" },
        headerTintColor: "#facc15",
        headerTitleStyle: { color: "#ffffff" },
        contentStyle: { backgroundColor: "#020617" },
      }}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
  },
});
