// ============================================================
// FeaturePropertiesDialog.jsx — Feature Inspector & Editor Dialog
// ------------------------------------------------------------
// When the user clicks on an existing shape in "Select" mode,
// this dialog opens to show its properties and allow editing:
//
// Capabilities:
//   1. Edit shape display name (e.g., "Warehouse Alpha", "Zone 3")
//   2. Toggle Highlighting (`isHighlighted`): activates the golden
//      glowing outline on the map
//   3. View shape coordinates / type summary
//   4. Delete the selected shape directly
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import LayersIcon from '@mui/icons-material/Layers';

// ============================================================
// FeaturePropertiesDialog Component
// ------------------------------------------------------------
// Props:
//   open (boolean) — Whether dialog is visible
//   feature (ol/Feature) — The selected OpenLayers feature
//   layerName (string) — Name of the layer this feature belongs to
//   onClose (function) — Callback when closing dialog
//   onSave (function) — Callback when user saves updated properties
//   onDelete (function) — Callback when user deletes the feature
// ============================================================
const FeaturePropertiesDialog = ({
  open,
  feature,
  layerName,
  onClose,
  onSave,
  onDelete,
}) => {
  // Local form state for editing
  const [name, setName] = useState('');
  const [isHighlighted, setIsHighlighted] = useState(false);

  // When a feature is selected, populate the form fields from its properties
  useEffect(() => {
    if (feature) {
      setName(feature.get('name') || 'Unnamed Shape');
      setIsHighlighted(feature.get('isHighlighted') === true);
    }
  }, [feature]);

  if (!feature) return null;

  const shapeType = feature.get('shapeType') || feature.getGeometry()?.getType() || 'Feature';
  const featureId = feature.get('id') || 'N/A';

  // Handler to submit edits
  const handleSave = () => {
    onSave({
      name: name.trim() || 'Unnamed Shape',
      isHighlighted,
    });
    onClose();
  };

  // Handler to delete
  const handleDelete = () => {
    onDelete(feature);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
          Shape Properties
        </Typography>
        {/* Badge indicating shape type (Point, Polygon, etc.) */}
        <Chip label={shapeType} color="primary" size="small" variant="outlined" />
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {/* Layer and ID metadata */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LayersIcon fontSize="small" /> Layer: <strong>{layerName || 'Default'}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {String(featureId).substring(0, 8)}...
            </Typography>
          </Box>

          <Divider />

          {/* Editable Feature Name */}
          <TextField
            label="Shape Label / Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            placeholder="e.g. Storage Depot, Route A"
            helperText="Custom name to identify this shape"
          />

          {/* Highlight Toggle Switch */}
          {/* Toggling this turns on the gold glowing outline on the map */}
          <FormControlLabel
            control={
              <Switch
                checked={isHighlighted}
                onChange={(e) => setIsHighlighted(e.target.checked)}
                color="warning"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <StarIcon sx={{ color: isHighlighted ? '#ffb300' : 'action.disabled' }} fontSize="small" />
                <Typography variant="body2">
                  <strong>Highlight on Map</strong> (Golden Glow)
                </Typography>
              </Box>
            }
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
        {/* Delete button on the left */}
        <Button
          onClick={handleDelete}
          color="error"
          startIcon={<DeleteIcon />}
          size="small"
        >
          Delete
        </Button>

        {/* Cancel and Save buttons on the right */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} color="inherit" size="small">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary" size="small">
            Save
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default FeaturePropertiesDialog;
