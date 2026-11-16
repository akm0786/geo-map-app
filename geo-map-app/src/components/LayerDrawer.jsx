// ============================================================
// LayerDrawer.jsx — Layer Management Panel (Placeholder)
// ------------------------------------------------------------
// This is a slide-out side panel where users can:
//   - View all their custom map layers
//   - Toggle layer visibility on/off
//   - Change layer colors
//   - Create new layers
//   - Delete layers
//
// Currently this is a placeholder with a basic structure.
// Full functionality will be implemented in Phase 2C.
//
// What is a "layer"?
//   Think of layers like transparent sheets stacked on top of
//   each other. Each layer can contain different types of shapes.
//   For example:
//     - "Delivery Zones" layer → contains polygons
//     - "Warehouses" layer → contains point markers
//     - "Routes" layer → contains direction lines
//   Users can show/hide each layer independently.
// ============================================================

import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Box,
} from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';
import CloseIcon from '@mui/icons-material/Close';

// ============================================================
// LayerDrawer Component
// ------------------------------------------------------------
// Props:
//   open (boolean) — Whether the drawer panel is visible
//   onClose (function) — Callback to close the drawer
// ============================================================
const LayerDrawer = ({ open, onClose }) => {
  return (
    <Drawer
      // "right" means the panel slides in from the right side
      anchor="right"

      // Controlled visibility — parent decides when to show/hide
      open={open}

      // Called when user clicks outside the drawer or presses Escape
      onClose={onClose}

      // Keep the drawer in the DOM even when closed (for performance)
      // This prevents re-mounting the component every time it opens
      variant="persistent"

      sx={{
        // Set the width of the drawer panel
        '& .MuiDrawer-paper': {
          width: 280,
          padding: 2,
        },
      }}
    >
      {/* --- Header --- */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LayersIcon /> Layers
        </Typography>

        {/* Close button */}
        <IconButton onClick={onClose} size="small" aria-label="Close layers panel">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 1 }} />

      {/* --- Layer List (placeholder) ---
          In Phase 2C, this will be dynamically generated
          from the layers stored in IndexedDB */}
      <List dense>
        <ListItem>
          <ListItemText
            primary="Default Layer"
            secondary="All shapes drawn appear here"
          />
        </ListItem>
      </List>

      {/* Placeholder message for future functionality */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 2, textAlign: 'center', display: 'block' }}
      >
        Layer management coming in Phase 2
      </Typography>
    </Drawer>
  );
};

export default LayerDrawer;
