/**
 * Error Handler Utility
 * Centralized error handling for popup-content script communication
 */

export interface ErrorResponse {
  message: string;
  details?: string | string[];
  code?: string;
  troubleshooting?: string[];
}

export type ErrorCode =
  | 'NO_ACTIVE_TAB'
  | 'CONTENT_SCRIPT_UNREACHABLE'
  | 'FORM_NOT_FOUND'
  | 'CAPTCHA_DETECTED'
  | 'PROFILE_INCOMPLETE'
  | 'UNSUPPORTED_PLATFORM'
  | 'RATE_LIMIT_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'PERMISSION_DENIED'
  | 'TIMEOUT'
  | 'PROTECTED_PAGE'
  | 'CONTENT_SCRIPT_INJECTION_FAILED'
  | 'INJECTION_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Get user-friendly error message from error code
 */
export function getFriendlyErrorMessage(errorCode: string): ErrorResponse {
  console.error('[ErrorHandler] Processing error code:', errorCode);

  // Handle standard error codes
  switch (errorCode as ErrorCode) {
    case 'NO_ACTIVE_TAB':
      return {
        code: errorCode,
        message: 'No active tab found',
        details: 'Please navigate to a job page and try again.',
      };

    case 'CONTENT_SCRIPT_UNREACHABLE':
      return {
        code: errorCode,
        message: 'Cannot connect to this page',
        details: 'The extension cannot access this page. Please try the following:',
        troubleshooting: [
          '🔄 Refresh the page (Ctrl+R or F5)',
          '🔧 Reload the extension at chrome://extensions/',
          '🚫 Check if the site allows extensions (some sites block them)',
          '🔍 Try opening the job page in a new tab',
        ],
      };

    case 'FORM_NOT_FOUND':
      return {
        code: errorCode,
        message: 'Application form not found',
        details: 'Make sure you are on the job application page, not just the job listing.',
        troubleshooting: [
          '📍 Navigate to the actual application form',
          '✋ Click "Apply" or "Easy Apply" button first',
          '🎯 Wait for the form to fully load',
        ],
      };

    case 'CAPTCHA_DETECTED':
      return {
        code: errorCode,
        message: 'CAPTCHA detected',
        details: 'Please solve the CAPTCHA manually before using auto-apply.',
        troubleshooting: [
          '✋ Complete the CAPTCHA verification',
          '⏳ Wait a few seconds after solving',
          '🔄 Try auto-apply again',
        ],
      };

    case 'PROFILE_INCOMPLETE':
      return {
        code: errorCode,
        message: 'Profile information missing',
        details: 'Your profile is incomplete. Please add the following:',
        troubleshooting: [
          '📝 First Name and Last Name',
          '📧 Email Address',
          '📱 Phone Number',
          '📄 Resume (PDF or DOCX)',
        ],
      };

    case 'UNSUPPORTED_PLATFORM':
      return {
        code: errorCode,
        message: 'Job board not supported',
        details: 'This job board is not yet supported for auto-apply.',
        troubleshooting: [
          '✅ Supported: LinkedIn, Greenhouse, Lever, Workday, Indeed, SmartRecruiters',
          '📧 Request support: support@uswift.app',
          '✋ Manual application recommended',
        ],
      };

    case 'RATE_LIMIT_EXCEEDED':
      return {
        code: errorCode,
        message: 'Rate limit exceeded',
        details: 'You have reached the maximum number of applications for this period.',
        troubleshooting: [
          '⏰ Hourly limit: 10 applications per company',
          '📅 Daily limit: 50 applications total',
          '⏳ Wait for the limit to reset',
        ],
      };

    case 'NETWORK_ERROR':
      return {
        code: errorCode,
        message: 'Network error',
        details: 'Unable to connect to the backend server.',
        troubleshooting: [
          '🌐 Check your internet connection',
          '🔧 Verify backend is running (if local)',
          '🔄 Try again in a few moments',
        ],
      };

    case 'PERMISSION_DENIED':
      return {
        code: errorCode,
        message: 'Permission denied',
        details: 'The extension does not have permission to access this site.',
        troubleshooting: [
          '⚙️ Go to chrome://extensions/',
          '🔍 Find Uswift extension',
          '🔓 Ensure "On all sites" permission is enabled',
        ],
      };

    case 'TIMEOUT':
      return {
        code: errorCode,
        message: 'Operation timed out',
        details: 'The page took too long to respond.',
        troubleshooting: [
          '⏳ The page may be slow - wait and try again',
          '🔄 Refresh the page',
          '🚀 Check page is fully loaded before applying',
        ],
      };

    case 'PROTECTED_PAGE':
      return {
        code: errorCode,
        message: 'Cannot access this page',
        details: 'This is a protected browser page (chrome://, edge://, etc.)',
        troubleshooting: [
          '🚫 Chrome extension pages cannot be accessed',
          '🌐 Navigate to an actual web page',
          '🎯 Go to a job posting website',
        ],
      };

    case 'CONTENT_SCRIPT_INJECTION_FAILED':
      return {
        code: errorCode,
        message: 'Failed to load extension on page',
        details: 'The extension could not be activated on this page.',
        troubleshooting: [
          '🔄 Refresh the page (Ctrl+R)',
          '🔧 Reload extension at chrome://extensions/',
          '🚫 Some sites block extensions - try a different site',
          '📋 Check browser console (F12) for errors',
        ],
      };

    case 'INJECTION_ERROR':
      return {
        code: errorCode,
        message: 'Extension injection error',
        details: 'Failed to inject content script into the page.',
        troubleshooting: [
          '🔄 Refresh the page',
          '⚙️ Check extension permissions',
          '🔧 Reload the extension',
        ],
      };

    default:
      // Handle special error message patterns
      if (errorCode.includes('message port closed')) {
        return {
          code: 'PORT_CLOSED',
          message: 'Connection to page was lost',
          details: 'This can happen on complex pages or during navigation.',
          troubleshooting: [
            '🔄 Refresh the page',
            '⏳ Wait for page to fully load',
            '🔧 Reload the extension',
          ],
        };
      }

      if (errorCode.includes('Receiving end does not exist')) {
        return {
          code: 'CONTENT_SCRIPT_MISSING',
          message: 'Content script not loaded',
          details: 'The extension script is not active on this page.',
          troubleshooting: [
            '🔄 Refresh the page (Ctrl+R)',
            '🔧 Reload extension at chrome://extensions/',
            '🚫 Check if site allows extensions',
          ],
        };
      }

      if (errorCode.includes('Could not establish connection')) {
        return {
          code: 'CONNECTION_FAILED',
          message: 'Cannot connect to page',
          details: 'Unable to establish connection with the page.',
          troubleshooting: [
            '🔄 Refresh the page',
            '🔧 Reload the extension',
            '🔍 Try in a new tab',
          ],
        };
      }

      // Unknown error
      return {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        details: errorCode || 'No error details available',
        troubleshooting: [
          '🔄 Try refreshing the page',
          '🔧 Reload the extension',
          '📋 Check browser console (F12) for details',
          '💬 Contact support if issue persists',
        ],
      };
  }
}

/**
 * Validate profile completeness for auto-apply
 */
export function validateProfile(profile: any): { valid: boolean; missing: string[] } {
  const required = ['firstName', 'lastName', 'email', 'phone', 'resume'];
  const missing: string[] = [];

  for (const field of required) {
    if (!profile[field] || profile[field].trim() === '') {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Check if error is recoverable (user can retry)
 */
export function isRecoverableError(errorCode: string): boolean {
  const recoverableErrors = [
    'CONTENT_SCRIPT_UNREACHABLE',
    'NETWORK_ERROR',
    'TIMEOUT',
    'PORT_CLOSED',
    'CONTENT_SCRIPT_MISSING',
    'CONNECTION_FAILED',
  ];

  return recoverableErrors.some((code) => errorCode.includes(code));
}

/**
 * Check if error requires user action
 */
export function requiresUserAction(errorCode: string): boolean {
  const actionRequiredErrors = [
    'CAPTCHA_DETECTED',
    'PROFILE_INCOMPLETE',
    'PERMISSION_DENIED',
    'FORM_NOT_FOUND',
  ];

  return actionRequiredErrors.some((code) => errorCode.includes(code));
}
