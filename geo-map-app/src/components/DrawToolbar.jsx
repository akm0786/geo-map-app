// ============================================================
// DrawToolbar.jsx — Geometry Drawing Tool Selector
// ------------------------------------------------------------
// This component displays a floating vertical toolbar on the map.
// Users click a tool to switch drawing and editing modes:
//
// Modes:
//   🖱️ Select / Move   — Drag entire shapes or adjust vertices
//   📍 Point           — Click anywhere to drop a marker pin
//   ⬜ Rectangle       — Click & drag to draw a box
//   🔷 Polygon         — Click to add vertices, double-click to finish
//   ➡️ Direction Route — Click to plot a path with directional arrows
//   🗑️ Delete Mode     — Click any shape on the map to delete it
// ============================================================

import React from 'react';
import { Paper, ToggleButtonGroup, ToggleButton, Tooltip, Box, Typography } from '@mui/material';

// --- Icons for each tool ---
import NearMeIcon from '@mui/icons-material/NearMe';
import PlaceIcon from '@mui/icons-material/Place';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import PentagonIcon from '@mui/icons-material/Pentagon';
import TimelineIcon from '@mui/icons-material/Timeline';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

// ============================================================
// DrawToolbar Component
// ------------------------------------------------------------
// Props:
//   activeTool (string) — Currently active tool ('select', 'point', etc.)
//   onToolChange (function) — Callback when user selects a different tool
//   activeLayerColor (string) — Hex color of the current target layer
//   activeLayerName (string) — Name of the current target layer
// ============================================================
const DrawToolbar = ({
  activeTool,
  onToolChange,
  activeLayerColor = '#1976d2',
  activeLayerName = 'Default Layer',
}) => {
  const handleToolChange = (_event, newTool) => {
    // If user clicks the active tool button again, default back to 'select'
    onToolChange(newTool || 'select');
  };

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 1000,
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 2,
        backdropFilter: 'blur(4px)',
      }}
    >
      <ToggleButtonGroup
        value={activeTool}
        exclusive
        onChange={handleToolChange}
        orientation="vertical"
        size="small"
        aria-label="Geospatial drawing tools"
      >
        {/* Tool: Select & Move */}
        <ToggleButton value="select" aria-label="Select and move">
          <Tooltip title="Select & Move (drag vertices or whole shape)" placement="right">
            <NearMeIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>

        {/* Tool: Point */}
        <ToggleButton value="point" aria-label="Draw point">
          <Tooltip title="Draw Point (click on map)" placement="right">
            <PlaceIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>

        {/* Tool: Rectangle */}
        <ToggleButton value="rectangle" aria-label="Draw rectangle">
          <Tooltip title="Draw Rectangle (click & drag box)" placement="right">
            <CropSquareIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>

        {/* Tool: Polygon */}
        <ToggleButton value="polygon" aria-label="Draw polygon">
          <Tooltip title="Draw Polygon (click vertices, double-click to finish)" placement="right">
            <PentagonIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>

        {/* Tool: Direction Line */}
        <ToggleButton value="direction" aria-label="Draw direction route">
          <Tooltip title="Draw Route with Direction Arrows (double-click to finish)" placement="right">
            <TimelineIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>

        {/* Tool: Delete */}
        <ToggleButton
          value="delete"
          aria-label="Delete shape"
          sx={{
            '&.Mui-selected': {
              backgroundColor: 'error.light',
              color: 'error.contrastText',
            },
          }}
        >
          <Tooltip title="Delete Mode (click any shape to delete)" placement="right">
            <DeleteForeverIcon fontSize="small" color={activeTool === 'delete' ? 'inherit' : 'error'} />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Target Layer Indicator Swatch */}
      <Tooltip title={`Drawing into: ${activeLayerName}`} placement="right">
        <Box
          sx={{
            mt: 0.5,
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: activeLayerColor,
            border: '2px solid #fff',
            boxShadow: '0 0 3px rgba(0,0,0,0.5)',
            cursor: 'default',
          }}
        />
      </Tooltip>
    </Paper>
  );
};

export default DrawToolbar;
