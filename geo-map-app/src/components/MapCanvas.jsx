// ============================================================
// MapCanvas.jsx — Core OpenLayers Map Component
// ------------------------------------------------------------
// This is the heart of the application. It creates and manages
// the interactive map using the OpenLayers library.
//
// What this component does:
//   1. Creates a full-screen map inside a <div> element
//   2. Adds a base tile layer (OpenStreetMap) so you can see
//      the world map with streets, borders, etc.
//   3. Adds an empty "drawing layer" where user-created shapes
//      (points, polygons, rectangles, lines) will live
//   4. Centers the map on a default location (India)
//
// Key concepts:
//   - ol/Map: The main map object that manages all layers and interactions
//   - ol/View: Controls what part of the world is visible (center, zoom)
//   - ol/layer/Tile + ol/source/OSM: Loads map tiles from OpenStreetMap
//   - ol/layer/Vector + ol/source/Vector: A layer for user-drawn shapes
//   - EPSG:3857: The coordinate system used by web maps (meters)
//   - EPSG:4326: Standard lat/lng coordinates (degrees) — we convert
//     between these two systems as needed
// ============================================================

import React, { useRef, useEffect, useState } from 'react';

// --- OpenLayers Imports ---
// Map: The main map controller
import Map from 'ol/Map';
// View: Defines what area of the world the map shows
import View from 'ol/View';
// TileLayer: Displays pre-rendered map image tiles (the background map)
import TileLayer from 'ol/layer/Tile';
// OSM: OpenStreetMap tile source — free, open-source world map tiles
import OSM from 'ol/source/OSM';
// VectorLayer: A layer that can hold custom shapes/features we draw
import VectorLayer from 'ol/layer/Vector';
// VectorSource: The data container for our custom shapes
import VectorSource from 'ol/source/Vector';
// fromLonLat: Converts longitude/latitude (EPSG:4326) to web map
// coordinates (EPSG:3857) that OpenLayers uses internally
import { fromLonLat } from 'ol/proj';

// OpenLayers CSS — required for the map to render correctly
// (handles map controls, zoom buttons, attribution styling, etc.)
import 'ol/ol.css';

// ============================================================
// MapCanvas Component
// ------------------------------------------------------------
// Props: None currently (will receive toolbar state in Phase 2)
// Returns: A full-screen div containing the OpenLayers map
// ============================================================
const MapCanvas = () => {
  // --- Refs ---
  // mapContainerRef: Points to the HTML <div> where the map renders.
  // We use useRef (not useState) because the div doesn't change —
  // we just need a stable reference to pass to OpenLayers.
  const mapContainerRef = useRef(null);

  // mapRef: Stores the OpenLayers Map instance so we can access
  // it later (e.g., to add interactions, layers, or get the current view).
  // Using useRef avoids re-creating the map on every React re-render.
  const mapRef = useRef(null);

  // --- State ---
  // drawSource: The VectorSource that holds all user-drawn features.
  // We store it in state so other components (toolbar, layer panel)
  // can access it to add/remove/query shapes.
  const [drawSource] = useState(() => new VectorSource());

  // ============================================================
  // Map Initialization Effect
  // ------------------------------------------------------------
  // useEffect with [] dependency = runs ONCE when component mounts.
  // This is where we create the OpenLayers Map and attach it to
  // the HTML div. We also return a cleanup function that destroys
  // the map when the component unmounts (prevents memory leaks).
  // ============================================================
  useEffect(() => {
    // Safety check: don't create the map if the div isn't ready
    // or if we already created a map (prevents double-init in StrictMode)
    if (!mapContainerRef.current || mapRef.current) return;

    // --- Create the OpenLayers Map ---
    const map = new Map({
      // Attach the map to our <div> element
      target: mapContainerRef.current,

      // --- Layers (bottom to top) ---
      layers: [
        // Layer 1: Base Map (OpenStreetMap tiles)
        // This is the background world map with streets, cities, etc.
        // Tiles are 256x256 pixel images loaded from OSM servers.
        new TileLayer({
          source: new OSM(),
          // Preload tiles around the visible area for smoother panning
          preload: 4,
        }),

        // Layer 2: Drawing Layer (empty for now)
        // This is where all user-drawn shapes will appear.
        // It sits ON TOP of the base map so shapes are always visible.
        new VectorLayer({
          source: drawSource,
          // We'll add custom styles in Phase 2
          // (different colors for points, polygons, lines, etc.)
        }),
      ],

      // --- View (what part of the world is visible) ---
      view: new View({
        // Center the map on India (78.9629° E, 20.5937° N)
        // fromLonLat converts [longitude, latitude] to EPSG:3857
        center: fromLonLat([78.9629, 20.5937]),

        // Zoom level 5 shows most of India
        // (zoom 0 = whole world, zoom 18 = street level)
        zoom: 5,

        // Limit zoom range to prevent excessive tile loading
        minZoom: 2,   // Don't zoom out too far
        maxZoom: 19,  // Street-level detail
      }),
    });

    // Store the map instance for later use
    mapRef.current = map;

    // Log confirmation for debugging
    console.log('✅ OpenLayers map initialized successfully');

    // --- Cleanup Function ---
    // When this component is removed from the page (unmount),
    // properly dispose of the map to free memory
    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(undefined); // Detach from DOM
        mapRef.current = null;
      }
    };
  }, [drawSource]); // drawSource is stable (created once via useState initializer)

  // ============================================================
  // Render
  // ------------------------------------------------------------
  // We render a single <div> that fills the entire screen.
  // OpenLayers will take over this div and render the map canvas
  // inside it (using HTML5 Canvas for the map tiles and shapes).
  // ============================================================
  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    />
  );
};

export default MapCanvas;
