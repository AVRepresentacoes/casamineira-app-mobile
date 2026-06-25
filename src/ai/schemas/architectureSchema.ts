export type ArchitectureSchema = {
  frontend: "expo-react-native" | "nextjs";
  backend: "supabase-edge-functions";
  database: "supabase-postgres";
  integrations: string[];
  securityNotes: string[];
};

export function createDefaultArchitecture(integrations: string[]): ArchitectureSchema {
  return {
    frontend: "expo-react-native",
    backend: "supabase-edge-functions",
    database: "supabase-postgres",
    integrations,
    securityNotes: [
      "Manter chaves privadas apenas em Supabase Edge Functions.",
      "Validar JWT antes de executar agentes.",
      "Registrar auditoria por tenant e usuario.",
    ],
  };
}
