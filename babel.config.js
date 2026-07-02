module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-worklets/plugin powers react-native-reanimated 4 (used by
    // @react-navigation/drawer). It MUST be the last plugin in the list. This
    // is a build-time transform only — safe for Expo Go, no native config.
    plugins: ['react-native-worklets/plugin'],
  };
};
