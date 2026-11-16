// ============================================================
// DrawToolbar.jsx — Geometry Drawing Tool Selector
// ------------------------------------------------------------
// This component shows a floating toolbar on the map that lets
// users pick which type of shape they want to draw.
//
// Available tools:
//   🖱️ Select/Move — Click to select and drag shapes
//   📍 Point      — Place a single marker/pin on the map
//   ⬜ Rectangle  — Draw a rectangular area
//   🔷 Polygon    — Draw a custom multi-sided shape
//   ➡️  Direction  — Draw a line/route with direction arrows
//   🗑️ Delete     — Click a shape to remove it
//
// Currently this is a UI-only placeholder. The actual OpenLayers
// interactions (Draw, Modify, Translate) will be wired in Phase 2.
// ============================================================

import React from 'react';

// --- Material UI Imports ---
// Paper: A card-like container with elevation (shadow)
import { Paper, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';

// --- Material UI Icons ---
// Each icon visually represents a drawing tool
import NearMeIcon from '@mui/icons-material/NearMe';           // Select/Move cursor
import PlaceIcon from '@mui/icons-material/Place';              // Point/marker
import CropSquareIcon from '@mui/icons-material/CropSquare';    // Rectangle
import PentagonIcon from '@mui/icons-material/Pentagon';         // Polygon
import TimelineIcon from '@mui/icons-material/Timeline';         // Line/Direction
import DeleteIcon from '@mui/icons-material/Delete';             // Delete tool

// ============================================================
// DrawToolbar Component
// ------------------------------------------------------------
// Props:
//   activeTool (string) — Currently selected tool name
//   onToolChange (function) — Callback when user clicks a tool
//
// The parent component (App.jsx) owns the state and passes it
// down. This pattern is called "lifting state up" in React.
// ============================================================
const DrawToolbar = ({ activeTool, onToolChange }) => {

  // Handler for when a toggle button is clicked.
  // MUI ToggleButtonGroup passes (event, newValue) where
  // newValue is the `value` prop of the clicked button.
  // If newValue is null (user clicked the already-active button),
  // we default back to 'select' mode.
  const handleToolChange = (_event, newTool) => {
    onToolChange(newTool || 'select');
  };

  return (
    // --- Toolbar Container ---
    // Positioned in the top-left corner of the map, floating above it.
    // z-index: 1000 ensures it stays above the OpenLayers canvas.
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 1000,
        padding: '4px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly transparent
      }}
    >
      {/* --- Toggle Button Group ---
          - exclusive: Only one tool can be active at a time
          - orientation="vertical": Buttons stack vertically
          - value: The currently active tool (controlled by parent) */}
      <ToggleButtonGroup
        value={activeTool}
        exclusive
        onChange={handleToolChange}
        orientation="vertical"
        size="small"
        aria-label="Drawing tools"
      >
        {/* Select/Move Tool — for selecting and dragging existing shapes */}
        <ToggleButton value="select" aria-label="Select and move">
          <Tooltip title="Select / Move" placement="right">
            <NearMeIcon />
          </Tooltip>
        </ToggleButton>

        {/* Point Tool — places a single marker on the map */}
        <ToggleButton value="point" aria-label="Draw point">
          <Tooltip title="Draw Point" placement="right">
            <PlaceIcon />
          </Tooltip>
        </ToggleButton>

        {/* Rectangle Tool — draws a rectangular area */}
        <ToggleButton value="rectangle" aria-label="Draw rectangle">
          <Tooltip title="Draw Rectangle" placement="right">
            <CropSquareIcon />
          </Tooltip>
        </ToggleButton>

        {/* Polygon Tool — draws a custom multi-sided shape */}
        <ToggleButton value="polygon" aria-label="Draw polygon">
          <Tooltip title="Draw Polygon" placement="right">
            <PentagonIcon />
          </Tooltip>
        </ToggleButton>

        {/* Direction/Line Tool — draws a line with arrows */}
        <ToggleButton value="direction" aria-label="Draw direction line">
          <Tooltip title="Draw Direction / Route" placement="right">
            <TimelineIcon />
          </Tooltip>
        </ToggleButton>

        {/* Delete Tool — click a shape to remove it */}
        <ToggleButton value="delete" aria-label="Delete shape">
          <Tooltip title="Delete Shape" placement="right">
            <DeleteIcon />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
};

export default DrawToolbar;
