// ============================================================
// LayerDrawer.jsx — Layer Management Drawer Panel
// ------------------------------------------------------------
// This component provides the user interface for managing custom map layers.
//
// What is a Layer?
//   A layer is a grouping of map shapes. For example, a user could have:
//     - "Warehouses" layer (Blue points)
//     - "Delivery Zones" layer (Green polygons)
//     - "Hazard Areas" layer (Red rectangles)
//
// Key features implemented here:
//   1. List all active layers with their assigned colors and shape counts
//   2. Set the "Active Drawing Layer" (where new shapes will be placed)
//   3. Toggle layer visibility on/off (`layer.visible`)
//   4. Create new layers with custom names and colors
//   5. Change existing layer colors via a quick swatch palette
//   6. Delete custom layers
// ============================================================

import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Typography,
  Divider,
  IconButton,
  Box,
  Button,
  Switch,
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Chip,
} from '@mui/material';

// --- Icons ---
import LayersIcon from '@mui/icons-material/Layers';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PaletteIcon from '@mui/icons-material/Palette';

// ============================================================
// Preset Color Palette for Layers
// ------------------------------------------------------------
// Curated list of vibrant, distinct colors that show up clearly
// on both standard street maps and satellite views.
// ============================================================
export const PRESET_LAYER_COLORS = [
  '#1976d2', // Blue (Primary)
  '#2e7d32', // Green
  '#ed6c02', // Amber / Orange
  '#9c27b0', // Purple
  '#d32f2f', // Red
  '#00897b', // Teal
  '#5c6bc0', // Indigo
  '#e91e63', // Pink
];

