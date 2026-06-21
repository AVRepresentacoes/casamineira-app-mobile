import { ExpoConfig } from "expo/config";

const appName = process.env.EXPO_PUBLIC_APP_NAME || "Casa Mineira Serviços";
const appSlug = process.env.EXPO_PUBLIC_APP_SLUG || "casa-mineira";
const appScheme = process.env.EXPO_PUBLIC_APP_SCHEME || "casamineira";
const androidPackage = process.env.EXPO_PUBLIC_ANDROID_PACKAGE || "br.app.casamineiraservicos";
const iosBundleId = process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || "com.casamineira.app";

const config: ExpoConfig = {
  name: appName,
  slug: appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icons/icon.png",
  scheme: appScheme,
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/images/icons/icon.png",
    resizeMode: "contain",
    backgroundColor: "#0B0F1A",
  },

  android: {
    package: androidPackage,
    permissions: [
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.VIBRATE",
    ],
    blockedPermissions: ["android.permission.READ_EXTERNAL_STORAGE"],
    adaptiveIcon: {
      foregroundImage: "./assets/images/icons/icon.png",
      backgroundColor: "#FFFFFF",
    },
  },
  ios: {
    bundleIdentifier: iosBundleId,
  },
  web: {
    favicon: "./assets/images/favicon.png",
    output: "static",
  },
  plugins: [
    [
      "@stripe/stripe-react-native",
      {
        merchantIdentifier:
          process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER || "",
        enableGooglePay: false,
      },
    ],
    "expo-font",
    "expo-router",
    "expo-web-browser",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "A Casa Mineira usa sua localização para encontrar profissionais e lojas próximas.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "A Casa Mineira precisa acessar suas fotos para enviar imagens em pedidos, perfil e catálogo.",
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/images/icons/icon-safe.png",
        color: "#0B0F1A",
        defaultChannel: "default",
      },
    ],
  ],

  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    tenantSlug: process.env.EXPO_PUBLIC_TENANT_SLUG || "default",

    eas: {
      projectId: "cecec7d1-d4a6-4830-b6e6-df2a9cfbf9d1",
    },
  },
};

export default config;
