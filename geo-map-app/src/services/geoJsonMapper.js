// ============================================================
// geoJsonMapper.js — OpenLayers Feature ↔ GeoJSON Converter
// ------------------------------------------------------------
// This service converts between two data formats:
//
// 1. OpenLayers Features — Objects that OpenLayers uses to
//    draw shapes on the map canvas (in EPSG:3857 projection,
//    which uses meters as units)
//
// 2. GeoJSON — The standard format for storing geographic data
//    (in EPSG:4326 projection, which uses degrees lat/lng)
//
// Why do we need this conversion?
//   - OpenLayers works internally in EPSG:3857 (Web Mercator)
//     because it's optimized for web map tile rendering
//   - GeoJSON standard requires EPSG:4326 (latitude/longitude)
//     because that's the universal geographic coordinate system
//   - Our database stores GeoJSON (standard, portable)
//   - Our map displays EPSG:3857 (fast rendering)
//
// Think of it like converting between Celsius and Fahrenheit —
// same temperature, different number systems.
// ============================================================

import GeoJSON from 'ol/format/GeoJSON';

// ============================================================
// Create a reusable GeoJSON formatter
// ------------------------------------------------------------
// dataProjection: The coordinate system used in stored data (4326)
// featureProjection: The coordinate system used on the map (3857)
//
// This formatter automatically converts between the two
// projections when reading/writing features.
// ============================================================
const geojsonFormat = new GeoJSON({
  dataProjection: 'EPSG:4326',      // Database/storage format (lat/lng degrees)
  featureProjection: 'EPSG:3857',   // Map display format (meters)
});

// ============================================================
// featureToGeoJSON(olFeature)
// ------------------------------------------------------------
// Converts a single OpenLayers Feature (displayed on the map)
// into a GeoJSON object (ready to store in IndexedDB).
//
// Input:  An ol/Feature object with geometry in EPSG:3857
// Output: A plain JavaScript object in GeoJSON format (EPSG:4326)
//
// Example output:
// {
//   type: "Feature",
//   geometry: {
//     type: "Point",
//     coordinates: [78.9629, 20.5937]  // [longitude, latitude]
//   },
//   properties: {
//     name: "My Marker",
//     layerId: "abc-123",
//     shapeType: "Point"
//   }
// }
// ============================================================
export const featureToGeoJSON = (olFeature) => {
  // writeFeatureObject() converts the OL feature to a plain
  // JS object in GeoJSON format, automatically transforming
  // coordinates from EPSG:3857 → EPSG:4326
  return geojsonFormat.writeFeatureObject(olFeature);
};

// ============================================================
// geoJSONToFeature(geojsonObject)
// ------------------------------------------------------------
// Converts a GeoJSON object (from IndexedDB) back into an
// OpenLayers Feature (ready to display on the map).
//
// Input:  A GeoJSON Feature object with coordinates in EPSG:4326
// Output: An ol/Feature object with geometry in EPSG:3857
// ============================================================
export const geoJSONToFeature = (geojsonObject) => {
  // readFeature() parses the GeoJSON and creates an OL Feature,
  // automatically transforming coordinates from EPSG:4326 → EPSG:3857
  return geojsonFormat.readFeature(geojsonObject);
};

// ============================================================
// featuresToGeoJSON(olFeatures)
// ------------------------------------------------------------
// Batch converter: converts an array of OL Features into a
// GeoJSON FeatureCollection (useful for exporting all shapes).
//
// Output format:
// {
//   type: "FeatureCollection",
//   features: [ {...}, {...}, ... ]
// }
// ============================================================
export const featuresToGeoJSON = (olFeatures) => {
  return geojsonFormat.writeFeaturesObject(olFeatures);
};

// ============================================================
// geoJSONToFeatures(geojsonCollection)
// ------------------------------------------------------------
// Batch converter: converts a GeoJSON FeatureCollection into
// an array of OL Features (useful for loading all shapes at once).
// ============================================================
export const geoJSONToFeatures = (geojsonCollection) => {
  return geojsonFormat.readFeatures(geojsonCollection);
};

// Export the raw formatter for advanced use cases
export default geojsonFormat;
