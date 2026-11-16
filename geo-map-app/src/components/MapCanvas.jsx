// ============================================================
// MapCanvas.jsx — OpenLayers Interactive Map with Full Geometry Tools
// ------------------------------------------------------------
// This component manages the complete OpenLayers map lifecycle:
//
// Key capabilities in Phase 2:
//   1. Base tile rendering (OpenStreetMap)
//   2. Dynamic user layers (VectorLayer + VectorSource per layer)
//   3. Drawing interactions (`ol/interaction/Draw`):
//      - Point (`type: 'Point'`)
//      - Rectangle (`type: 'Circle'` + `createBox()`)
//      - Polygon (`type: 'Polygon'`)
//      - Direction / Route (`type: 'LineString'`)
//   4. Vertex modification (`ol/interaction/Modify`):
//      - Drag individual polygon/line vertices to reshape
//   5. Shape translation (`ol/interaction/Translate`):
//      - Click & drag entire shapes across coordinates
//   6. Vertex snapping (`ol/interaction/Snap`):
//      - Precision alignment between adjacent shapes
//   7. Click-to-delete in 'delete' mode
//   8. Click-to-inspect in 'select' mode (opens FeaturePropertiesDialog)
// ============================================================

import React, { useRef, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- OpenLayers Core ---
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';

// --- OpenLayers Interactions ---
import Draw, { createBox } from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import Translate from 'ol/interaction/Translate';
import Snap from 'ol/interaction/Snap';

// --- Styling Helpers & Subcomponents ---
import { createFeatureStyle } from '../services/styleHelper';
import FeaturePropertiesDialog from './FeaturePropertiesDialog';
import 'ol/ol.css';

// ============================================================
// MapCanvas Component
// ------------------------------------------------------------
// Props:
//   layers (Array) — List of user layer definitions from App.jsx
//   activeLayerId (string) — ID of the current drawing target layer
//   activeTool (string) — Selected tool: 'select'|'point'|'rectangle'|'polygon'|'direction'|'delete'
//   onFeaturesCountChange (function) — Notifies App when feature count changes in layers
// ============================================================
const MapCanvas = ({
  layers,
  activeLayerId,
  activeTool,
  onFeaturesCountChange,
}) => {
  // DOM element container for OpenLayers canvas
  const mapContainerRef = useRef(null);
  // Persisted Map instance
  const mapRef = useRef(null);

  // Map of layerId -> { vectorLayer, vectorSource }
  // Stored in a ref so OpenLayers interactions can access it without causing React re-renders
  const layerRegistryRef = useRef(new Map());

  // Currently active OpenLayers interactions
  const activeInteractionsRef = useRef([]);

  // State for feature properties inspection modal
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedFeatureLayerName, setSelectedFeatureLayerName] = useState('');
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // ============================================================
  // Step 1: Initialize the OpenLayers Map (Runs ONCE on mount)
  // ============================================================
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create the OpenLayers Map instance
    const map = new Map({
      target: mapContainerRef.current,
      layers: [
        // Base World Map Tile Layer
        new TileLayer({
          source: new OSM(),
          preload: 4,
        }),
      ],
      view: new View({
        // Centered on India (78.9629° E, 20.5937° N)
        center: fromLonLat([78.9629, 20.5937]),
        zoom: 5,
        minZoom: 2,
        maxZoom: 19,
      }),
    });

    mapRef.current = map;
    console.log('🗺️ OpenLayers map successfully initialized');

    // Cleanup when component unmounts (handles React 18/19 StrictMode properly)
    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(undefined);
        mapRef.current = null;
      }
      // Clear registry so stale layers are not retained across remounts
      if (layerRegistryRef.current && typeof layerRegistryRef.current.clear === 'function') {
        layerRegistryRef.current.clear();
      }
    };
  }, []);

  // ============================================================
  // Step 2: Synchronize User Layers with OpenLayers Map
  // ------------------------------------------------------------
  // Whenever the `layers` prop changes (layer added, color updated,
  // visibility toggled, or layer removed), synchronize the map's
  // VectorLayer instances.
  // ============================================================
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Ensure layer registry is a valid Map instance
    if (!layerRegistryRef.current || !(layerRegistryRef.current instanceof Map)) {
      layerRegistryRef.current = new Map();
    }
    const registry = layerRegistryRef.current;
    const currentLayerIds = new Set(layers.map((l) => l.id));

    // 1. Remove deleted layers from map
    const existingIds = Array.from(registry.keys());
    for (const id of existingIds) {
      if (!currentLayerIds.has(id)) {
        const entry = registry.get(id);
        if (entry && entry.vectorLayer) {
          map.removeLayer(entry.vectorLayer);
        }
        registry.delete(id);
      }
    }

    // 2. Add or update layers
    const mapLayers = map.getLayers().getArray();
    layers.forEach((layerDef) => {
      let entry = registry.get(layerDef.id);

      // If entry doesn't exist, OR if map was recreated and doesn't contain this layer yet
      if (!entry || !mapLayers.includes(entry.vectorLayer)) {
        // Reuse existing vector source if available, or create new one
        const vectorSource = entry ? entry.vectorSource : new VectorSource();

        // Create new VectorLayer with a dynamic style function
        const vectorLayer = new VectorLayer({
          source: vectorSource,
          visible: layerDef.visible,
          // OpenLayers style function: called whenever a feature on this layer renders
          style: (feature) => createFeatureStyle(feature, layerDef.color),
        });

        // Store user layer ID on the OpenLayers layer object for reverse lookups
        vectorLayer.set('layerId', layerDef.id);

        // Add layer to map
        map.addLayer(vectorLayer);

        entry = { vectorLayer, vectorSource };
        registry.set(layerDef.id, entry);
      } else {
        // Update layer visibility if changed
        entry.vectorLayer.setVisible(layerDef.visible);

        // Update layer style function in case the user picked a new color
        entry.vectorLayer.setStyle((feature) => createFeatureStyle(feature, layerDef.color));
      }
    });

    // Refresh feature counts in parent UI
    updateFeatureCounts();
  }, [layers]);

  // Helper: Count shapes in each layer and report back to parent
  const updateFeatureCounts = () => {
    if (!onFeaturesCountChange || !layerRegistryRef.current) return;

    const counts = {};
    if (layerRegistryRef.current instanceof Map) {
      layerRegistryRef.current.forEach((entry, layerId) => {
        counts[layerId] = entry.vectorSource ? entry.vectorSource.getFeatures().length : 0;
      });
    }

    onFeaturesCountChange(counts);
  };

  // ============================================================
  // Step 3: Manage Drawing, Editing & Selection Interactions
  // ------------------------------------------------------------
  // Whenever `activeTool` or `activeLayerId` changes, update the
  // active OpenLayers interactions (Draw, Modify, Translate, Snap).
  // ============================================================
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // --- Helper: Remove all previous interactions ---
    const cleanupInteractions = () => {
      activeInteractionsRef.current.forEach((interaction) => {
        map.removeInteraction(interaction);
      });
      activeInteractionsRef.current = [];
    };

    cleanupInteractions();

    const activeEntry =
      layerRegistryRef.current instanceof Map
        ? layerRegistryRef.current.get(activeLayerId)
        : null;
    if (!activeEntry) return;

    const activeSource = activeEntry.vectorSource;
    const activeLayerDef = layers.find((l) => l.id === activeLayerId);
    const activeColor = activeLayerDef ? activeLayerDef.color : '#1976d2';

    // ----------------------------------------------------------
    // A. DRAWING TOOLS ('point', 'rectangle', 'polygon', 'direction')
    // ----------------------------------------------------------
    if (['point', 'rectangle', 'polygon', 'direction'].includes(activeTool)) {
      let drawInteraction = null;

      if (activeTool === 'point') {
        // Draw single point marker
        drawInteraction = new Draw({
          source: activeSource,
          type: 'Point',
        });
      } else if (activeTool === 'rectangle') {
        // Draw rectangle using Circle type + createBox geometry function
        drawInteraction = new Draw({
          source: activeSource,
          type: 'Circle',
          geometryFunction: createBox(),
        });
      } else if (activeTool === 'polygon') {
        // Draw multi-sided polygon (click to place vertices, double-click to finish)
        drawInteraction = new Draw({
          source: activeSource,
          type: 'Polygon',
        });
      } else if (activeTool === 'direction') {
        // Draw direction line / route (click vertices, double-click to finish)
        drawInteraction = new Draw({
          source: activeSource,
          type: 'LineString',
        });
      }

      if (drawInteraction) {
        // --- Event: When shape drawing completes ---
        drawInteraction.on('drawend', (event) => {
          const feature = event.feature;
          const shapeTypeMap = {
            point: 'Point',
            rectangle: 'Rectangle',
            polygon: 'Polygon',
            direction: 'Direction',
          };

          const shapeType = shapeTypeMap[activeTool] || 'Shape';
          const shapeCount = activeSource.getFeatures().length + 1;

          // Assign essential geospatial metadata to the feature
          feature.set('id', uuidv4());
          feature.set('layerId', activeLayerId);
          feature.set('shapeType', shapeType);
          feature.set('name', `${shapeType} ${shapeCount}`);
          feature.set('isHighlighted', false);
          feature.set('version', 1);
          feature.set('isDeleted', false);
          feature.set('createdAt', new Date().toISOString());
          feature.set('updatedAt', new Date().toISOString());

          // Apply initial style
          feature.setStyle(createFeatureStyle(feature, activeColor));

          // Schedule feature count update on next tick
          setTimeout(updateFeatureCounts, 50);
        });

        // Add Draw interaction to map
        map.addInteraction(drawInteraction);
        activeInteractionsRef.current.push(drawInteraction);

        // Add Snap interaction for vertex alignment while drawing
        const snap = new Snap({ source: activeSource });
        map.addInteraction(snap);
        activeInteractionsRef.current.push(snap);
      }
    }

    // ----------------------------------------------------------
    // B. SELECT & MOVE MODE ('select')
    // ----------------------------------------------------------
    if (activeTool === 'select') {
      // 1. Modify: Allows dragging individual vertices of lines & polygons
      const modify = new Modify({ source: activeSource });
      modify.on('modifyend', (event) => {
        event.features.forEach((feat) => {
          feat.set('updatedAt', new Date().toISOString());
        });
      });
      map.addInteraction(modify);
      activeInteractionsRef.current.push(modify);

      // 2. Translate: Allows dragging entire shapes across coordinates
      const translate = new Translate({
        layers: [activeEntry.vectorLayer],
      });
      translate.on('translateend', (event) => {
        event.features.forEach((feat) => {
          feat.set('updatedAt', new Date().toISOString());
        });
      });
      map.addInteraction(translate);
      activeInteractionsRef.current.push(translate);

      // 3. Snap: Smooth snapping during modification
      const snap = new Snap({ source: activeSource });
      map.addInteraction(snap);
      activeInteractionsRef.current.push(snap);
    }

    return cleanupInteractions;
  }, [activeTool, activeLayerId, layers]);

  // ============================================================
  // Step 4: Handle Map Clicks for Select & Delete Modes
  // ============================================================
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleSingleClick = (event) => {
      // In drawing modes, clicks are handled by Draw interaction
      if (['point', 'rectangle', 'polygon', 'direction'].includes(activeTool)) {
        return;
      }

      // Check if user clicked on any vector feature at this pixel
      const clickedFeature = map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => feature
      );

      // --- Mode: DELETE ---
      if (activeTool === 'delete') {
        if (clickedFeature) {
          // Find which layer owns this feature
          const layerId = clickedFeature.get('layerId');
          const entry =
            layerRegistryRef.current instanceof Map
              ? layerRegistryRef.current.get(layerId)
              : null;
          if (entry) {
            // Remove feature from OpenLayers source
            entry.vectorSource.removeFeature(clickedFeature);
            updateFeatureCounts();
          }
        }
        return;
      }

      // --- Mode: SELECT (Inspect & Edit Properties) ---
      if (activeTool === 'select') {
        if (clickedFeature) {
          const layerId = clickedFeature.get('layerId');
          const layerDef = layers.find((l) => l.id === layerId);

          setSelectedFeature(clickedFeature);
          setSelectedFeatureLayerName(layerDef ? layerDef.name : 'Layer');
          setInspectorOpen(true);
        } else {
          // Clicked on empty space — close inspector
          setInspectorOpen(false);
          setSelectedFeature(null);
        }
      }
    };

    map.on('singleclick', handleSingleClick);

    return () => {
      map.un('singleclick', handleSingleClick);
    };
  }, [activeTool, layers]);

  // ============================================================
  // Feature Inspector Handlers
  // ============================================================
  // Save updated properties (Name, Highlight toggle)
  const handleSaveFeatureProperties = ({ name, isHighlighted }) => {
    if (!selectedFeature) return;

    selectedFeature.set('name', name);
    selectedFeature.set('isHighlighted', isHighlighted);
    selectedFeature.set('updatedAt', new Date().toISOString());

    // Re-render feature with updated style (highlighted or normal)
    const layerId = selectedFeature.get('layerId');
    const layerDef = layers.find((l) => l.id === layerId);
    const color = layerDef ? layerDef.color : '#1976d2';

    selectedFeature.setStyle(createFeatureStyle(selectedFeature, color));
  };

  // Delete selected feature from inspector dialog
  const handleDeleteFeatureFromInspector = (feature) => {
    if (!feature) return;

    const layerId = feature.get('layerId');
    const entry =
      layerRegistryRef.current instanceof Map
        ? layerRegistryRef.current.get(layerId)
        : null;
    if (entry) {
      entry.vectorSource.removeFeature(feature);
      updateFeatureCounts();
    }
  };

  return (
    <>
      {/* Map Canvas Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          // Change cursor to crosshair when drawing
          cursor: ['point', 'rectangle', 'polygon', 'direction'].includes(activeTool)
            ? 'crosshair'
            : activeTool === 'delete'
            ? 'not-allowed'
            : 'default',
        }}
      />

      {/* Feature Properties Inspector Dialog */}
      <FeaturePropertiesDialog
        open={inspectorOpen}
        feature={selectedFeature}
        layerName={selectedFeatureLayerName}
        onClose={() => setInspectorOpen(false)}
        onSave={handleSaveFeatureProperties}
        onDelete={handleDeleteFeatureFromInspector}
      />
    </>
  );
};

export default MapCanvas;
