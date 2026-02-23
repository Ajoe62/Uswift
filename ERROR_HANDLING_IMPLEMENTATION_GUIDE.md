# Error Handling Implementation Guide

This guide explains how to implement robust error handling between the popup and content script to fix the "message port closed" and connection errors.

## Overview

The implementation creates a "contract" between the popup and content script:
- **Popup**: Expects specific error codes and displays user-friendly messages
- **Content Script**: Provides structured error responses with error codes

## Architecture

```
┌─────────────┐
│   Popup     │
│  (React)    │
└──────┬──────┘
       │
       │ 1. Ping (health check)
       ▼
┌─────────────┐      ┌──────────────────┐
│  Content    │─────▶│ Error Handler    │
│  Script     │      │ Utility          │
└──────┬──────┘      └──────────────────┘
       │
       │ 2. Structured Response
       │    { status, error, message }
       ▼
┌─────────────┐
│   Popup     │
│  Displays   │
│  Error      │
└─────────────┘
```

## Files Created

### 1. Error Handler Utility
**File**: `extension/src/utils/errorHandler.ts`

Provides:
- `getFriendlyErrorMessage(errorCode)` - Converts error codes to user messages
- `validateProfile(profile)` - Validates profile completeness
- `isRecoverableError(errorCode)` - Checks if error is recoverable
- `requiresUserAction(errorCode)` - Checks if error needs user action

**Error Codes**:
- `NO_ACTIVE_TAB` - No tab selected
- `CONTENT_SCRIPT_UNREACHABLE` - Cannot connect to page
- `FORM_NOT_FOUND` - No application form on page
- `CAPTCHA_DETECTED` - CAPTCHA blocking
- `PROFILE_INCOMPLETE` - Missing profile data
- `UNSUPPORTED_PLATFORM` - Job board not supported
- `RATE_LIMIT_EXCEEDED` - Too many applications
- `NETWORK_ERROR` - Backend connection failed
- `PERMISSION_DENIED` - Extension lacks permissions
- `TIMEOUT` - Operation timed out
- `UNKNOWN_ERROR` - Unexpected error

### 2. Content Script Message Handler
**File**: `extension/src/contentMessageHandler.ts`

Provides:
- Enhanced message listener with error codes
- CAPTCHA detection
- Profile validation
- Form existence check
- Structured error responses

### 3. Auto-Apply Hook
**File**: `extension/src/hooks/useAutoApply.ts`

Provides:
- React hook for auto-apply logic
- Centralized error handling
- Profile validation
- Ping/pong health check
- Timeout handling

## Integration Steps

### Step 1: Import Error Handler in Popup

In `Popup.tsx`, add the import:

```typescript
import { useAutoApply } from './hooks/useAutoApply';
```

### Step 2: Use the Hook in Popup Component

Replace the existing `handleAutoApply` and `autoStatus` with:

```typescript
export default function Popup() {
  const { user, signOut, isAuthenticated, loading, refreshAuth } = useAuth();

  // ... existing state ...

  // Replace handleAutoApply and autoStatus with:
  const { autoStatus, handleAutoApply, resetStatus } = useAutoApply(profile);

  // ... rest of component ...
}
```

### Step 3: Update Content Script

In `content.ts`, at the bottom where the message listener is, replace with:

```typescript
import { setupEnhancedMessageHandler } from './contentMessageHandler';

// Replace the existing chrome.runtime.onMessage.addListener with:
setupEnhancedMessageHandler(performAdvancedAutoApply);
```

**OR** if you prefer to keep content.ts self-contained, modify the existing listener:

```typescript
chrome.runtime.onMessage.addListener(
  async (message, sender, sendResponse) => {
    // Add ping handler
    if (message.action === 'ping') {
      sendResponse({ status: 'pong' });
      return true;
    }

    if (message.action === 'autoApply' || message.action === 'AUTO_APPLY') {
      (async () => {
        try {
          // 1. Validate profile
          if (!message.profile?.firstName || !message.profile?.lastName ||
              !message.profile?.email || !message.profile?.phone) {
            sendResponse({
              status: 'error',
              error: 'PROFILE_INCOMPLETE',
              message: 'Profile information is incomplete'
            });
            return;
          }

          // 2. Check for CAPTCHA
          if (document.querySelector('.g-recaptcha, [data-captcha]')) {
            sendResponse({
              status: 'error',
              error: 'CAPTCHA_DETECTED',
              message: 'CAPTCHA detected on this page'
            });
            return;
          }

          // 3. Check if form exists
          if (!document.querySelector('form')) {
            sendResponse({
              status: 'error',
              error: 'FORM_NOT_FOUND',
              message: 'No application form found'
            });
            return;
          }

          // 4. Perform auto-apply
          const result = await performAdvancedAutoApply(message.profile);

          if (result.status === 'success') {
            sendResponse({
              status: 'success',
              message: result.message,
              jobBoard: result.jobBoard,
              session: result.session
            });
          } else {
            // Map generic errors to error codes
            let errorCode = 'UNKNOWN_ERROR';
            if (result.message?.includes('form')) errorCode = 'FORM_NOT_FOUND';
            if (result.message?.includes('board')) errorCode = 'UNSUPPORTED_PLATFORM';

            sendResponse({
              status: 'error',
              error: errorCode,
              message: result.message
            });
          }
        } catch (error) {
          sendResponse({
            status: 'error',
            error: 'UNKNOWN_ERROR',
            message: error.message
          });
        }
      })();

      return true; // Keep channel open
    }
  }
);
```

### Step 4: Update Error Display UI

