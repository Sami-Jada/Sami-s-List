// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../');
const sharedRoot = path.resolve(workspaceRoot, 'shared');

const config = getDefaultConfig(projectRoot);

const { transformer, resolver } = config;

// 1. SVG transformer (must come before other overrides)
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};

// 2. Resolver: treat SVG as source, not asset
config.resolver.assetExts = resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...resolver.sourceExts, 'svg'];

// 3. Watch all files in the monorepo, including shared package
config.watchFolders = [workspaceRoot, sharedRoot];

// 4. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 5. Ensure TypeScript files from shared workspace are transpiled
// (ts and tsx are already included by default, but being explicit)
if (!config.resolver.sourceExts.includes('ts')) {
  config.resolver.sourceExts.push('ts', 'tsx');
}

// 6. Add support for .mjs files (required by some packages like i18n-js)
if (!config.resolver.sourceExts.includes('mjs')) {
  config.resolver.sourceExts.push('mjs');
}

// 7. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
