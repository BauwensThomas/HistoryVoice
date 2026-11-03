const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blockList: [/android\/app\/\.cxx\/.*/, /android\/app\/build\/.*/, /android\/\.gradle\/.*/],
    // react-native-device-info n'est pas lié à l'app (dépendance indirecte de la librairie de
    // mise à jour Google Play) : on le remplace par un module JS minimal.
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'react-native-device-info') {
        return {
          type: 'sourceFile',
          filePath: path.resolve(__dirname, 'src/stubs/deviceInfoStub.js'),
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
