// ============================================================
// Main Entry Point (main.jsx)
// ------------------------------------------------------------
// This is the very first JavaScript file that runs when the
// app loads. It does two things:
//   1. Imports React and ReactDOM to enable React rendering
//   2. Renders our root <App /> component into the HTML page
//
// Think of this as the "ignition key" that starts the whole app.
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Import global CSS styles (resets, base styling)
import './index.css';

// Find the <div id="root"> in index.html and render our
// React app inside it. StrictMode adds extra development
// warnings to help catch common mistakes.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
