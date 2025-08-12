import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Vite configuration for SymptomAI frontend
export default defineConfig({
  // React plugin configuration
  plugins: [react()],
  
  // Path resolution configuration
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  
  // Development server configuration
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow external connections
    strictPort: true, // Exit if port is already in use
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
