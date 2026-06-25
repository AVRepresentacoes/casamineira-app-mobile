#!/usr/bin/env node

const { existsSync, mkdirSync, readFileSync, writeFileSync } = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const clientsRoot = path.join(root, "clients");

function usage() {
  console.log(`Casa Mineira SaaS client automation

Usage:
  node scripts/saas-client.js create <slug> --name "Cliente"
  node scripts/saas-client.js validate <slug>
  node scripts/saas-client.js env <slug>
  node scripts/saas-client.js sql <slug>
  node scripts/saas-client.js start <slug>
  node scripts/saas-client.js open <slug> --port 8083
  node scripts/saas-client.js android <slug>
  node scripts/saas-client.js prebuild:android <slug>
  node scripts/saas-client.js build:android <slug>
  node scripts/saas-client.js submit:android <slug>
  node scripts/saas-client.js list

Options for create:
  --name       App/company display name
  --package    Android package, default br.app.<slug without dashes>
  --scheme     Deep link scheme, default slug without dashes
  --domain     Customer domain, optional
`);
}

function argValue(args, key) {
  const index = args.indexOf(key);
  if (index === -1) return null;
  return args[index + 1] || null;
}

function optionValue(args, keys, fallback) {
  for (const key of keys) {
    const value = argValue(args, key);
    if (value) return value;
  }
  return fallback;
}

function normalizeSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compactSlug(value) {
  return normalizeSlug(value).replace(/-/g, "");
}

function clientDir(slug) {
  return path.join(clientsRoot, slug);
}

function clientConfigPath(slug) {
  return path.join(clientDir(slug), "client.json");
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function loadClient(slug) {
  const normalized = normalizeSlug(slug);
  const file = clientConfigPath(normalized);
  if (!existsSync(file)) {
    throw new Error(`Cliente "${normalized}" não encontrado em ${path.relative(root, file)}.`);
  }
  return { slug: normalized, file, config: readJson(file) };
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function resolveConfigSecret(value, envName, localEnv = parseDotEnvFile()) {
  const directValue = String(value || "").trim();
  if (directValue) return directValue;

  const key = String(envName || "").trim();
  if (!key) return "";
  return process.env[key] || localEnv[key] || "";
}

function requiredEnv(config) {
  const localEnv = parseDotEnvFile();
  const env = {
    EXPO_PUBLIC_APP_NAME: config.appName,
    EXPO_PUBLIC_APP_SLUG: config.appSlug,
    EXPO_PUBLIC_APP_SCHEME: config.appScheme,
    EXPO_PUBLIC_ANDROID_PACKAGE: config.androidPackage,
    EXPO_PUBLIC_IOS_BUNDLE_ID: config.iosBundleId,
    EXPO_PUBLIC_TENANT_SLUG: config.tenantSlug,
    EXPO_PUBLIC_LOCK_TENANT: String(config.lockTenant !== false),
    EXPO_PUBLIC_APP_ICON: config.assets?.icon || "./assets/images/icons/icon.png",
    EXPO_PUBLIC_APP_SPLASH: config.assets?.splash || config.assets?.icon || "./assets/images/icons/icon.png",
    EXPO_PUBLIC_ANDROID_ADAPTIVE_ICON: config.assets?.adaptiveIcon || config.assets?.icon || "./assets/images/icons/icon.png",
    EXPO_PUBLIC_NOTIFICATION_ICON: config.assets?.notificationIcon || "./assets/images/icons/icon-safe.png",
    EXPO_PUBLIC_SPLASH_BACKGROUND_COLOR: config.colors?.splashBackground || "#0B0F1A",
    EXPO_PUBLIC_SPLASH_RESIZE_MODE: config.assets?.splashResizeMode || "contain",
    EXPO_PUBLIC_ANDROID_ADAPTIVE_ICON_BACKGROUND: config.colors?.adaptiveIconBackground || "#FFFFFF",
    EXPO_PUBLIC_NOTIFICATION_COLOR: config.colors?.notification || "#0B0F1A",
  };

  const supabaseUrl = resolveConfigSecret(config.backend?.supabaseUrl, config.backend?.supabaseUrlEnv, localEnv);
  const supabaseAnonKey = resolveConfigSecret(
    config.backend?.supabaseAnonKey,
    config.backend?.supabaseAnonKeyEnv,
    localEnv
  );

  if (supabaseUrl) {
    env.EXPO_PUBLIC_SUPABASE_URL = supabaseUrl;
  }

  if (supabaseAnonKey) {
    env.EXPO_PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey;
  }

  return env;
}

function parseDotEnvFile() {
  const envPath = path.join(root, ".env");
  if (!existsSync(envPath)) return {};

  const parsed = {};
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) parsed[key] = value;
  }

  return parsed;
}

