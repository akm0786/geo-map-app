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
// Capabilities:
//   1. List all active layers with assigned colors and shape counts
//   2. Set the "Active Drawing Layer" (click anywhere on the row)
//   3. Toggle layer visibility on/off (`layer.visible`)
//   4. Rename existing layers
//   5. Create new layers with custom names and colors
//   6. Change existing layer colors via a quick swatch palette
//   7. Delete custom layers
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
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
} from '@mui/material';

// --- Icons ---
import LayersIcon from '@mui/icons-material/Layers';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';

// ============================================================
// Preset Color Palette for Layers
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
  onRenameLayer,
  onDeleteLayer,
}) => {
  // --- Local Dialog States ---
  // Create Layer popup modal
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLayerName, setNewLayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_LAYER_COLORS[0]);

  // Rename Layer popup modal
  const [renameLayerId, setRenameLayerId] = useState(null);
  const [renamedName, setRenamedName] = useState('');

  // Change Color modal
  const [colorPickerLayerId, setColorPickerLayerId] = useState(null);

  // Handler: Open create layer dialog
  const handleOpenCreateDialog = () => {
    setNewLayerName(`Layer ${layers.length + 1}`);
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

  // Handler: Open rename dialog
  const handleOpenRenameDialog = (layer, e) => {
    e.stopPropagation(); // Don't trigger layer selection
    setRenameLayerId(layer.id);
    setRenamedName(layer.name);
  };

  // Handler: Confirm rename
  const handleConfirmRename = () => {
    if (renameLayerId && renamedName.trim() && onRenameLayer) {
      onRenameLayer(renameLayerId, renamedName.trim());
    }
    setRenameLayerId(null);
    setRenamedName('');
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
            width: 330,
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
          Click row to set active drawing layer. Toggle switch to show/hide.
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* --- Add Layer Button --- */}
        <Button
          variant="contained"
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
                onClick={() => onSetActiveLayer(layer.id)}
                sx={{
                  border: '1.5px solid',
                  borderColor: isActive ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  mb: 1.5,
                  backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'background.paper',
                  cursor: 'pointer',
                  pr: 12, // Space for action icons
                  transition: 'all 0.15s ease-in-out',
                  '&:hover': {
                    borderColor: 'primary.light',
                    backgroundColor: isActive
                      ? 'rgba(25, 118, 210, 0.12)'
                      : 'rgba(0, 0, 0, 0.03)',
                  },
                }}
              >
                {/* Radio button to select this layer as active target */}
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Radio
                    checked={isActive}
                    value={layer.id}
                    size="small"
                    color="primary"
                    sx={{ p: 0.5 }}
                  />
                </ListItemIcon>

                {/* Layer Color Swatch & Name */}
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Clickable Color Swatch */}
                      <Tooltip title="Click to change color">
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            setColorPickerLayerId(layer.id);
                          }}
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: layer.color,
                            cursor: 'pointer',
                            border: '2px solid #fff',
                            boxShadow: '0 0 2px rgba(0,0,0,0.5)',
                            flexShrink: 0,
                            '&:hover': { transform: 'scale(1.2)' },
                            transition: 'transform 0.15s',
                          }}
                        />
                      </Tooltip>

                      <Typography
                        variant="subtitle2"
                        noWrap
                        sx={{
                          fontWeight: isActive ? 700 : 500,
                          color: layer.visible ? 'text.primary' : 'text.disabled',
                        }}
                      >
                        {layer.name}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {layer.featureCount || 0} shape{(layer.featureCount || 0) === 1 ? '' : 's'}
                      {isActive ? ' • (Active)' : ''}
                    </Typography>
                  }
                />

                {/* Secondary Actions: Edit Name, Toggle Visibility, Delete */}
                <ListItemSecondaryAction>
                  {/* Rename Layer Button */}
                  <Tooltip title="Rename layer">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleOpenRenameDialog(layer, e)}
                      sx={{ p: 0.5 }}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>

                  {/* Visibility Toggle Button */}
                  <Tooltip title={layer.visible ? 'Hide layer' : 'Show layer'}>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLayerVisibility(layer.id);
                      }}
                      color={layer.visible ? 'primary' : 'default'}
                      sx={{ p: 0.5, ml: 0.25 }}
                    >
                      {layer.visible ? (
                        <VisibilityIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <VisibilityOffIcon sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>
                  </Tooltip>

                  {/* Delete Layer Button */}
                  <Tooltip
                    title={
                      layers.length > 1 ? 'Delete layer' : 'Cannot delete the only remaining layer'
                    }
                  >
                    <span>
                      <IconButton
                        edge="end"
                        size="small"
                        disabled={layers.length <= 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLayer(layer.id);
                        }}
                        color="error"
                        sx={{ p: 0.5, ml: 0.25 }}
                      >
                        <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
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
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreateLayer();
              }}
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
          <Button
            onClick={handleConfirmCreateLayer}
            variant="contained"
            disabled={!newLayerName.trim()}
          >
            Create Layer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================
          Modal: Rename Layer Dialog
          ============================================================ */}
      <Dialog open={Boolean(renameLayerId)} onClose={() => setRenameLayerId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Rename Layer</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Layer Name"
            value={renamedName}
            onChange={(e) => setRenamedName(e.target.value)}
            fullWidth
            size="small"
            autoFocus
            sx={{ mt: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmRename();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameLayerId(null)}>Cancel</Button>
          <Button onClick={handleConfirmRename} variant="contained" disabled={!renamedName.trim()}>
            Save
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
