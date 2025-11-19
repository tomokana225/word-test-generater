import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Correct the import path for App.tsx to be a relative path './App'.
import App from './App';
import { ApiKeyProvider } from './contexts/ApiKeyContext';

// Electron environment uses a bundled CSS file.
// The conditional check prevents this from running in non-build environments like AI Studio.
if (typeof window.electron !== 'undefined' && window.electron.isElectron) {
  import('./index.css');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Fatal Error: Could not find the root element with ID 'root'. The application cannot be mounted.");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ApiKeyProvider>
      <App />
    </ApiKeyProvider>
  </React.StrictMode>
);