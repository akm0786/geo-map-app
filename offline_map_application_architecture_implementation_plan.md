# Offline-Capable Geospatial Map Application: System Architecture & Implementation Plan

## 1. System Overview & Hardware Optimization
**Target Environment:** Intel Core i3, 8GB RAM, Fedora Linux 44 (Local Prototype)  
**Core Stack:** React (JavaScript), OpenLayers (`ol`), Material UI (`@mui/material`), Dexie.js (IndexedDB), Node.js, Express.js, MongoDB (`2dsphere` index)

### Architectural Goals
* **Lightweight Rendering:** Utilize Vector Tiles (`.pmtiles` or local PBF tiles) instead of heavy raster image tiles to minimize RAM/CPU overhead on the i3/8GB Fedora host.
* **Offline-First CRUD & Geometry Operations:** Full creation, modification, deletion, and movement of Points, Polygons, Rectangles, Lines (directions), and custom layers without active internet connectivity.
* **Resilient Synchronization:** Event-sourced/queue-based sync engine reconciling local IndexedDB state with MongoDB upon network restoration.

---

## 2. High-Level System Architecture

```
+-------------------------------------------------------------------+
|                   FRONTEND (React + Material UI)                  |
|                                                                   |
|  +-----------------------+    +--------------------------------+  |
|  |   OpenLayers Canvas   |    |    MUI Toolbar & Layer Panel   |  |
|  | - Vector Tile Layer   |    | - Draw (Point/Poly/Rect/Line)  |  |
|  | - Vector Draw Layer   |<-->| - Modify / Translate / Snap    |  |
|  | - Highlight Overlays  |    | - Layer Visibility & Styling   |  |
|  +-----------+-----------+    +---------------+----------------+  |
|              |                                |                   |
|              v                                v                   |
|  +-------------------------------------------------------------+  |
|  |              Offline Data & Sync Engine (Dexie.js)          |  |
|  |  [Table: features]  [Table: layers]  [Table: sync_queue]    |  |
|  +------------------------------+------------------------------+  |
+---------------------------------|---------------------------------+
                                  | REST API (GeoJSON Payloads)
                                  | (Triggered on Network Online)
                                  v
+-------------------------------------------------------------------+
|                    BACKEND (Node.js + Express)                    |
|                                                                   |
|  +-----------------------+    +--------------------------------+  |
|  |  Sync & Batch Router  |--->|   Conflict Resolution Engine   |  |
|  |  POST /api/sync/push  |    |  (Version Vector / Timestamp)  |  |
|  |  GET  /api/sync/pull  |    +---------------+----------------+  |
|  +-----------------------+                    |                   |
+-----------------------------------------------|-------------------+
                                                v
+-------------------------------------------------------------------+
|                    DATABASE (MongoDB Local/Cloud)                 |
|  Collection: geo_features (GeoJSON + 2dsphere Index + Metadata)   |
+-------------------------------------------------------------------+
```

---

## 3. Frontend Architecture (React + OpenLayers + MUI)

### 3.1 Directory Structure
```text
src/
├── components/
│   ├── MapCanvas.jsx          # Core OpenLayers Map instance & event bindings
│   ├── DrawToolbar.jsx        # MUI SpeedDial/ToggleButtonGroup for geometry tools
│   ├── LayerDrawer.jsx        # MUI Drawer for toggling layers, highlights & styles
│   └── SyncStatusBadge.jsx    # Online/Offline indicator & manual sync trigger
├── db/
│   └── dexieDb.js             # IndexedDB schema (features, layers, sync_queue)
├── services/
│   ├── geoJsonMapper.js       # Converts OL Features <-> GeoJSON
│   └── syncManager.js         # Background worker / online listener for API sync
└── App.jsx
```

### 3.2 Lightweight Map Rendering (Vector Tiles)
* **Format:** Use PMTiles (`pmtiles` + `ol-pmtiles`) or locally served `.mvt`/`.pbf` tiles via a lightweight local tile server (e.g., `tileserver-gl-light` or static express route).
* **Why PMTiles:** Single-file archive hosted locally or cached via Service Worker; requires zero background database processes (unlike PostGIS), keeping Fedora RAM usage under ~150MB for map rendering.
* **Fallback:** OpenStreetMap standard XYZ tiles cached aggressively via Workbox Service Worker (`CacheFirst` strategy).

