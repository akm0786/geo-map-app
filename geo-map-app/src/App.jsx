// ============================================================
// App.jsx — Root Application Component
// ------------------------------------------------------------
// This is the root component that orchestrates all frontend state:
//
// Key responsibilities in Phase 2:
//   1. Manages custom map layers state (`layers`)
//   2. Tracks the active target layer for new shapes (`activeLayerId`)
//   3. Tracks the selected drawing/editing tool (`activeTool`)
//   4. Controls the slide-out layer management drawer
//   5. Coordinates layer creation, visibility toggling, color updates, and deletion
//   6. Connects all UI controls to the OpenLayers `MapCanvas`
// ============================================================

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Material UI Theme & Layout ---
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Fab, Tooltip, Badge, Snackbar, Alert } from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';

// --- Application Components ---
import MapCanvas from './components/MapCanvas';
import DrawToolbar from './components/DrawToolbar';
import SyncStatusBadge from './components/SyncStatusBadge';
import LayerDrawer from './components/LayerDrawer';

// ============================================================
// Material UI Theme Definition
// ------------------------------------------------------------
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#ed6c02' },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
  },
});

// ============================================================
// Initial Default Layer
// ------------------------------------------------------------
const INITIAL_DEFAULT_LAYER_ID = 'layer-default-01';

const INITIAL_LAYERS = [
  {
    id: INITIAL_DEFAULT_LAYER_ID,
    name: 'Default Layer',
    color: '#1976d2', // Blue
    visible: true,
    featureCount: 0,
  },
  {
    id: 'layer-zones-02',
    name: 'Delivery Zones',
    color: '#2e7d32', // Green
    visible: true,
    featureCount: 0,
  },
];

// ============================================================
// App Component
// ============================================================
function App() {
  // --- State: Drawing Tool ---
  // Active tool: 'select' | 'point' | 'rectangle' | 'polygon' | 'direction' | 'delete'
  const [activeTool, setActiveTool] = useState('select');

  // --- State: Custom Layers ---
  const [layers, setLayers] = useState(INITIAL_LAYERS);
  const [activeLayerId, setActiveLayerId] = useState(INITIAL_DEFAULT_LAYER_ID);

  // --- State: UI Visibility ---
  const [layerDrawerOpen, setLayerDrawerOpen] = useState(false);

  // --- State: User Feedback Notifications ---
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Helper to trigger snackbar alerts
  const showNotification = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Find currently active target layer object
  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

  // ============================================================
  // Layer Management Handlers
  // ============================================================

  // 1. Create a new layer
  const handleCreateLayer = ({ name, color, visible }) => {
    const newLayer = {
      id: uuidv4(),
      name,
      color,
      visible,
      featureCount: 0,
    };

    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(newLayer.id); // Automatically switch active drawing target to the new layer
    showNotification(`Layer "${name}" created and set as active`, 'success');
  };

  // 2. Toggle layer visibility on/off
  const handleToggleLayerVisibility = (layerId) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id === layerId) {
          const newVisibility = !layer.visible;
          showNotification(
            `Layer "${layer.name}" is now ${newVisibility ? 'visible' : 'hidden'}`,
            'info'
          );
          return { ...layer, visible: newVisibility };
        }
        return layer;
      })
    );
  };

  // 3. Update layer color
  const handleUpdateLayerColor = (layerId, newColor) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id === layerId) {
          showNotification(`Updated color for "${layer.name}"`, 'success');
          return { ...layer, color: newColor };
        }
        return layer;
      })
    );
  };

  // 4. Delete a layer
  const handleDeleteLayer = (layerId) => {
    if (layers.length <= 1) {
      showNotification('Cannot delete the only remaining layer', 'warning');
      return;
    }

    const layerToDelete = layers.find((l) => l.id === layerId);
    setLayers((prev) => prev.filter((layer) => layer.id !== layerId));

    // If the active layer was deleted, switch to the first remaining layer
    if (activeLayerId === layerId) {
      const remaining = layers.filter((l) => l.id !== layerId);
      setActiveLayerId(remaining[0].id);
    }

    showNotification(`Deleted layer "${layerToDelete?.name || ''}"`, 'info');
  };

  // 5. Update feature counts from OpenLayers MapCanvas
  const handleFeaturesCountChange = (counts) => {
    setLayers((prev) =>
      prev.map((layer) => ({
        ...layer,
        featureCount: counts[layer.id] || 0,
      }))
    );
  };

  // Calculate total features across all layers
  const totalFeatureCount = layers.reduce((acc, l) => acc + (l.featureCount || 0), 0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Main Full-Screen Layout */}
      <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>

        {/* === MAP CANVAS (OpenLayers Map Engine) === */}
        <MapCanvas
          layers={layers}
          activeLayerId={activeLayerId}
          activeTool={activeTool}
          onFeaturesCountChange={handleFeaturesCountChange}
        />

        {/* === GEOMETRY DRAWING TOOLBAR (Top-Left) === */}
        <DrawToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          activeLayerColor={activeLayer?.color}
          activeLayerName={activeLayer?.name}
        />

        {/* === ONLINE / OFFLINE BADGE (Top-Right) === */}
        <SyncStatusBadge />

        {/* === FLOATING ACTION BUTTON: TOGGLE LAYERS DRAWER (Bottom-Right) === */}
        <Tooltip title="Manage Map Layers" placement="left">
          <Badge
            badgeContent={totalFeatureCount}
            color="primary"
            sx={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              zIndex: 1000,
            }}
          >
            <Fab
              color="primary"
              size="medium"
              onClick={() => setLayerDrawerOpen(!layerDrawerOpen)}
              aria-label="Toggle layers drawer"
            >
              <LayersIcon />
            </Fab>
          </Badge>
        </Tooltip>

        {/* === SLIDE-OUT LAYER MANAGEMENT DRAWER === */}
        <LayerDrawer
          open={layerDrawerOpen}
          onClose={() => setLayerDrawerOpen(false)}
          layers={layers}
          activeLayerId={activeLayerId}
          onSetActiveLayer={setActiveLayerId}
          onToggleLayerVisibility={handleToggleLayerVisibility}
          onCreateLayer={handleCreateLayer}
          onUpdateLayerColor={handleUpdateLayerColor}
          onDeleteLayer={handleDeleteLayer}
        />

        {/* === SNACKBAR TOAST NOTIFICATIONS === */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </ThemeProvider>
  );
}

export default App;
