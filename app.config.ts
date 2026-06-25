import { ExpoConfig } from "expo/config";

const appName = process.env.EXPO_PUBLIC_APP_NAME || "Casa Mineira Serviços";
const appSlug = process.env.EXPO_PUBLIC_APP_SLUG || "casa-mineira";
const appScheme = process.env.EXPO_PUBLIC_APP_SCHEME || "casamineira";
const androidPackage = process.env.EXPO_PUBLIC_ANDROID_PACKAGE || "br.app.casamineiraservicos";
const iosBundleId = process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || "com.casamineira.app";
const tenantSlug = process.env.EXPO_PUBLIC_TENANT_SLUG || "default";
const appIcon = process.env.EXPO_PUBLIC_APP_ICON || "./assets/images/icons/icon.png";
const appSplash = process.env.EXPO_PUBLIC_APP_SPLASH || appIcon;
const adaptiveIcon = process.env.EXPO_PUBLIC_ANDROID_ADAPTIVE_ICON || appIcon;
const notificationIcon = process.env.EXPO_PUBLIC_NOTIFICATION_ICON || "./assets/images/icons/icon-safe.png";
const splashBackgroundColor = process.env.EXPO_PUBLIC_SPLASH_BACKGROUND_COLOR || "#0B0F1A";
const splashResizeMode = process.env.EXPO_PUBLIC_SPLASH_RESIZE_MODE === "cover" ? "cover" : "contain";
const adaptiveIconBackgroundColor = process.env.EXPO_PUBLIC_ANDROID_ADAPTIVE_ICON_BACKGROUND || "#FFFFFF";
const notificationColor = process.env.EXPO_PUBLIC_NOTIFICATION_COLOR || "#0B0F1A";
const tenantLock = process.env.EXPO_PUBLIC_LOCK_TENANT !== "false" && tenantSlug !== "default";

const config: ExpoConfig = {
  name: appName,
  slug: appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: appIcon,
  scheme: appScheme,
  userInterfaceStyle: "dark",
  splash: {
    image: appSplash,
    resizeMode: splashResizeMode,
    backgroundColor: splashBackgroundColor,
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
      foregroundImage: adaptiveIcon,
      backgroundColor: adaptiveIconBackgroundColor,
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
        icon: notificationIcon,
        color: notificationColor,
        defaultChannel: "default",
      },
    ],
  ],

  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    tenantSlug,
    tenantLock,
    appName,
    appSlug,
    appScheme,

    eas: {
      projectId: "cecec7d1-d4a6-4830-b6e6-df2a9cfbf9d1",
    },
  },
};

export default config;
