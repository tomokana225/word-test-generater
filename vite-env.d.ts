// By default, TypeScript doesn't know how to handle non-code asset imports.
// This declaration tells TypeScript that importing a .css file is a valid operation,
// even if we don't use its content directly in the code (it's for side effects).
// This resolves the "Cannot find module './index.css'" error during the `tsc` build step.
declare module '*.css';

// FIX: Add type definition for the `electron` object exposed on the window by the preload script.
// This resolves the TypeScript error about 'electron' not existing on 'Window'.
interface Window {
  electron?: {
    isElectron: boolean;
  };
}

// Add a module declaration for react-to-print since it doesn't have official @types.
declare module 'react-to-print';