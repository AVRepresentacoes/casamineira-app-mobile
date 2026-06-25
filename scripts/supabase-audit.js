#!/usr/bin/env node

const { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const migrationsDir = path.join(root, "supabase", "migrations");
const functionsDir = path.join(root, "supabase", "functions");
const reportsDir = path.join(root, "reports");

function readFiles(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(ext))
    .map((file) => ({ file, content: readFileSync(path.join(dir, file), "utf8") }));
}

function collectFunctionFiles(dir = functionsDir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFunctionFiles(fullPath, files);
    } else if (entry.name.endsWith(".ts")) {
      files.push({ file: path.relative(root, fullPath), content: readFileSync(fullPath, "utf8") });
    }
  }
  return files;
}

function unique(values) {
  return [...new Set(values)].sort();
}

const migrations = readFiles(migrationsDir, ".sql");
const sql = migrations.map((entry) => entry.content).join("\n");
const functionFiles = collectFunctionFiles();

const createdTables = unique([...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi)].map((m) => m[1]));
const rlsTables = new Set([...sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s+enable\s+row\s+level\s+security/gi)].map((m) => m[1]));
const missingRls = createdTables.filter((table) => !rlsTables.has(table));
const publicBuckets = [...sql.matchAll(/insert\s+into\s+storage\.buckets[\s\S]*?values\s*\(\s*'([^']+)'[\s\S]*?,\s*true/gi)].map((m) => m[1]);
const storageObjectPolicies = [...sql.matchAll(/create\s+policy\s+([a-zA-Z0-9_]+)[\s\S]*?on\s+storage\.objects/gi)].map((m) => m[1]);
const wildcardCors = functionFiles.filter((entry) => entry.content.includes('"Access-Control-Allow-Origin": "*"')).map((entry) => entry.file);
const missingCorsHelper = functionFiles
  .filter((entry) => entry.file.endsWith("index.ts"))
  .filter((entry) => !entry.content.includes("../_shared/cors.ts"))
  .map((entry) => entry.file);
const serviceRoleFrontend = [];
for (const dir of ["app", "components", "hooks", "lib"]) {
  const base = path.join(root, dir);
  if (!existsSync(base)) continue;
  const stack = [base];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      const relPath = path.relative(root, fullPath);
      if (relPath.startsWith(`app${path.sep}api${path.sep}`)) continue;
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (/\.(ts|tsx|js)$/.test(entry.name)) {
        const content = readFileSync(fullPath, "utf8");
        if (content.includes("SUPABASE_SERVICE_ROLE_KEY")) serviceRoleFrontend.push(relPath);
      }
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    migrations: migrations.length,
    edgeFunctionFiles: functionFiles.filter((entry) => entry.file.endsWith("index.ts")).length,
    createdTables: createdTables.length,
    rlsTables: rlsTables.size,
    publicBuckets: unique(publicBuckets),
    storageObjectPolicies: unique(storageObjectPolicies).length,
  },
  findings: {
    missingRls,
    wildcardCors,
    missingCorsHelper,
    serviceRoleFrontend,
  },
  requiredSecrets: [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "EDGE_ALLOWED_ORIGINS",
    "OPENAI_API_KEY",
    "MERCADO_PAGO_ACCESS_TOKEN",
    "MERCADOPAGO_WEBHOOK_SECRET",
  ],
  optionalSecrets: [
    "ASAAS_API_KEY",
    "ASAAS_WEBHOOK_TOKEN",
  ],
};

mkdirSync(reportsDir, { recursive: true });
writeFileSync(path.join(reportsDir, "supabase-audit-latest.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

const hasCritical = wildcardCors.length > 0 || serviceRoleFrontend.length > 0;
if (hasCritical) process.exit(1);
