# Offline-Capable Geospatial Map Application — Implementation Phases

> Master checklist for building the app. Update status as phases complete.

---

## Phase Overview

| Phase | Focus | Est. Duration | Status |
|-------|-------|---------------|--------|
| **1** | Project Bootstrap & Base Map | 2–3 days | ✅ Complete |
| **2** | Geometry Tools & Layer Controls | 4–5 days | 🔲 Not Started |
| **3** | Offline Persistence (Dexie.js) | 3–4 days | 🔲 Not Started |
| **4** | Backend API (Node/Express/MongoDB) | 3–4 days | 🔲 Not Started |
| **5** | Sync Engine & Conflict Resolution | 4–5 days | 🔲 Not Started |
| **6** | UI Polish, PWA & Performance | 3–4 days | 🔲 Not Started |
| **7** | Testing, QA & Deployment | 3–5 days | 🔲 Not Started |

---

## Phase 1 — Project Bootstrap & Base Map Setup

**Goal:** A React + Vite project running on Fedora 44 with a smooth, lightweight OpenLayers map rendering tiles.

### Tasks

- [ ] **1.1 Scaffold the project**
  - `npm create vite@latest geo-map-app -- --template react`

- [ ] **1.2 Install core dependencies**
  - `ol` — OpenLayers map library
  - `@mui/material`, `@emotion/react`, `@emotion/styled` — Material UI components
  - `@mui/icons-material` — Material icons
  - `dexie` — IndexedDB wrapper for offline storage
  - `uuid` — Generate unique IDs for features

- [ ] **1.3 Configure project structure**
  ```
  src/
  ├── components/
  │   ├── MapCanvas.jsx        — Core OpenLayers Map instance
  │   ├── DrawToolbar.jsx      — Geometry drawing tool buttons
  │   ├── LayerDrawer.jsx      — Layer management panel
  │   └── SyncStatusBadge.jsx  — Online/Offline status indicator
  ├── db/
  │   └── dexieDb.js           — IndexedDB schema definition
  ├── services/
  │   ├── geoJsonMapper.js     — OL Feature ↔ GeoJSON converter
  │   └── syncManager.js       — Sync engine for offline → online push/pull
  └── App.jsx                  — Root component
  ```

- [ ] **1.4 Build `MapCanvas.jsx`**
  - Initialize `ol/Map` with `ol/View` (EPSG:3857 projection)
  - Attach map to a React `useRef` div container
  - Set default center and zoom level

- [ ] **1.5 Add base tile layer**
  - Primary: OpenStreetMap XYZ tiles (works immediately, no extra files)
  - Future upgrade: PMTiles via `ol-pmtiles` for lower RAM usage

- [ ] **1.6 Performance baseline**
  - Profile in browser DevTools on i3/8GB
  - Target: ≤150 MB memory, smooth 60fps pan/zoom

### Deliverables
- Working Vite dev server with a pannable/zoomable map
- Clean project structure matching the architecture spec

---

## Phase 2 — Geometry Drawing, Movement & Layer Controls

**Goal:** Users can draw, move, edit, and delete all four geometry types and manage custom layers.

### 2A — Drawing Toolbar (`DrawToolbar.jsx`)

- [ ] **2A.1** Create MUI `ToggleButtonGroup` with modes: Select/Move, Point, Rectangle, Polygon, Direction (Line), Delete
- [ ] **2A.2** Wire `ol/interaction/Draw` for each geometry type:
  - Point → `type: 'Point'`
  - Polygon → `type: 'Polygon'`
  - Rectangle → `type: 'Circle'` + `createBox()`
  - Direction → `type: 'LineString'`
- [ ] **2A.3** Apply custom styles (SVG icons for points, arrows for lines, fill/stroke for polygons)
- [ ] **2A.4** Implement delete (click-to-select → confirm → remove feature)

### 2B — Edit & Move Interactions

- [ ] **2B.1** `ol/interaction/Translate` — drag entire features
- [ ] **2B.2** `ol/interaction/Modify` — drag individual vertices
- [ ] **2B.3** `ol/interaction/Snap` — vertex snapping between shapes
- [ ] **2B.4** Interaction state machine — only one interaction active at a time

### 2C — Layer Management (`LayerDrawer.jsx`)

- [ ] **2C.1** MUI Drawer panel listing all user-defined layers
- [ ] **2C.2** Create / rename / delete layers
- [ ] **2C.3** Toggle layer visibility
- [ ] **2C.4** Change layer colors via color picker
- [ ] **2C.5** Highlight toggle for individual features

### Deliverables
- All four geometry types can be drawn, edited, moved, and deleted
- Custom layers with visibility, color, and highlight controls

---

## Phase 3 — Offline Persistence with Dexie.js (IndexedDB)

**Goal:** Every geometry operation is persisted locally; features survive browser restarts.

### Tasks

- [ ] **3.1** Create `db/dexieDb.js` with schema:
  - `features` — id, layerId, type, updatedAt, version, isDeleted
  - `layers` — id, name, visible, color, updatedAt
  - `sync_queue` — ++queueId, featureId, operation, timestamp, payload
- [ ] **3.2** Build `services/geoJsonMapper.js` — OL Feature ↔ GeoJSON (EPSG:3857 ↔ EPSG:4326)
- [ ] **3.3** Hook `drawend`, `modifyend`, `translateend` events → write to DB + queue
- [ ] **3.4** Implement soft-delete (set `isDeleted: true`, queue `DELETE` op)
- [ ] **3.5** Hydrate map on load from `db.features`
- [ ] **3.6** Persist layer metadata in `db.layers`
- [ ] **3.7** Offline smoke test — kill network, draw, reload, verify data

