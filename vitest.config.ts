import { defineConfig } from 'vitest/config';

// Configuration Vitest minimale pour la couche de données `src/common/fs`.
// Environnement `node` : le socle FS est indépendant du DOM (les accès
// localStorage sont gardés par `typeof window`).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    globals: false,
  },
});
