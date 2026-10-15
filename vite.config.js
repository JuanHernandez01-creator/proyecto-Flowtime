import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas: necesario para Capacitor (file://) y válido en hosting estático
  base: './',
  build: { outDir: 'dist', target: 'es2020' },
  server: { host: true }
});
