
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Assicura che process.env.API_KEY sia disponibile come stringa nel codice client.
    // Se la variabile non è impostata su Vercel, diventerà una stringa vuota invece di 'undefined'.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
