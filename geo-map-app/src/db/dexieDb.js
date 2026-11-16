// ============================================================
// dexieDb.js — IndexedDB Database Schema (Offline Storage)
// ------------------------------------------------------------
// This file sets up the local browser database using Dexie.js,
// which is a friendly wrapper around IndexedDB.
//
// Why IndexedDB?
//   - It's built into every modern browser (no extra downloads)
//   - It can store large amounts of structured data locally
//   - Data persists even after closing the browser
//   - Perfect for offline-first applications
//
// Why Dexie.js?
//   - Raw IndexedDB has a complex, callback-heavy API
//   - Dexie makes it feel like working with a normal database
//   - Supports transactions, queries, and indexing easily
//
// We define 3 tables (think of them like spreadsheets):
//   1. features   — All the shapes/markers drawn on the map
//   2. layers     — Custom layer groups (e.g., "Delivery Zones")
//   3. sync_queue — A queue of changes to send to the server
//                   when internet comes back
// ============================================================

import Dexie from 'dexie';

// Create a new database named 'OfflineGeoMapDB'
// If it already exists in the browser, Dexie will open it.
// If it doesn't exist, Dexie will create it.
export const db = new Dexie('OfflineGeoMapDB');

// ============================================================
// Database Schema (Version 1)
// ------------------------------------------------------------
// The string after each table name defines its INDEXES.
// Indexes are like a book's index — they speed up searching.
//
// Format: 'primaryKey, index1, index2, ...'
//   - 'id' = primary key (unique identifier for each record)
//   - '++queueId' = auto-incrementing primary key (1, 2, 3...)
//   - Other fields = secondary indexes for fast queries
//
// NOTE: You can store ANY fields in a record, but only the
// indexed fields listed here can be used for fast filtering.
// ============================================================
db.version(1).stores({
  // --- Table: features ---
  // Stores all geospatial shapes (points, polygons, etc.)
  // as GeoJSON objects with metadata.
  //
  // Indexed fields:
  //   id        — Unique UUID for each feature (primary key)
  //   layerId   — Which layer this feature belongs to
  //   type      — GeoJSON type ('Point', 'Polygon', etc.)
  //   updatedAt — Timestamp of last edit (for sync ordering)
  //   version   — Version counter (for conflict resolution)
  //   isDeleted — Soft-delete flag (0=active, 1=deleted)
  features: 'id, layerId, type, updatedAt, version, isDeleted',

  // --- Table: layers ---
  // Stores user-created layer groups.
  //
  // Indexed fields:
  //   id        — Unique UUID for each layer (primary key)
  //   name      — Human-readable layer name (e.g., "Delivery Zones")
  //   visible   — Whether the layer is currently shown on the map
  //   color     — The color used to render shapes in this layer
  //   updatedAt — Timestamp of last edit
  layers: 'id, name, visible, color, updatedAt',

  // --- Table: sync_queue ---
  // An "outbox" queue of changes made while offline.
  // When internet comes back, these are sent to the server.
  //
  // Indexed fields:
  //   ++queueId  — Auto-incrementing ID (ensures FIFO order)
  //   featureId  — Which feature was changed
  //   operation  — What happened: 'CREATE', 'UPDATE', or 'DELETE'
  //   timestamp  — When the change was made
  //   payload    — The full GeoJSON data of the change
  sync_queue: '++queueId, featureId, operation, timestamp, payload',
});

// Export the database instance for use throughout the app
export default db;