In `Popup.tsx`, update the error display section:

```typescript
{autoStatus.status === 'error' && (
  <div style={{
    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    padding: '16px',
    borderRadius: '12px',
    marginTop: '16px'
  }}>
    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>
      {autoStatus.message}
    </div>

    {autoStatus.details && (
      <div style={{ fontSize: '0.85rem', color: '#991b1b', marginTop: '8px' }}>
        {typeof autoStatus.details === 'string'
          ? autoStatus.details
          : autoStatus.details}
      </div>
    )}

    {autoStatus.troubleshooting && (
      <div style={{ marginTop: '12px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#991b1b', marginBottom: '6px' }}>
          Troubleshooting:
        </div>
        {autoStatus.troubleshooting.map((step, i) => (
          <div key={i} style={{ fontSize: '0.8rem', color: '#b91c1c', marginBottom: '4px' }}>
            {step}
          </div>
        ))}
      </div>
    )}

    {autoStatus.code && (
      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '12px' }}>
        Error Code: {autoStatus.code}
      </div>
    )}
  </div>
)}
```

## Testing

### Test 1: Happy Path (Success)

1. Navigate to a supported job page (LinkedIn, Greenhouse)
2. Fill out your profile
3. Click "Auto-Apply"
4. Should see success message

### Test 2: Missing Profile

1. Clear your profile (remove email)
2. Click "Auto-Apply"
3. Should see: "Profile information missing" with required fields listed

### Test 3: No Content Script

1. Navigate to chrome://settings (protected page)
2. Click "Auto-Apply"
3. Should see: "Cannot connect to this page" with troubleshooting steps

### Test 4: Form Not Found

1. Navigate to google.com
2. Click "Auto-Apply"
3. Should see: "Application form not found"

### Test 5: CAPTCHA Detected

1. Navigate to a page with visible CAPTCHA
2. Click "Auto-Apply"
3. Should see: "CAPTCHA detected" message

## Error Flow Diagram

```
User Click "Auto-Apply"
         │
         ▼
   Validate Profile
         │
    ┌────┴────┐
    │ Valid?  │
    └────┬────┘
         │ No → Show PROFILE_INCOMPLETE error
         │
         ▼ Yes
    Ping Content Script
         │
    ┌────┴────┐
    │ Pong?   │
    └────┬────┘
         │ No → Show CONTENT_SCRIPT_UNREACHABLE error
         │
         ▼ Yes
  Send autoApply Message
         │
         ▼
  Content Script Checks:
    - Profile Complete?
    - CAPTCHA Present?
    - Form Exists?
         │
    ┌────┴────┐
    │ All OK? │
    └────┬────┘
         │ No → Send Error Code
         │
         ▼ Yes
   Perform Auto-Apply
         │
    ┌────┴────┐
    │Success? │
    └────┬────┘
         │
         ▼
  Show Result to User
```

## Common Issues & Solutions

### Issue: "Timeout" Error

**Cause**: Page is slow or content script is busy

**Solution**:
- Increase timeout in `useAutoApply.ts` (line with `setTimeout`)
- Currently set to 30 seconds for auto-apply, 5 seconds for ping

### Issue: Still Getting "Port Closed" Error

**Cause**: Content script not returning `true` from message listener

**Solution**:
- Ensure `return true;` is at the end of each message case
- Wrap async logic in IIFE: `(async () => { ... })()`

### Issue: Error Messages Not Showing

**Cause**: Error code not recognized

**Solution**:
- Check `errorHandler.ts` has the error code
- Add new error code to switch statement
- Verify content script is sending correct error code

## Best Practices

1. **Always return `true`** from message listeners for async responses
2. **Validate early** - Check profile, CAPTCHA, form before processing
3. **Use specific error codes** - Don't use generic "error" messages
4. **Include troubleshooting** - Help users fix issues themselves
5. **Log everything** - Console logs help debugging
6. **Timeout handling** - Don't let operations hang forever
7. **Graceful degradation** - Provide useful info even when failing

## Debugging

### Enable Verbose Logging

In `errorHandler.ts`, add:

```typescript
export const DEBUG = true;

export function log(...args: any[]) {
  if (DEBUG) {
    console.log('[ErrorHandler]', ...args);
  }
}
```

### Check Message Flow

In content script:

```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[ContentScript] Received:', message);
  // ... handle message ...
  console.log('[ContentScript] Responding with:', response);
  sendResponse(response);
  return true;
});
```

In popup:

```typescript
const handleAutoApply = async () => {
  console.log('[Popup] Sending message:', { action: 'autoApply', profile });
  const response = await sendMessage(...);
  console.log('[Popup] Received response:', response);
};
```

## Migration Notes

If migrating from old error handling:

1. **Backup** current `Popup.tsx` and `content.ts`
2. **Replace** `handleAutoApply` with hook version
3. **Update** content script message listener
4. **Test** all error scenarios
5. **Remove** old error handling code
6. **Deploy** and monitor for issues

## Support

For issues or questions:
- Check browser console for error logs
- Review `EXTENSION_TROUBLESHOOTING.md`
- Test with `chrome://extensions/` → Inspect views: service worker
- Check Network tab in DevTools

## Summary

This implementation provides:
- ✅ Structured error responses with error codes
- ✅ User-friendly error messages
- ✅ Troubleshooting steps for each error
- ✅ Profile validation before execution
- ✅ CAPTCHA detection
- ✅ Ping/pong health check
- ✅ Timeout handling
- ✅ Centralized error handling
- ✅ Easy to extend with new error codes
