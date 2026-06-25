#!/usr/bin/env node

const { existsSync, readdirSync, readFileSync, statSync } = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const ignoredDirs = new Set([".git", "node_modules", "android", "ios", "dist", ".expo", "build", "builds"]);
const JWT_SENTINEL = "eyJhb" + "GciOi";
const allowedSecretFiles = new Set([
  ".env.example",
  ".env.production.example",
  ".env.white-label.default.example",
  ".env.white-label.parceiro-premium.example",
]);
const codeExtensions = new Set([".ts", ".tsx", ".js", ".json"]);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) continue;
    const file = path.join(dir, entry);
    const stat = statSync(file);
    if (stat.isDirectory()) {
      walk(file, files);
      continue;
    }
    files.push(file);
  }
  return files;
}

function relative(file) {
  return path.relative(root, file);
}

function fail(message, matches) {
  console.error(message);
  for (const match of matches) console.error(`- ${match}`);
  process.exitCode = 1;
}

const files = walk(root);
const jwtMatches = [];
const wildcardCorsMatches = [];

for (const file of files) {
  const rel = relative(file);
  if (allowedSecretFiles.has(rel) || rel.startsWith(".env")) continue;

  const ext = path.extname(file);
  if (!codeExtensions.has(ext)) continue;

  const content = readFileSync(file, "utf8");
  if (content.includes(JWT_SENTINEL)) jwtMatches.push(rel);
  if (rel.startsWith("supabase/functions/") && content.includes('"Access-Control-Allow-Origin": "*"')) {
    wildcardCorsMatches.push(rel);
  }
}

if (jwtMatches.length) {
  fail("Hardcoded JWT-like Supabase key found outside allowed example files.", jwtMatches);
}

if (wildcardCorsMatches.length) {
  fail("Legacy wildcard CORS literal found. Use supabase/functions/_shared/cors.ts.", wildcardCorsMatches);
}

if (!process.exitCode) {
  console.log("Security smoke checks passed.");
}
