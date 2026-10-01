/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/main.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Validates the existence of the root mount element in the DOM.
 */
function getRootContainer(): HTMLElement {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Fatal: Root container element with ID "root" not found in DOM.');
  }
  return rootElement;
}

/**
 * Mounts the root application component into the DOM within a strict mode boundary.
 */
function initializeApplication(): void {
  const rootContainer = getRootContainer();
  const root = createRoot(rootContainer);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

initializeApplication();
