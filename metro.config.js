const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

const ignoredDirs = [
  "dist",
  "caches",
  "daemon",
  "wrapper",
  "wrapper/dists",
  ".expo",
  ".codex",
  ".agents",
  ".tmp",
  "reports",
  "builds",
  "android/.gradle",
  "android/build",
  "android/app/build",
  "android/.cxx",
  ".idea/caches"
];

config.resolver.blockList = ignoredDirs.map((dir) => {
  const absoluteDir = path.resolve(projectRoot, dir).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${absoluteDir}\\/.*$`);
});

module.exports = config;
