# geo-map-app

Offline-Capable Geospatial Map Application built with React, OpenLayers, Material UI, and Dexie.js.

## Tech Stack
- **Frontend:** React + Vite, OpenLayers, Material UI
- **Offline Storage:** Dexie.js (IndexedDB)
- **Backend:** Node.js, Express, MongoDB (Phase 4)
- **Target:** Intel i3, 8GB RAM, Fedora Linux 44

## Setup
```bash
cd geo-map-app
npm install
npm run dev
```

## Current Status
- ✅ Phase 1: Project Bootstrap & Base Map
- ✅ Phase 2: Geometry Tools & Layer Controls
  - Point, Rectangle, Polygon, and Route (with directional arrows) drawing tools
  - Vertex modification (Modify), shape translation (Translate), and snapping (Snap)
  - Custom layer management (create, rename, color palette, visibility toggle, delete)
  - Shape properties inspector (rename, reassign layers, golden glow highlight, delete)
  - Full-row layer selection and live shape counters
- 🔲 Phase 3: Offline Persistence (Dexie.js)
- 🔲 Phase 4: Backend API (Node/Express/MongoDB)
- 🔲 Phase 5: Sync Engine & Conflict Resolution
- 🔲 Phase 6: UI Polish & PWA
- 🔲 Phase 7: Testing & QA
