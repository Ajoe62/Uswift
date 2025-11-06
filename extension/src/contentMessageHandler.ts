/**
 * Enhanced Content Script Message Handler
 * Provides structured error responses for popup-content communication
 */

/**
 * Check for CAPTCHA on the page
 */
function detectCaptcha(): boolean {
  const captchaSelectors = [
    'iframe[src*="recaptcha"]',
    'iframe[src*="hcaptcha"]',
    '.g-recaptcha',
    '.h-captcha',
    '[data-sitekey]',
    '#recaptcha',
    '#hcaptcha',
    '[data-captcha]',
    'div[class*="captcha"]',
  ];

  for (const selector of captchaSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const style = window.getComputedStyle(element as HTMLElement);
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        console.log(`[CAPTCHA] Detected: ${selector}`);
        return true;
      }
    }
  }

  return false;
}

/**
 * Validate profile completeness
 */
function validateProfile(profile: any): { valid: boolean; missing: string[] } {
  const required = ['firstName', 'lastName', 'email', 'phone'];
  const missing: string[] = [];

  for (const field of required) {
    if (!profile || !profile[field] || profile[field].trim() === '') {
      missing.push(field);
    }
  }

  // Check for resume
  if (!profile?.resume || profile.resume.trim() === '') {
    missing.push('resume');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Check if form exists on page
 */
function checkFormExists(): boolean {
  // Look for common form indicators
  const formIndicators = [
    'form',
    'input[type="text"]',
    'input[type="email"]',
    'input[name*="name"]',
    'input[name*="email"]',
    '[class*="application"]',
    '[class*="job-apply"]',
    '[data-testid*="apply"]',
  ];

  for (const selector of formIndicators) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Enhanced message handler with structured error responses
 * Use this to replace the message listener in content.ts
 */
export function setupEnhancedMessageHandler(
  performAutoApply: (profile: any) => Promise<any>
) {
  chrome.runtime.onMessage.addListener(
    (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: any) => void
    ) => {
      console.log('[ContentScript] Message received:', message.action || message.type);

      switch (message.action || message.type) {
        case 'ping':
          // Health check - immediate response
          console.log('[ContentScript] Ping received - responding with pong');
          sendResponse({ status: 'pong' });
          return true;

        case 'autoApply':
        case 'AUTO_APPLY':
          // Auto-apply request - process asynchronously
          (async () => {
            try {
              console.log('[ContentScript] Auto-apply started');

              // 1. Validate profile
              const profileValidation = validateProfile(message.profile);
              if (!profileValidation.valid) {
                console.error('[ContentScript] Profile incomplete:', profileValidation.missing);
                sendResponse({
                  status: 'error',
                  error: 'PROFILE_INCOMPLETE',
                  message: 'Profile information is incomplete',
                  details: {
                    missing: profileValidation.missing,
                  },
                });
                return;
              }

              // 2. Check for CAPTCHA
              if (detectCaptcha()) {
                console.warn('[ContentScript] CAPTCHA detected on page');
                sendResponse({
                  status: 'error',
                  error: 'CAPTCHA_DETECTED',
                  message: 'CAPTCHA detected on this page',
                });
                return;
              }

              // 3. Check if form exists
              if (!checkFormExists()) {
                console.error('[ContentScript] No form found on page');
                sendResponse({
                  status: 'error',
                  error: 'FORM_NOT_FOUND',
                  message: 'No application form found on this page',
                });
                return;
              }

              // 4. Perform auto-apply
              console.log('[ContentScript] Executing auto-apply logic');
              const result = await performAutoApply(message.profile);

              // 5. Check result and send appropriate response
              if (result.status === 'success') {
                console.log('[ContentScript] Auto-apply succeeded');
                sendResponse({
                  status: 'success',
                  message: result.message || 'Application submitted successfully',
                  jobBoard: result.jobBoard,
                  session: result.session,
                  details: result.details,
                });
              } else {
                // If the auto-apply function returned an error, pass it through
                console.error('[ContentScript] Auto-apply failed:', result);

                // Map generic errors to specific error codes
                let errorCode = 'UNKNOWN_ERROR';
                if (result.message?.includes('form')) {
                  errorCode = 'FORM_NOT_FOUND';
                } else if (result.message?.includes('board')) {
                  errorCode = 'UNSUPPORTED_PLATFORM';
                } else if (result.message?.includes('ready')) {
                  errorCode = 'FORM_NOT_FOUND';
                }

                sendResponse({
                  status: 'error',
                  error: errorCode,
                  message: result.message || 'Auto-apply failed',
                  session: result.session,
                  details: result.details,
                });
              }
            } catch (error: any) {
              // Catch any unexpected errors
              console.error('[ContentScript] Unexpected error:', error);
              sendResponse({
                status: 'error',
                error: 'UNKNOWN_ERROR',
                message: error.message || 'An unexpected error occurred',
              });
            }
          })();

          // Return true to keep the message channel open for async response
          return true;

        case 'EXECUTE_JOB':
          // Handle job queue execution (from BackendJobService)
          (async () => {
            try {
              const { jobId, instructions } = message;
              console.log('[ContentScript] Executing queued job:', jobId);

              // Import and use JobExecutor if available
              if (typeof (window as any).JobExecutor !== 'undefined') {
                const executor = new (window as any).JobExecutor(jobId, instructions);
                const result = await executor.execute();
                sendResponse(result);
              } else {
                sendResponse({
                  status: 'error',
                  error: 'EXECUTOR_NOT_LOADED',
                  message: 'Job executor not available',
                });
              }
            } catch (error: any) {
              sendResponse({
                status: 'error',
                error: 'EXECUTION_FAILED',
                message: error.message,
              });
            }
          })();

          return true;

        default:
          console.warn('[ContentScript] Unknown message type:', message.action || message.type);
          sendResponse({
            status: 'error',
            error: 'UNKNOWN_MESSAGE_TYPE',
            message: `Unknown message type: ${message.action || message.type}`,
          });
          return true;
      }
    }
  );

  console.log('[ContentScript] Enhanced message handler registered');
}
