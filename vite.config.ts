import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths()
  ],
  build: {
    rollupOptions: {
      output: {
        // Chaque application du registre (`src/apps/registry.ts`) est chargée à
        // la demande depuis son `main.tsx`. On nomme son fichier d'après son
        // dossier (`app-explorer-[hash].js`) plutôt que `main-[hash].js`.
        chunkFileNames: (chunk) => {
          const appFolder = chunk.facadeModuleId?.match(/\/src\/apps\/([^/]+)\/main\.tsx$/)?.[1];
          return appFolder
            ? `assets/app-${appFolder.toLowerCase()}-[hash].js`
            : 'assets/[name]-[hash].js';
        },
      },
    },
  },
});
