// ============================================================
// styleHelper.js — Dynamic OpenLayers Feature Styling
// ------------------------------------------------------------
// This module is responsible for how features (shapes) look on the map.
//
// Key features supported:
//   1. Hex to RGBA conversion for semi-transparent polygon fills
//   2. Custom styles for each shape type:
//      - Point: Circular pin with layer color & white outer border
//      - Polygon: Translucent fill with solid colored border
//      - Rectangle: Clean box with styled stroke and fill
//      - Direction (LineString): Solid path WITH directional arrows
//        along each line segment showing movement direction!
//   3. Highlight styling: Golden glowing border when `isHighlighted` is true
//   4. Selection styling: Visual cue when a feature is selected
// ============================================================

import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import CircleStyle from 'ol/style/Circle';
import RegularShape from 'ol/style/RegularShape';
import Point from 'ol/geom/Point';

// ============================================================
// Helper: Convert Hex Color (#RRGGBB) to RGBA with Opacity
// ------------------------------------------------------------
// Why? Polygons look much better when their inner fill is
// semi-transparent (e.g. 25% opacity) so the underlying map
// streets and buildings remain visible.
// ============================================================
export const hexToRgba = (hex, opacity = 0.25) => {
  if (!hex) return `rgba(25, 118, 210, ${opacity})`;

  // Remove leading '#' if present
  let cleanHex = hex.replace('#', '');

  // Handle 3-character hex shorthand (#FFF -> #FFFFFF)
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }

  // Parse RGB numeric values from hex string
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// ============================================================
// createFeatureStyle(feature, layerColor, isSelected)
// ------------------------------------------------------------
// This function determines the exact visual style for any feature.
// It can be used directly or as an OpenLayers Style Function.
//
// Inputs:
//   - feature: The ol/Feature being rendered
//   - layerColor: The parent layer's hex color code (e.g., "#1976d2")
//   - isSelected: Whether this shape is currently selected by the user
// ============================================================
export const createFeatureStyle = (feature, layerColor = '#1976d2', isSelected = false) => {
  // Check if this feature has the highlight flag enabled
  const isHighlighted = feature.get('isHighlighted') === true;
  const shapeType = feature.get('shapeType') || 'Polygon';

  // Base colors
  // Highlighted features get a vibrant gold/amber outline
  const strokeColor = isHighlighted ? '#ffb300' : isSelected ? '#ff5722' : layerColor;
  const strokeWidth = isHighlighted ? 4 : isSelected ? 3 : 2;
  const fillColor = hexToRgba(layerColor, isHighlighted ? 0.4 : 0.25);

  const geometry = feature.getGeometry();
  if (!geometry) return null;

  const geomType = geometry.getType();

  // ------------------------------------------------------------
  // 1. Point / Node Style
  // ------------------------------------------------------------
  if (geomType === 'Point' || shapeType === 'Point') {
    return new Style({
      image: new CircleStyle({
        radius: isHighlighted ? 9 : 7,
        fill: new Fill({ color: strokeColor }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 2.5,
        }),
      }),
    });
  }

  // ------------------------------------------------------------
  // 2. Direction / Route Style (LineString with Direction Arrows)
  // ------------------------------------------------------------
  if (geomType === 'LineString' || shapeType === 'Direction') {
    // Primary style for the line path itself
    const styles = [
      new Style({
        stroke: new Stroke({
          color: strokeColor,
          width: isHighlighted ? 5 : 3.5,
          lineCap: 'round',
          lineJoin: 'round',
        }),
      }),
    ];

    // Compute directional arrows along each line segment!
    // OpenLayers' `forEachSegment` calls back with [startCoords, endCoords]
    geometry.forEachSegment((start, end) => {
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];

      // Calculate the angle (rotation) of this line segment
      // Math.atan2 gives the counter-clockwise angle in radians
      const rotation = Math.atan2(dy, dx);

      // Place arrow at the midpoint (50%) of each segment
      const midPoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];

      // Create a 3-point triangle arrow pointing along the segment
      styles.push(
        new Style({
          geometry: new Point(midPoint),
          image: new RegularShape({
            fill: new Fill({ color: isHighlighted ? '#ffb300' : strokeColor }),
            stroke: new Stroke({ color: '#ffffff', width: 1 }),
            points: 3,        // 3 points = triangle arrow
            radius: 7,         // Size of the arrow
            // OpenLayers rotates clockwise from 12 o'clock, so adjust rotation:
            rotation: -rotation + Math.PI / 2,
            angle: 0,
          }),
        })
      );
    });

    return styles;
  }

  // ------------------------------------------------------------
  // 3. Polygon & Rectangle Style
  // ------------------------------------------------------------
  // Both Polygons and Rectangles (which are internally 4-vertex polygons)
  // use a clean semi-transparent fill and colored perimeter border.
  return new Style({
    stroke: new Stroke({
      color: strokeColor,
      width: strokeWidth,
      // If highlighted, give it a subtle dashed accent line
      lineDash: isHighlighted ? [8, 4] : undefined,
    }),
    fill: new Fill({
      color: fillColor,
    }),
  });
};

export default createFeatureStyle;
