import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ============================================================
// Vite Configuration
// ------------------------------------------------------------
// Vite is the build tool that bundles our React app.
// This config tells Vite to use the React plugin for JSX support.
// The server section configures the local dev server settings.
// ============================================================

export default defineConfig({
  // Enable React plugin — this allows us to write JSX and
  // use React fast-refresh (hot module replacement) during development
  plugins: [react()],

  server: {
    // Port where the dev server will run (http://localhost:5173)
    port: 5173,

    // Automatically open the browser when dev server starts
    open: true,
  },
});
