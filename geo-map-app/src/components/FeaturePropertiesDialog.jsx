// ============================================================
// FeaturePropertiesDialog.jsx — Feature Inspector & Editor Dialog
// ------------------------------------------------------------
// When the user clicks on an existing shape in "Select" mode,
// this dialog opens to show its properties and allow editing:
//
// Capabilities:
//   1. Edit shape display name (e.g., "Warehouse Alpha", "Zone 3")
//   2. Reassign shape to a different layer (e.g., move to "Delivery Zones")
//   3. Toggle Highlighting (`isHighlighted`): activates the golden
//      glowing outline on the map
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import LayersIcon from '@mui/icons-material/Layers';

// ============================================================
// FeaturePropertiesDialog Component
// ============================================================
const FeaturePropertiesDialog = ({
  open,
  feature,
  layers = [],
  onClose,
  onSave,
  onDelete,
}) => {
  // Local form state for editing
  const [name, setName] = useState('');
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [selectedLayerId, setSelectedLayerId] = useState('');

  // When a feature is selected, populate the form fields from its properties
  useEffect(() => {
    if (feature) {
      setName(feature.get('name') || 'Unnamed Shape');
      setIsHighlighted(feature.get('isHighlighted') === true);
      setSelectedLayerId(feature.get('layerId') || (layers[0] ? layers[0].id : ''));
    }
  }, [feature, layers]);

  if (!feature) return null;

  const shapeType = feature.get('shapeType') || feature.getGeometry()?.getType() || 'Feature';
  const featureId = feature.get('id') || 'N/A';

  // Handler to submit edits
  const handleSave = () => {
    onSave({
      name: name.trim() || 'Unnamed Shape',
      isHighlighted,
      layerId: selectedLayerId,
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
          {/* Metadata */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              ID: {String(featureId).substring(0, 8)}...
            </Typography>
          </Box>

          {/* Editable Feature Name */}
          <TextField
            label="Shape Label / Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            placeholder="e.g. Storage Depot, Route A"
            helperText="Custom label for this shape"
          />

          {/* Reassign to Layer Dropdown */}
          <FormControl fullWidth size="small">
            <InputLabel id="feature-layer-select-label">Assign to Layer</InputLabel>
            <Select
              labelId="feature-layer-select-label"
              value={selectedLayerId}
              label="Assign to Layer"
              onChange={(e) => setSelectedLayerId(e.target.value)}
            >
              {layers.map((layer) => (
                <MenuItem key={layer.id} value={layer.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: layer.color,
                        boxShadow: '0 0 2px rgba(0,0,0,0.4)',
                      }}
                    />
                    <Typography variant="body2">{layer.name}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />

          {/* Highlight Toggle Switch */}
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
