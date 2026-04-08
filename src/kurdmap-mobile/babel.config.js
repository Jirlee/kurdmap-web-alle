module.exports = function (api) {
  api.cache(true);

  const plugins = [
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          '@': './src',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ];

  // Strip console.log in production builds
  if (process.env.NODE_ENV === 'production') {
    plugins.unshift(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
