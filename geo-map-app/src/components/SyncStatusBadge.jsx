// ============================================================
// SyncStatusBadge.jsx — Online/Offline Status Indicator
// ------------------------------------------------------------
// This small component shows the user whether they are:
//   🟢 Online  — Connected to the internet
//   🔴 Offline — No internet connection (changes saved locally)
//
// It listens to the browser's 'online' and 'offline' events
// to automatically update the status in real-time.
//
// In Phase 5, this will also show:
//   - Number of pending sync items
//   - A "Sync Now" button
//   - Snackbar notifications for sync events
// ============================================================

import React, { useState, useEffect } from 'react';
import { Chip } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';

const SyncStatusBadge = () => {
  // --- State ---
  // Track whether the browser currently has internet access.
  // navigator.onLine gives the initial value (true/false).
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // ============================================================
  // Online/Offline Event Listeners
  // ------------------------------------------------------------
  // The browser fires 'online' when internet is restored and
  // 'offline' when connection is lost. We listen to both events
  // to keep our UI in sync with the actual network status.
  // ============================================================
  useEffect(() => {
    // Handler: browser went online
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🟢 Network status: Online');
    };

    // Handler: browser went offline
    const handleOffline = () => {
      setIsOnline(false);
      console.log('🔴 Network status: Offline');
    };

    // Register the event listeners on the window object
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup: remove listeners when component unmounts
    // (prevents memory leaks and duplicate listeners)
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Empty dependency = run once on mount

  // ============================================================
  // Render
  // ------------------------------------------------------------
  // We use a Material UI Chip component to display a small,
  // colored badge in the top-right corner of the map.
  // ============================================================
  return (
    <Chip
      // Show different icon based on connection status
      icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}

      // Display text
      label={isOnline ? 'Online' : 'Offline'}

      // Color: green for online, red-ish for offline
      color={isOnline ? 'success' : 'error'}

      // "outlined" variant gives a cleaner look than solid fill
      variant="outlined"

      // Small size to not distract from the map
      size="small"

      // Position in the top-right corner, floating above the map
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        fontWeight: 'bold',
      }}
    />
  );
};

export default SyncStatusBadge;
