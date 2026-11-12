import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Configuration Vitest pour les couches sans interface : le système de
// fichiers (`src/common/fs`), le registre des applications (`src/apps`) et les
// stores. Environnement `node` : ces modules sont indépendants du DOM (les
// accès localStorage sont gardés par `typeof window`).
// `tsconfigPaths` résout l'alias `@/` comme le fait le build.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    globals: false,
  },
});
