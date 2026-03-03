/**
 * E2E test mode utilities
 * Helps determine when we're in automated testing to render deterministic UI state
 */

/**
 * Check if we're in E2E test mode
 * Returns true if:
 * - URL has testMode=1 or testMode=true query param
 * - localStorage has E2E_TESTMODE='1'
 */
export function isE2E(): boolean {
  // Check URL params
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('testMode') === '1' || urlParams.get('testMode') === 'true') {
    return true;
  }

  // Check localStorage (for persisted test mode across navigations)
  try {
    if (localStorage.getItem('E2E_TESTMODE') === '1') {
      return true;
    }
  } catch {
    // localStorage access might fail in some contexts, ignore
  }

  return false;
}

/**
 * Persist test mode in localStorage for use across page navigations
 */
export function setE2EMode(enabled: boolean): void {
  try {
    localStorage.setItem('E2E_TESTMODE', enabled ? '1' : '0');
  } catch {
    // Ignore storage errors
  }
}