### 3.3 OpenLayers Interactions & Geometry Tools
1. **Drawing (`ol/interaction/Draw`):**
   * **Point / Node:** `type: 'Point'` with custom SVG/Icon style (`ol/style/Icon`).
   * **Polygon:** `type: 'Polygon'`.
   * **Rectangle:** `type: 'Circle'` combined with `geometryFunction: createBox()`.
   * **Directions / Routes:** `type: 'LineString'` with directional arrow styles along segments.
2. **Movement & Editing (`ol/interaction/Modify` & `ol/interaction/Translate`):**
   * `Translate` allows dragging entire nodes, rectangles, or polygons across coordinates.
   * `Modify` allows dragging individual vertices of polygons/lines.
   * `Snap` (`ol/interaction/Snap`) enables precise vertex alignment between shapes.
3. **Highlighting & Layers:**
   * Maintain separate `ol/layer/Vector` instances per user-defined layer or filter features by `layerId` property.
   * Highlighting uses a dedicated `Select` interaction or dynamic style function checking `feature.get('isHighlighted')`.

---

## 4. Offline Storage Strategy (IndexedDB via Dexie.js)

### 4.1 Database Schema (`dexieDb.js`)
```javascript
import Dexie from 'dexie';

export const db = new Dexie('OfflineGeoMapDB');

db.version(1).stores({
  // Primary geospatial records stored as GeoJSON strings/objects
  features: 'id, layerId, type, updatedAt, version, isDeleted',
  
  // Custom map layers (e.g., "Delivery Zones", "Assets")
  layers: 'id, name, visible, color, updatedAt',
  
  // Outbox queue for mutations made while offline
  sync_queue: '++queueId, featureId, operation, timestamp, payload'
});
```

### 4.2 Offline Write Workflow (Local-First)
1. User draws, moves, edits, or deletes a feature on the OpenLayers canvas.
2. `geoJsonMapper` serializes the `ol/Feature` into standard GeoJSON (`EPSG:4326`).
3. Inside a single Dexie transaction (`db.transaction('rw', db.features, db.sync_queue, ...)`):
   * Upsert the feature into `db.features` with an incremented local `version` and `updatedAt` ISO timestamp.
   * Append an entry (`CREATE`, `UPDATE`, or `DELETE`) to `db.sync_queue`.
4. UI updates immediately from local state without waiting for network I/O.

---

## 5. Backend Architecture (Node.js + Express + MongoDB)

### 5.1 MongoDB Schema (`models/GeoFeature.js`)
```javascript
const mongoose = require('mongoose');

const GeoFeatureSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Client-generated UUIDv4
  layerId: { type: String, required: true, index: true },
  type: { type: String, default: 'Feature' },
  geometry: {
    type: {
      type: String,
      enum: ['Point', 'LineString', 'Polygon'],
      required: true
    },
    coordinates: { type: Array, required: true }
  },
  properties: {
    name: String,
    shapeType: { type: String, enum: ['Point', 'Polygon', 'Rectangle', 'Direction'] },
    isHighlighted: { type: Boolean, default: false },
    style: { color: String, icon: String }
  },
  version: { type: Number, default: 1 },
  isDeleted: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now, index: true }
});

// Enable geospatial queries ($near, $geoWithin, $geoIntersects)
GeoFeatureSchema.index({ geometry: '2dsphere' });

module.exports = mongoose.model('GeoFeature', GeoFeatureSchema);
```

### 5.2 API Endpoints
* `POST /api/sync/push`: Accepts an array of queued mutations (`sync_queue` items) from the client. Processes in bulk via `bulkWrite` after conflict checks.
* `GET /api/sync/pull?since=<ISO_TIMESTAMP>`: Returns all features modified or soft-deleted (`isDeleted: true`) after the client's `lastSyncedAt` timestamp.
* `GET /api/features/spatial`: Optional spatial query endpoint (e.g., fetch features within a bounding box).

---

## 6. Synchronization & Conflict Resolution

