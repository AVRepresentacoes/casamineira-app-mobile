#!/usr/bin/env node

const { existsSync, mkdirSync, readFileSync, writeFileSync } = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");

function usage() {
  console.log(`Casa Mineira AI Factory artifacts

Usage:
  node scripts/ai-factory.js list <runId>
  node scripts/ai-factory.js export <runId>
  node scripts/ai-factory.js export <runId> --write
  node scripts/ai-factory.js export <runId> --write --validate

Safety:
  - export is dry-run by default.
  - --write materializes only paths under clients/<slug>/.
  - builds are never executed by this script.
`);
}

function parseDotEnvFile() {
  const envPath = path.join(root, ".env");
  if (!existsSync(envPath)) return {};

  const parsed = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) parsed[key] = value;
  }
  return parsed;
}

function envValue(name, fallbackName) {
  const dotenv = parseDotEnvFile();
  return process.env[name] || dotenv[name] || (fallbackName ? process.env[fallbackName] || dotenv[fallbackName] : "");
}

function requireSupabaseEnv() {
  const supabaseUrl = envValue("SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = envValue("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente local para exportar artefatos.");
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

async function supabaseGet(pathname) {
  const { supabaseUrl, serviceRoleKey } = requireSupabaseEnv();
  const response = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Supabase REST falhou com HTTP ${response.status}.`);
  }
  return data;
}

function normalizeRelativePath(value) {
  const relativePath = String(value || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!relativePath.startsWith("clients/")) {
    throw new Error(`Caminho bloqueado fora de clients/: ${relativePath}`);
  }
  if (relativePath.includes("../") || relativePath.includes("/..")) {
    throw new Error(`Caminho bloqueado com segmento inseguro: ${relativePath}`);
  }
  return relativePath;
}

function inferSlug(artifacts) {
  const clientJson = artifacts.find((artifact) => artifact.artifact_type === "client_json");
  if (!clientJson) return null;
  const config = JSON.parse(clientJson.content);
  return String(config.tenantSlug || config.appSlug || "").trim() || null;
}

async function loadRun(runId) {
  const rows = await supabaseGet(
    `ai_factory_runs?id=eq.${encodeURIComponent(runId)}&select=id,status,approval_status,prompt,created_at`,
  );
  return rows[0] || null;
}

async function loadArtifacts(runId) {
  return await supabaseGet(
    `ai_factory_artifacts?run_id=eq.${encodeURIComponent(runId)}&select=artifact_type,file_path,content,metadata,created_at&order=created_at.asc`,
  );
}

async function list(runId) {
  const run = await loadRun(runId);
  if (!run) throw new Error("Run nao encontrada.");
  const artifacts = await loadArtifacts(runId);

  console.log(`Run: ${run.id}`);
  console.log(`Status: ${run.status}`);
  console.log(`Aprovacao: ${run.approval_status}`);
  console.log(`Artefatos: ${artifacts.length}`);
  for (const artifact of artifacts) {
    console.log(`- ${artifact.artifact_type}  ${artifact.file_path}`);
  }
}

async function exportArtifacts(runId, options) {
  const run = await loadRun(runId);
  if (!run) throw new Error("Run nao encontrada.");
  if (run.status !== "completed") throw new Error("A run precisa estar completed para exportar artefatos.");
  if (run.approval_status !== "approved") throw new Error("A run precisa estar approved para exportar artefatos.");

  const artifacts = await loadArtifacts(runId);
  if (!artifacts.length) {
    throw new Error("Nenhum artefato encontrado. Gere os artefatos pelo painel antes de exportar.");
  }

  const write = options.includes("--write");
  const validate = options.includes("--validate");
  const slug = inferSlug(artifacts);

  console.log(write ? "Materializando artefatos..." : "Dry-run de exportacao...");

  for (const artifact of artifacts) {
    const relativePath = normalizeRelativePath(artifact.file_path);
    const absolutePath = path.join(root, relativePath);
    console.log(`${write ? "write" : "plan"} ${relativePath}`);

    if (write) {
      mkdirSync(path.dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, artifact.content);
    }
  }

  if (write && validate) {
    if (!slug) throw new Error("Nao foi possivel inferir tenantSlug para validar o cliente.");
    const result = spawnSync("node", ["scripts/saas-client.js", "validate", slug], {
      cwd: root,
      stdio: "inherit",
    });
    if (result.status !== 0) {
      process.exit(result.status || 1);
    }
  }

  if (write) {
    console.log("Artefatos materializados. Build continua bloqueado: use client:build:* apenas apos revisao operacional.");
  }
}

async function main() {
  const [, , command, runId, ...options] = process.argv;
  if (!command || command === "help" || command === "--help") {
    usage();
    return;
  }

  if (!runId) {
    throw new Error("Informe runId.");
  }

  if (command === "list") {
    await list(runId);
    return;
  }

  if (command === "export") {
    await exportArtifacts(runId, options);
    return;
  }

  usage();
  process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
