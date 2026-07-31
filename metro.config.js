// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Web support
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

// En producción: activar transformer con ofuscación JavaScript
if (process.env.NODE_ENV === 'production') {
  config.transformer = {
    ...config.transformer,
    babelTransformerPath: path.resolve(__dirname, 'obfuscator-transformer.js'),
  };
}

module.exports = config;