function mergedEnv(config) {
  return {
    ...parseDotEnvFile(),
    ...process.env,
    ...requiredEnv(config),
    EXPO_NO_DOTENV: "1",
  };
}

function validateConfig(slug, config) {
  const errors = [];
  const warnings = [];
  const checks = [
    ["appName", config.appName],
    ["appSlug", config.appSlug],
    ["appScheme", config.appScheme],
    ["androidPackage", config.androidPackage],
    ["iosBundleId", config.iosBundleId],
    ["tenantSlug", config.tenantSlug],
  ];

  for (const [key, value] of checks) {
    if (!String(value || "").trim()) errors.push(`${key} é obrigatório.`);
  }

  if (config.tenantSlug && normalizeSlug(config.tenantSlug) !== config.tenantSlug) {
    errors.push("tenantSlug deve estar em kebab-case, exemplo: super-servicos-belem.");
  }

  if (config.appSlug && normalizeSlug(config.appSlug) !== config.appSlug) {
    errors.push("appSlug deve estar em kebab-case.");
  }

  if (config.appScheme && !/^[a-z][a-z0-9+.-]*$/.test(config.appScheme)) {
    errors.push("appScheme deve começar com letra e conter apenas letras minúsculas, números, +, . ou -.");
  }

  if (config.androidPackage && !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(config.androidPackage)) {
    errors.push("androidPackage inválido. Exemplo válido: br.app.supercliente.");
  }

  if (config.iosBundleId && !/^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z][A-Za-z0-9-]*)+$/.test(config.iosBundleId)) {
    errors.push("iosBundleId inválido. Exemplo válido: br.app.supercliente.");
  }

  if (config.lockTenant !== false && config.tenantSlug !== slug) {
    warnings.push(`tenantSlug (${config.tenantSlug}) é diferente da pasta do cliente (${slug}).`);
  }

  if (config.backend?.requireDedicatedSupabase) {
    const localEnv = parseDotEnvFile();
    const hasSupabaseUrlConfig =
      Boolean(String(config.backend.supabaseUrl || "").trim()) || Boolean(String(config.backend.supabaseUrlEnv || "").trim());
    const hasSupabaseAnonKeyConfig =
      Boolean(String(config.backend.supabaseAnonKey || "").trim()) ||
      Boolean(String(config.backend.supabaseAnonKeyEnv || "").trim());
    const supabaseUrl = resolveConfigSecret(config.backend.supabaseUrl, config.backend.supabaseUrlEnv, localEnv);
    const supabaseAnonKey = resolveConfigSecret(
      config.backend.supabaseAnonKey,
      config.backend.supabaseAnonKeyEnv,
      localEnv
    );

    if (!hasSupabaseUrlConfig) {
      errors.push("backend.supabaseUrl ou backend.supabaseUrlEnv é obrigatório porque este cliente exige Supabase próprio.");
    }

    if (!hasSupabaseAnonKeyConfig) {
      errors.push(
        "backend.supabaseAnonKey ou backend.supabaseAnonKeyEnv é obrigatório porque este cliente exige Supabase próprio."
      );
    }

    for (const forbiddenRef of config.backend.forbiddenSupabaseRefs || []) {
      if (supabaseUrl && supabaseUrl.includes(String(forbiddenRef).trim())) {
        errors.push(`backend.supabaseUrl não pode apontar para o projeto Supabase compartilhado ${forbiddenRef}.`);
      }

      if (supabaseAnonKey && supabaseAnonKey.includes(String(forbiddenRef).trim())) {
        errors.push(`backend.supabaseAnonKey não pode pertencer ao projeto Supabase compartilhado ${forbiddenRef}.`);
      }
    }
  }

  const colorEntries = Object.entries(config.colors || {});
  for (const [key, value] of colorEntries) {
    if (value && !/^#[0-9a-fA-F]{6}$/.test(String(value))) {
      errors.push(`colors.${key} deve ser hexadecimal #RRGGBB.`);
    }
  }

  const assetEntries = Object.entries(config.assets || {});
  for (const [key, value] of assetEntries) {
    if (key === "splashResizeMode") continue;
    if (value && !existsSync(path.resolve(root, value))) {
      warnings.push(`assets.${key} aponta para arquivo inexistente: ${value}`);
    }
  }

  return { errors, warnings };
}