### ⚠️ Critical Rule
All writes to `features` and `sync_queue` MUST be in a single Dexie transaction to prevent data loss.

### Deliverables
- Fully functional offline app — draw, edit, close browser, reopen, all data intact
- Sync queue populated with all offline mutations

---

## Phase 4 — Backend API (Node.js + Express + MongoDB)

**Goal:** REST API that receives batched mutations and serves updated features.

### 4A — Server Setup

- [ ] **4A.1** Initialize Express project with `express`, `mongoose`, `cors`, `dotenv`
- [ ] **4A.2** Start local MongoDB on Fedora (`sudo systemctl start mongod`)
- [ ] **4A.3** Configure Express (JSON parser, CORS, env-based Mongo URI)
- [ ] **4A.4** Create server directory structure: `models/`, `routes/`, `controllers/`, `middleware/`

### 4B — Data Model & Endpoints

- [ ] **4B.1** `GeoFeature` Mongoose model with `2dsphere` index
- [ ] **4B.2** `POST /api/sync/push` — accept sync-queue batch, conflict check, bulk-write
- [ ] **4B.3** `GET /api/sync/pull?since=<ISO>` — return features modified after timestamp
- [ ] **4B.4** `GET /api/features/spatial` (optional) — bounding box query
- [ ] **4B.5** Error handling middleware

### 4C — Conflict Resolution

- [ ] **4C.1** Version guard: compare `client.baseVersion` vs `serverDoc.version`
- [ ] **4C.2** No-conflict path: versions match → accept, increment version
- [ ] **4C.3** Conflict (LWW): compare timestamps, accept newer, return conflicts array
- [ ] **4C.4** Use `Model.bulkWrite()` for atomic batch operations

### Deliverables
- Tested API endpoints (Postman/curl)
- MongoDB with valid GeoJSON and 2dsphere index

---

## Phase 5 — Sync Engine & End-to-End Integration

**Goal:** Client automatically pushes/pulls data when online, with user-visible sync status.

### 5A — Sync Manager (`services/syncManager.js`)

- [ ] **5A.1** `online`/`offline` event listeners
- [ ] **5A.2** Queue compaction (collapse redundant ops before push)
- [ ] **5A.3** Push phase: read queue → POST → delete acknowledged items
- [ ] **5A.4** Pull phase: GET since lastSyncedAt → upsert local DB → update map
- [ ] **5A.5** Client-side conflict handling: overwrite local + show Snackbar
- [ ] **5A.6** Periodic polling (every 30s when online)
- [ ] **5A.7** Manual sync button in `SyncStatusBadge.jsx`

### 5B — Status UI (`SyncStatusBadge.jsx`)

- [ ] **5B.1** Status indicator (green=synced, yellow=syncing, red=offline, badge=pending count)
- [ ] **5B.2** Snackbar notifications for sync events

### 5C — End-to-End Test Scenarios

- [ ] **5C.1** Offline → draw → reload → data intact
- [ ] **5C.2** Re-enable network → queue flushes to MongoDB
- [ ] **5C.3** Two clients edit same feature offline → conflict resolved
- [ ] **5C.4** Delete feature offline → sync → other clients updated
- [ ] **5C.5** Verify GeoJSON integrity in MongoDB Compass

### Deliverables
- Reliable offline → online round-trip sync
- Graceful conflict resolution with user notifications

---

## Phase 6 — UI Polish, PWA & Performance Hardening

**Goal:** Production-quality UI, installable PWA, optimized for i3/8GB.

### Tasks

- [ ] **6.1** Service Worker via Workbox (`CacheFirst` for tiles and app shell)
- [ ] **6.2** PWA manifest (`manifest.json`, icons, `display: standalone`)
- [ ] **6.3** Responsive layout with MUI breakpoints
- [ ] **6.4** Loading states (skeleton loaders, sync progress indicator)
- [ ] **6.5** Keyboard shortcuts (P=Point, R=Rect, L=Line, G=Polygon, Esc=Select, Del=Delete)
- [ ] **6.6** Feature properties panel (click feature → popover with name, type, coordinates)
- [ ] **6.7** Memory optimization (target idle RSS < 200 MB)
- [ ] **6.8** React error boundaries for map and sync components

### Deliverables
- Installable PWA that loads fully offline
- Polished, responsive, accessible UI

---

## Phase 7 — Testing, QA & Deployment Readiness

**Goal:** Comprehensive test coverage, documentation, and deployable artifact.

### Tasks

- [ ] **7.1** Unit tests (Vitest) for `geoJsonMapper.js`, `syncManager.js`, conflict logic
- [ ] **7.2** Integration tests (Supertest) for all API endpoints
- [ ] **7.3** E2E tests (Playwright or Cypress) — draw, toggle layers, offline/online, sync
- [ ] **7.4** Cross-browser check (Firefox + Chromium)
- [ ] **7.5** Documentation (`README.md` with setup, architecture, API docs)
- [ ] **7.6** Environment config (`.env.example`, optional Docker Compose)
- [ ] **7.7** Production build (`vite build`, bundle analysis, code splitting)

### Deliverables
- All tests passing
- Complete documentation
- Clean production build

---

## Notes

- **Parallel work:** Phases 3 (frontend offline) and 4 (backend API) can be developed simultaneously to save ~1 week.
- **Total estimated timeline:** 5–7 weeks for a solo developer.
- **Target hardware:** Intel Core i3, 8GB RAM, Fedora Linux 44.
