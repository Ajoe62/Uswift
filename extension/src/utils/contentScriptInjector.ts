/**
 * Content Script Injector
 * Ensures content script is loaded before attempting communication
 */

/**
 * Check if content script is already loaded
 */
async function isContentScriptLoaded(tabId: number): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(
      tabId,
      { action: 'ping' },
      (response) => {
        if (chrome.runtime.lastError) {
          // Content script not loaded
          resolve(false);
        } else if (response?.status === 'pong') {
          // Content script is loaded and responding
          resolve(true);
        } else {
          resolve(false);
        }
      }
    );
  });
}

/**
 * Inject content script into tab
 */
async function injectContentScript(tabId: number): Promise<boolean> {
  try {
    console.log('[Injector] Injecting content script into tab:', tabId);

    // Inject the content script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    });

    console.log('[Injector] Content script injected successfully');

    // Wait a moment for script to initialize
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify it's loaded
    const loaded = await isContentScriptLoaded(tabId);

    if (loaded) {
      console.log('[Injector] Content script verified as loaded');
    } else {
      console.warn('[Injector] Content script injected but not responding');
    }

    return loaded;
  } catch (error: any) {
    console.error('[Injector] Failed to inject content script:', error);

    // Check if it's a permission error
    if (error.message?.includes('Cannot access')) {
      throw new Error('PERMISSION_DENIED');
    }

    // Check if it's a special page (chrome://, etc.)
    if (error.message?.includes('chrome://') ||
        error.message?.includes('chrome-extension://')) {
      throw new Error('PROTECTED_PAGE');
    }

    throw error;
  }
}

/**
 * Ensure content script is loaded, inject if needed
 */
export async function ensureContentScriptLoaded(tabId: number): Promise<boolean> {
  console.log('[Injector] Checking if content script is loaded...');

  // First, check if it's already loaded
  const alreadyLoaded = await isContentScriptLoaded(tabId);

  if (alreadyLoaded) {
    console.log('[Injector] Content script already loaded');
    return true;
  }

  console.log('[Injector] Content script not loaded, attempting injection...');

  // Try to inject it
  return await injectContentScript(tabId);
}

/**
 * Get current tab and ensure content script is loaded
 */
export async function getTabWithContentScript(): Promise<{
  success: boolean;
  tab?: chrome.tabs.Tab;
  error?: string;
}> {
  try {
    // Get active tab
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const tab = tabs[0];

    if (!tab?.id) {
      return {
        success: false,
        error: 'NO_ACTIVE_TAB',
      };
    }

    // Check if it's a special page that can't be accessed
    if (tab.url?.startsWith('chrome://') ||
        tab.url?.startsWith('chrome-extension://') ||
        tab.url?.startsWith('edge://') ||
        tab.url?.startsWith('about:')) {
      return {
        success: false,
        error: 'PROTECTED_PAGE',
      };
    }

    // Ensure content script is loaded
    try {
      const loaded = await ensureContentScriptLoaded(tab.id);

      if (!loaded) {
        return {
          success: false,
          error: 'CONTENT_SCRIPT_INJECTION_FAILED',
        };
      }

      return {
        success: true,
        tab,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'INJECTION_ERROR',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'UNKNOWN_ERROR',
    };
  }
}
