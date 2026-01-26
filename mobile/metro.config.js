// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../');
const sharedRoot = path.resolve(workspaceRoot, 'shared');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo, including shared package
config.watchFolders = [workspaceRoot, sharedRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Ensure TypeScript files from shared workspace are transpiled
// (ts and tsx are already included by default, but being explicit)
if (!config.resolver.sourceExts.includes('ts')) {
  config.resolver.sourceExts.push('ts', 'tsx');
}

// 4. Add support for .mjs files (required by some packages like i18n-js)
if (!config.resolver.sourceExts.includes('mjs')) {
  config.resolver.sourceExts.push('mjs');
}

// 5. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