### 6.1 Sync Lifecycle (`syncManager.js`)
1. **Trigger:** `window.addEventListener('online', runSync)` + periodic polling (e.g., every 30s when online) + manual "Sync Now" MUI button.
2. **Push Phase:**
   * Read all records from `db.sync_queue` ordered by `queueId` (FIFO).
   * Compact redundant operations (e.g., if `feature_1` was `CREATE`d and then `UPDATE`d 5 times offline, send only the final state).
   * `POST` batch to `/api/sync/push`.
   * On HTTP `200`, delete acknowledged items from `db.sync_queue`.
3. **Pull Phase:**
   * `GET /api/sync/pull?since=${localStorage.getItem('lastSyncedAt')}`.
   * Upsert incoming server features into `db.features` (and remove soft-deleted features from OpenLayers canvas).
   * Update `lastSyncedAt` to server response timestamp.

### 6.2 Conflict Resolution Strategy
When two team members edit the same feature offline before syncing:
* **Optimistic Concurrency via `version` + `updatedAt` (Last-Write-Wins with Version Guard):**
  1. Client sends `{ featureId, baseVersion, newGeometry, properties, clientTimestamp }`.
  2. Server compares `client.baseVersion` against `serverDoc.version`:
     * **No Conflict (`client.baseVersion === serverDoc.version`):** Server accepts update, increments `version = version + 1`, and saves.
     * **Conflict (`client.baseVersion < serverDoc.version`):**
       * *Default Policy (Last-Write-Wins):* If `clientTimestamp > serverDoc.updatedAt`, overwrite server geometry and increment `version`. Otherwise, reject client mutation and return `serverDoc` in a `conflicts[]` array.
       * *Client Handling:* Client overwrites its local `db.features` record with the authoritative `serverDoc` and notifies the user via an MUI Snackbar ("1 shape updated from team sync").

---

## 7. Step-by-Step Implementation Plan

### Phase 1: Local Environment & Base Map Setup (Fedora 44)
1. Initialize React app (`npm create vite@latest geo-map-app -- --template react`) and install dependencies:
   ```bash
   npm install ol @mui/material @emotion/react @emotion/styled @mui/icons-material dexie uuid
   ```
2. Set up `MapCanvas.jsx` initializing an OpenLayers `Map` with `EPSG:3857` view projection and a local/cached OSM or PMTiles base layer.
3. Verify smooth 60fps panning/zooming on Fedora 44 with browser DevTools memory profiler.

### Phase 2: Geometry Drawing, Movement & Layer Controls
1. Build `DrawToolbar.jsx` with MUI `ToggleButtonGroup` for modes: `Select/Move`, `Point`, `Rectangle`, `Polygon`, `Direction (Line)`, and `Delete`.
2. Wire OpenLayers `Draw`, `Modify`, `Translate`, and `Snap` interactions to active toolbar mode.
3. Implement `LayerDrawer.jsx` allowing users to create custom layers, toggle visibility (`layer.setVisible()`), change colors, and toggle highlight states.

### Phase 3: Offline Persistence with Dexie.js
1. Create `db/dexieDb.js` and `services/geoJsonMapper.js` (transforming OL coordinates between `EPSG:3857` and `EPSG:4326`).
2. Hook OpenLayers `drawend`, `modifyend`, and `translateend` events to write changes to `db.features` and `db.sync_queue`.
3. On app load (`useEffect`), hydrate the OpenLayers `VectorSource` from `db.features` so shapes persist across browser restarts and offline sessions.

### Phase 4: Node.js, Express & MongoDB Backend
1. Initialize Express server (`npm init -y && npm install express mongoose cors dotenv`).
2. Start local MongoDB service on Fedora (`sudo systemctl start mongod`).
3. Implement `GeoFeature` model with `2dsphere` index and build `/api/sync/push` and `/api/sync/pull` endpoints.

### Phase 5: Sync Engine & End-to-End Offline Testing
1. Implement `syncManager.js` with `online`/`offline` event listeners and batch queue compaction.
2. Test offline resilience:
   * Disconnect Wi-Fi / toggle DevTools Network to **Offline**.
   * Draw polygons, move points, create layers, and reload the browser.
   * Re-enable network, verify `sync_queue` flushes to MongoDB, and confirm GeoJSON integrity in MongoDB Compass.