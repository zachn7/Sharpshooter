/**
 * Service Worker Registration
 * 
 * Registers the service worker for PWA offline support.
 * 
 * IMPORTANT: Service worker is only enabled in production builds.
 * In development and during Playwright tests, it is disabled to avoid
 * caching issues and ensure test determinism.
 */

/// <reference types="vite-plugin-pwa/client" />

import { registerSW } from 'virtual:pwa-register';

// Check if we should disable service worker
// - Development mode
// - Playwright test mode (check for testMode in URL)
const shouldDisableSW = (): boolean => {
  // Disable in development
  if (import.meta.env.MODE !== 'production') {
    return true;
  }

  // Disable in Playwright tests (check URL for testMode parameter)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('testMode')) {
      return true;
    }
  }

  return false;
};

/**
 * Registered callback
 */
const onRegistered = (registration: ServiceWorkerRegistration | undefined) => {
  if (registration) {
    console.log('[PWA] Service worker registered:', registration);

    // Check for updates periodically (every 30 minutes)
    setInterval(
      () => {
        registration.update();
      },
      30 * 60 * 1000
    );
  }
};

/**
 * Registration error callback
 */
const onRegisterError = (error: unknown) => {
  console.error('[PWA] Service worker registration failed:', error);
};

/**
 * Register the service worker
 * 
 * This function is exported and called from main.tsx.
 * It will only register the SW in production builds
 * and when not in test mode.
 */
export const registerServiceWorker = (): void => {
  // Skip SW registration if it should be disabled
  if (shouldDisableSW()) {
    console.log('[PWA] Service worker registration disabled (dev/test mode)');
    return;
  }

  try {
    registerSW({
      onRegistered,
      onRegisterError,
    });
  } catch (error) {
    console.error('[PWA] Failed to register service worker:', error);
  }
};
