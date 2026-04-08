module.exports = {
  root: true,
  extends: ['@react-native'],
  rules: {
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'react/react-in-jsx-scope': 'off',
    'react-native/no-inline-styles': 'off',
  },
  ignorePatterns: ['node_modules/', '__tests__/', 'jest.setup.ts', 'jest.config.js', 'babel.config.js'],
};
