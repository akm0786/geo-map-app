// ============================================================
// App.jsx — Root Application Component
// ------------------------------------------------------------
// This is the main component that assembles the entire app.
// Think of it as the "frame" that holds all the pieces:
//
//   +--------------------------------------------------+
//   |  [Toolbar]                    [Online/Offline]    |
//   |                                                   |
//   |                                                   |
//   |              MAP CANVAS                           |
//   |         (full screen map)                         |
//   |                                                   |
//   |                                                   |
//   |                            [Layers Panel →]       |
//   +--------------------------------------------------+
//
// Components used:
//   - MapCanvas: The OpenLayers map (fills the entire screen)
//   - DrawToolbar: Floating tool buttons (top-left)
//   - SyncStatusBadge: Online/Offline indicator (top-right)
//   - LayerDrawer: Slide-out layer panel (right side)
//
// State managed here:
//   - activeTool: Which drawing tool is currently selected
//   - layerDrawerOpen: Whether the layer panel is visible
// ============================================================

import React, { useState } from 'react';

// --- Material UI Theme Provider ---
// ThemeProvider + createTheme lets us customize the look and feel
// of all Material UI components (colors, fonts, spacing, etc.)
import { ThemeProvider, createTheme } from '@mui/material/styles';
// CssBaseline normalizes CSS across browsers (like a CSS reset)
import CssBaseline from '@mui/material/CssBaseline';
// Fab = Floating Action Button (the round "Layers" button)
import { Fab, Tooltip } from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';

// --- Our Custom Components ---
import MapCanvas from './components/MapCanvas';
import DrawToolbar from './components/DrawToolbar';
import SyncStatusBadge from './components/SyncStatusBadge';
import LayerDrawer from './components/LayerDrawer';

// ============================================================
// Material UI Theme Configuration
// ------------------------------------------------------------
// We create a custom theme with a blue primary color and
// dark mode disabled (light mode). You can change these
// values to customize the entire app's appearance at once.
// ============================================================
const theme = createTheme({
  palette: {
    mode: 'light',                // Use light theme (change to 'dark' for dark mode)
    primary: { main: '#1976d2' }, // Blue — used for active buttons, highlights
    secondary: { main: '#ff9800' }, // Orange — used for accents
  },
});

// ============================================================
// App Component
// ============================================================
function App() {
  // --- State ---

  // activeTool: Tracks which drawing tool the user has selected.
  // Values: 'select', 'point', 'rectangle', 'polygon', 'direction', 'delete'
  // Default is 'select' (the cursor/move tool).
  const [activeTool, setActiveTool] = useState('select');

  // layerDrawerOpen: Controls visibility of the layer management panel.
  // true = panel is visible (slides in from right), false = hidden.
  const [layerDrawerOpen, setLayerDrawerOpen] = useState(false);

  return (
    // ThemeProvider wraps the entire app so all MUI components
    // use our custom theme colors and settings
    <ThemeProvider theme={theme}>
      {/* CssBaseline normalizes browser defaults (margins, fonts, etc.) */}
      <CssBaseline />

      {/* --- Main Layout Container ---
          position: relative so child components can use
          position: absolute to float over the map */}
      <div style={{ width: '100%', height: '100vh', position: 'relative' }}>

        {/* === MAP (fills entire screen) === */}
        <MapCanvas />

        {/* === DRAWING TOOLBAR (top-left, floating) ===
            Passes the current tool and a callback to change it */}
        <DrawToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
        />

        {/* === ONLINE/OFFLINE BADGE (top-right, floating) === */}
        <SyncStatusBadge />

        {/* === LAYERS BUTTON (bottom-right, floating) ===
            A round floating button that opens the layer panel */}
        <Tooltip title="Toggle Layers Panel" placement="left">
          <Fab
            color="primary"
            size="medium"
            onClick={() => setLayerDrawerOpen(!layerDrawerOpen)}
            sx={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              zIndex: 1000,
            }}
            aria-label="Toggle layers panel"
          >
            <LayersIcon />
          </Fab>
        </Tooltip>

        {/* === LAYER MANAGEMENT PANEL (slides from right) === */}
        <LayerDrawer
          open={layerDrawerOpen}
          onClose={() => setLayerDrawerOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
