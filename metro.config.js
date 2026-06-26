const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const exclusionList = require("metro-config/private/defaults/exclusionList").default;

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

const ignoredDirs = [
  "dist",
  "caches",
  "daemon",
  "wrapper",
  "wrapper/dists",
  "builds",
  "reports",
  ".expo",
  ".codex",
  ".agents",
  ".tmp",
  ".vercel",
  ".idea",
  ".sixth",
  "android/.gradle",
  "android/build",
  "android/app/build",
  "android/.cxx",
  "android/app/.cxx",
  "node_modules/.cache"
];

config.resolver.blockList = exclusionList(ignoredDirs.map((dir) => {
  const absoluteDir = path.resolve(projectRoot, dir).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${absoluteDir}\\/.*$`);
}));

module.exports = config;