function ensureValid(slug, config) {
  const result = validateConfig(slug, config);
  for (const warning of result.warnings) console.warn(`Aviso: ${warning}`);
  if (result.errors.length) {
    throw new Error(`Configuração inválida:\n- ${result.errors.join("\n- ")}`);
  }
}

function printEnv(config) {
  for (const [key, value] of Object.entries(requiredEnv(config))) {
    console.log(`${key}=${shellQuote(value)}`);
  }
}

function sqlLiteral(value) {
  if (value === null || value === undefined || value === "") return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function generateSql(config) {
  const colors = config.colors || {};
  const assets = config.assets || {};
  const domain = config.domain || null;
  const whatsapp = config.supportWhatsapp || null;
  const slogan = config.slogan || "Plataforma local de serviços e marketplace.";

  return `-- Provisionamento white-label: ${config.appName}
-- Execute no SQL Editor do Supabase com um usuário super_admin.

do $$
begin
  if not exists (
    select 1
    from public.tenants
    where slug = ${sqlLiteral(config.tenantSlug)}
  ) then
    perform public.saas_admin_create_empresa(
      ${sqlLiteral(config.appName)},
      ${sqlLiteral(config.tenantSlug)},
      null,
      ${sqlLiteral(domain)}
    );
  end if;
end $$;

update public.tenants
set
  public_signup_enabled = true,
  logo_url = coalesce(${sqlLiteral(assets.logoUrl)}, logo_url),
  cor_primaria = coalesce(${sqlLiteral(colors.primary)}, cor_primaria),
  cor_secundaria = coalesce(${sqlLiteral(colors.secondary)}, cor_secundaria)
where slug = ${sqlLiteral(config.tenantSlug)};

insert into public.app_branding (
  tenant_slug,
  app_name,
  slogan,
  primary_color,
  secondary_color,
  accent_color,
  logo_url,
  support_whatsapp,
  active
)
values (
  ${sqlLiteral(config.tenantSlug)},
  ${sqlLiteral(config.appName)},
  ${sqlLiteral(slogan)},
  ${sqlLiteral(colors.primary || "#facc15")},
  ${sqlLiteral(colors.secondary || "#020617")},
  ${sqlLiteral(colors.accent || "#1e293b")},
  ${sqlLiteral(assets.logoUrl || null)},
  ${sqlLiteral(whatsapp)},
  true
)
on conflict (tenant_slug) do update
set
  app_name = excluded.app_name,
  slogan = excluded.slogan,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  accent_color = excluded.accent_color,
  logo_url = excluded.logo_url,
  support_whatsapp = excluded.support_whatsapp,
  active = excluded.active;
`;
}

function run(command, commandArgs, config, extraArgs = []) {
  ensureValid(config.tenantSlug, config);
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    env: mergedEnv(config),
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function runAdb(args) {
  const result = spawnSync("adb", args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function openAndroidDevClient(config, args) {
  ensureValid(config.tenantSlug, config);
  const port = optionValue(args, ["--port", "-p"], "8083");
  const url = `http://127.0.0.1:${port}`;
  const encodedUrl = encodeURIComponent(url);
  const deepLink = `exp+${config.appSlug}://expo-development-client/?url=${encodedUrl}`;

  console.log(`Abrindo ${config.appName} no Android...`);
  console.log(`Metro esperado em ${url}`);
  runAdb(["reverse", `tcp:${port}`, `tcp:${port}`]);
  runAdb([
    "shell",
    "am",
    "start",
    "-a",
    "android.intent.action.VIEW",
    "-d",
    deepLink,
    config.androidPackage,
  ]);
}

function createClient(slugArg, args) {
  const slug = normalizeSlug(slugArg);
  const name = argValue(args, "--name");
  if (!slug || !name) {
    throw new Error("Informe slug e --name. Exemplo: npm run client:create super-servicos -- --name \"Super Serviços\"");
  }

  const dir = clientDir(slug);
  const file = clientConfigPath(slug);
  if (existsSync(file)) {
    throw new Error(`Cliente já existe: ${path.relative(root, file)}`);
  }

  mkdirSync(dir, { recursive: true });
  const compact = compactSlug(slug);
  const config = {
    appName: name,
    appSlug: slug,
    appScheme: argValue(args, "--scheme") || compact,
    androidPackage: argValue(args, "--package") || `br.app.${compact}`,
    iosBundleId: argValue(args, "--bundle") || `br.app.${compact}`,
    tenantSlug: slug,
    lockTenant: true,
    domain: argValue(args, "--domain") || "",
    supportWhatsapp: "",
    slogan: "Plataforma local de serviços e marketplace.",
    colors: {
      primary: "#facc15",
      secondary: "#020617",
      accent: "#1e293b",
      splashBackground: "#0B0F1A",
      adaptiveIconBackground: "#FFFFFF",
      notification: "#0B0F1A",
    },
    assets: {
      icon: "./assets/images/icons/icon.png",
      splash: "./assets/images/icons/icon.png",
      adaptiveIcon: "./assets/images/icons/icon.png",
      notificationIcon: "./assets/images/icons/icon-safe.png",
      logoUrl: "",
    },
    backend: {
      requireDedicatedSupabase: false,
      supabaseUrl: "",
      supabaseUrlEnv: "",
      supabaseAnonKey: "",
      supabaseAnonKeyEnv: "",
      forbiddenSupabaseRefs: [],
    },
    store: {
      shortDescription: "Serviços, marketplace local e pedidos rápidos em um só app.",
      privacyPolicyUrl: "",
    },
  };

  writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
  writeFileSync(path.join(dir, "provision.sql"), generateSql(config));
  console.log(`Cliente criado em ${path.relative(root, file)}.`);
  console.log(`SQL inicial em ${path.relative(root, path.join(dir, "provision.sql"))}.`);
}

function listClients() {
  if (!existsSync(clientsRoot)) return;
  const { readdirSync } = require("fs");
  for (const entry of readdirSync(clientsRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && existsSync(clientConfigPath(entry.name))) {
      const config = readJson(clientConfigPath(entry.name));
      console.log(`${entry.name}  ${config.appName || ""}  ${config.androidPackage || ""}`);
    }
  }
}

function main() {
  const [, , command, slugArg, ...args] = process.argv;
  if (!command || command === "help" || command === "--help") {
    usage();
    return;
  }

  if (command === "create") {
    createClient(slugArg, args);
    return;
  }

  if (command === "list") {
    listClients();
    return;
  }

  const { slug, config } = loadClient(slugArg);

  if (command === "validate") {
    const result = validateConfig(slug, config);
    for (const warning of result.warnings) console.warn(`Aviso: ${warning}`);
    if (result.errors.length) {
      console.error(result.errors.map((error) => `- ${error}`).join("\n"));
      process.exit(1);
    }
    console.log(`Cliente ${slug} OK.`);
    return;
  }

  if (command === "env") {
    ensureValid(slug, config);
    printEnv(config);
    return;
  }

  if (command === "sql") {
    ensureValid(slug, config);
    const output = path.join(clientDir(slug), "provision.sql");
    writeFileSync(output, generateSql(config));
    console.log(`SQL atualizado em ${path.relative(root, output)}.`);
    return;
  }

  if (command === "open") {
    openAndroidDevClient(config, args);
    return;
  }

  const commands = {
    start: ["npx", ["expo", "start", "--dev-client"]],
    "prebuild:android": ["npx", ["expo", "prebuild", "--platform", "android"]],
    android: ["npx", ["expo", "run:android"]],
    ios: ["npx", ["expo", "run:ios"]],
    "build:android": ["npx", ["eas", "build", "--platform", "android", "--profile", "production"]],
    "build:ios": ["npx", ["eas", "build", "--platform", "ios", "--profile", "production"]],
    "submit:android": ["npx", ["eas", "submit", "--platform", "android", "--profile", "production"]],
    "submit:ios": ["npx", ["eas", "submit", "--platform", "ios", "--profile", "production"]],
  };

  if (!commands[command]) {
    usage();
    process.exit(1);
  }

  run(commands[command][0], [...commands[command][1], ...args], config);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
