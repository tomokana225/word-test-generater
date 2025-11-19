import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // FIX: Use relative paths for Electron `loadFile` compatibility.
  base: './',
});