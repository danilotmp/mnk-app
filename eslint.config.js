// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // Regla 1: Prohibir importar StyleSheet en archivos .tsx (excepto archivos *.styles.ts o *.styles.tsx)
      'no-restricted-imports': [
        'error',
        {
          name: 'react-native',
          importNames: ['StyleSheet'],
          message:
            'No importes StyleSheet en archivos de componentes. Mueve los estilos a un archivo *.styles.tsx y expórtalos desde allí.',
        },
      ],

      // Regla 2: Prohibir llamar StyleSheet.create dentro de archivos .tsx (se sugiere usar archivo de estilos)
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.object.name="StyleSheet"][callee.property.name="create"]',
          message:
            'No declares StyleSheet.create en archivos de componentes. Usa un archivo de estilos dedicado (*.styles.tsx).',
        },
      ],

      // Regla 3: Prohibir cualquier uso de console en la app (logs innecesarios)
      'no-console': [
        'error',
        { allow: [] },
      ],
    },
    // Permitir StyleSheet solo en archivos de estilos y permitir console en scripts utilitarios
    overrides: [
      {
        files: ['**/*.styles.ts', '**/*.styles.tsx'],
        rules: {
          'no-restricted-imports': 'off',
          'no-restricted-syntax': 'off',
        },
      },
      {
        files: ['scripts/**/*.{js,ts}'],
        rules: {
          'no-console': 'off',
        },
      },
    ],
  },
]);
