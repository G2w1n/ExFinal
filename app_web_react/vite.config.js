import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Las librerías grandes van en archivos aparte: el navegador las guarda en caché
// y, al publicar una versión nueva, solo descarga lo que cambió.
const GRUPOS = [
  ['react', /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//],
  ['animaciones', /node_modules\/(framer-motion|motion-dom|motion-utils)\//],
  ['datos', /node_modules\/(@tanstack|axios|socket\.io-client|engine\.io-client|socket\.io-parser|i18next|react-i18next)\//],
];

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: GRUPOS.map(([nombre, prueba]) => ({ name: (id) => (prueba.test(id) ? nombre : null) })),
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/pruebas/preparar.js',
    css: false,
  },
});
