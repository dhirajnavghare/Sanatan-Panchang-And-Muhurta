module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|standard-navigation|@sentry/react-native|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    '\\.(wav|mp3|ogg|aac)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'constants/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.web.ts',
    '!**/types.ts',
    '!src/types/**',
    '!app/+html.tsx',
    '!src/core/festivals/index.ts',
    '!src/core/muhurta-finder/index.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      lines: 80,
      functions: 68,
      branches: 60,
    },
    './src/core/panchang/': {
      statements: 90,
      lines: 90,
    },
    './src/core/festivals/': {
      statements: 90,
      lines: 90,
    },
    './src/core/muhurta-finder/': {
      statements: 90,
      lines: 90,
    },
    './src/services/appTour.ts': {
      statements: 90,
      lines: 90,
    },
    './src/services/dinacharya.ts': {
      statements: 90,
      lines: 90,
    },
    './src/services/sadhana.ts': {
      statements: 90,
      lines: 90,
    },
    './src/services/vratParana.ts': {
      statements: 90,
      lines: 90,
    },
    './src/services/userProfile.ts': {
      statements: 90,
      lines: 90,
    },
    './src/services/projectApi.ts': {
      statements: 90,
      lines: 90,
    },
    './src/services/vratGuidelines.ts': {
      statements: 90,
      lines: 90,
    },
  },
};
