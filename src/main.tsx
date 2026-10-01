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
 * Validates the existence and type integrity of the root mount element in the DOM.
 */
function getRootContainer(): HTMLElement {
  const rootElement = document.getElementById('root');
  if (!rootElement || !(rootElement instanceof HTMLElement)) {
    throw new Error('Fatal: Root container element with ID "root" not found in DOM or invalid type.');
  }
  return rootElement;
}

/**
 * Renders a fallback DOM element safely if application initialization fails, avoiding innerHTML injection.
 */
function renderInitializationError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const fallbackContainer = document.createElement('div');
  fallbackContainer.setAttribute('role', 'alert');
  fallbackContainer.style.cssText =
    'padding: 24px; margin: 24px; border: 1px solid #ef4444; background-color: #fef2f2; color: #991b1b; font-family: system-ui, sans-serif; border-radius: 8px;';

  const title = document.createElement('h1');
  title.style.cssText = 'font-size: 18px; margin: 0 0 8px 0; font-weight: 600;';
  title.textContent = 'Application Initialization Failed';

  const details = document.createElement('pre');
  details.style.cssText = 'margin: 0; white-space: pre-wrap; font-size: 14px;';
  details.textContent = message;

  fallbackContainer.appendChild(title);
  fallbackContainer.appendChild(details);
  document.body.appendChild(fallbackContainer);
}

/**
 * Mounts the root application component into the DOM within a strict mode boundary.
 */
function initializeApplication(): void {
  try {
    const rootContainer = getRootContainer();
    const root = createRoot(rootContainer);

    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error) {
    console.error('Initialization error caught:', error);
    renderInitializationError(error);
  }
}

initializeApplication();