// ============================================================
// LayerDrawer Component
// ============================================================
const LayerDrawer = ({
  open,
  onClose,
  layers,
  activeLayerId,
  onSetActiveLayer,
  onToggleLayerVisibility,
  onCreateLayer,
  onUpdateLayerColor,
  onDeleteLayer,
}) => {
  // --- Local Dialog States ---
  // Controls the "Create Layer" popup modal
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLayerName, setNewLayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_LAYER_COLORS[0]);

  // Controls the "Change Color" popover modal
  const [colorPickerLayerId, setColorPickerLayerId] = useState(null);

  // Handler: Open create layer dialog
  const handleOpenCreateDialog = () => {
    // Generate a default suggested name like "Layer 2", "Layer 3"
    setNewLayerName(`Layer ${layers.length + 1}`);
    // Pick next available color from palette
    const nextColor = PRESET_LAYER_COLORS[layers.length % PRESET_LAYER_COLORS.length];
    setSelectedColor(nextColor);
    setCreateDialogOpen(true);
  };

  // Handler: Confirm create layer
  const handleConfirmCreateLayer = () => {
    if (!newLayerName.trim()) return;

    onCreateLayer({
      name: newLayerName.trim(),
      color: selectedColor,
      visible: true,
    });

    setCreateDialogOpen(false);
    setNewLayerName('');
  };

  return (
    <>
      {/* ============================================================
          Main Slide-Out Drawer Panel
          ============================================================ */}
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        variant="persistent"
        sx={{
          '& .MuiDrawer-paper': {
            width: 320,
            padding: 2,
            boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
          },
        }}
      >
        {/* --- Header --- */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LayersIcon color="primary" /> Map Layers
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="Close layers panel">
            <CloseIcon />
          </IconButton>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Radio button selects target layer for new drawings. Toggle switch hides/shows layer.
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* --- Add Layer Button --- */}
        <Button
          variant="outlined"
          color="primary"
          startIcon={<AddCircleIcon />}
          fullWidth
          onClick={handleOpenCreateDialog}
          sx={{ mb: 2 }}
        >
          Add New Layer
        </Button>

        {/* --- Layers List --- */}
        <List dense sx={{ overflowY: 'auto', flexGrow: 1 }}>
          {layers.map((layer) => {
            const isActive = layer.id === activeLayerId;

            return (
              <ListItem
                key={layer.id}
                sx={{
                  border: '1px solid',
                  borderColor: isActive ? 'primary.main' : 'divider',
                  borderRadius: 1.5,
                  mb: 1.5,
                  backgroundColor: isActive ? 'action.selected' : 'background.paper',
                  transition: 'border-color 0.2s',
                  pr: 10, // Padding for secondary actions
                }}
              >
                {/* Radio button to select this layer as active target for drawing */}
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Tooltip title={isActive ? 'Active drawing target' : 'Click to make active target for drawing'}>
                    <Radio
                      checked={isActive}
                      onChange={() => onSetActiveLayer(layer.id)}
                      value={layer.id}
                      size="small"
                      color="primary"
                    />
                  </Tooltip>
                </ListItemIcon>

                {/* Layer Color Swatch & Name */}
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Interactive Color Circle Swatch */}
                      <Tooltip title="Click to change layer color">
                        <Box
                          onClick={() => setColorPickerLayerId(layer.id)}
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            backgroundColor: layer.color,
                            cursor: 'pointer',
                            border: '2px solid #fff',
                            boxShadow: '0 0 2px rgba(0,0,0,0.5)',
                            flexShrink: 0,
                          }}
                        />
                      </Tooltip>

                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: isActive ? 700 : 500 }}>
                        {layer.name}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {layer.featureCount || 0} shape{(layer.featureCount || 0) === 1 ? '' : 's'}
                    </Typography>
                  }
                />

                {/* Secondary Actions: Visibility Switch & Delete */}
                <ListItemSecondaryAction>
                  {/* Visibility Toggle Switch */}
                  <Tooltip title={layer.visible ? 'Hide layer' : 'Show layer'}>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => onToggleLayerVisibility(layer.id)}
                      color={layer.visible ? 'primary' : 'default'}
                    >
                      {layer.visible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>

                  {/* Delete Layer Button (disabled if only 1 layer remaining) */}
                  <Tooltip title={layers.length > 1 ? 'Delete layer' : 'Cannot delete the only layer'}>
                    <span>
                      <IconButton
                        edge="end"
                        size="small"
                        disabled={layers.length <= 1}
                        onClick={() => onDeleteLayer(layer.id)}
                        color="error"
                        sx={{ ml: 0.5 }}
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      {/* ============================================================
          Modal: Create New Layer Dialog
          ============================================================ */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create New Layer</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {/* Layer Name Input */}
            <TextField
              label="Layer Name"
              value={newLayerName}
              onChange={(e) => setNewLayerName(e.target.value)}
              fullWidth
              size="small"
              placeholder="e.g. Delivery Zones, Vehicles"
              autoFocus
            />

            {/* Color Swatch Picker */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Choose Layer Color:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {PRESET_LAYER_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: color,
                      cursor: 'pointer',
                      border: selectedColor === color ? '3px solid #000' : '2px solid #fff',
                      boxShadow: '0 0 3px rgba(0,0,0,0.4)',
                      transform: selectedColor === color ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.15s',
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmCreateLayer} variant="contained" disabled={!newLayerName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================
          Modal: Quick Color Picker Dialog
          ============================================================ */}
      <Dialog open={Boolean(colorPickerLayerId)} onClose={() => setColorPickerLayerId(null)} maxWidth="xs">
        <DialogTitle>Pick Layer Color</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', p: 1 }}>
            {PRESET_LAYER_COLORS.map((color) => (
              <Box
                key={color}
                onClick={() => {
                  onUpdateLayerColor(colorPickerLayerId, color);
                  setColorPickerLayerId(null);
                }}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: color,
                  cursor: 'pointer',
                  border: '2px solid #fff',
                  boxShadow: '0 0 4px rgba(0,0,0,0.4)',
                  '&:hover': { transform: 'scale(1.15)' },
                  transition: 'transform 0.15s',
                }}
              />
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LayerDrawer;
