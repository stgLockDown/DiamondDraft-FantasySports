module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // expo-router's reanimated plugin was dropped in SDK 51; keep empty for future use
    ],
  };
};