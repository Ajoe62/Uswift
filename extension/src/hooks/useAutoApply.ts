/**
 * useAutoApply Hook
 * Robust auto-apply handler with structured error handling
 */

import { useState, useCallback } from 'react';
import { getFriendlyErrorMessage, validateProfile } from '../utils/errorHandler';
import { getTabWithContentScript } from '../utils/contentScriptInjector';

export interface AutoApplyStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  message: string;
  details?: string | string[];
  jobBoard?: string;
  session?: any;
  code?: string;
  troubleshooting?: string[];
}

export interface UseAutoApplyReturn {
  autoStatus: AutoApplyStatus;
  handleAutoApply: () => Promise<void>;
  resetStatus: () => void;
}

export function useAutoApply(profile: any): UseAutoApplyReturn {
  const [autoStatus, setAutoStatus] = useState<AutoApplyStatus>({
    status: 'idle',
    message: '',
  });

  const resetStatus = useCallback(() => {
    setAutoStatus({ status: 'idle', message: '' });
  }, []);

  const handleAutoApply = useCallback(async () => {
    console.log('[useAutoApply] Starting auto-apply process');
    setAutoStatus({ status: 'pending', message: 'Starting auto-apply...' });

    try {
      // Step 1: Validate profile locally first
      const profileValidation = validateProfile(profile);
      if (!profileValidation.valid) {
        console.error('[useAutoApply] Profile incomplete:', profileValidation.missing);
        const errorResponse = getFriendlyErrorMessage('PROFILE_INCOMPLETE');
        setAutoStatus({
          status: 'error',
          ...errorResponse,
        });
        return;
      }

      // Step 2: Get active tab and ensure content script is loaded
      console.log('[useAutoApply] Getting tab and ensuring content script is loaded...');
      setAutoStatus({ status: 'pending', message: 'Connecting to page...' });

      const tabResult = await getTabWithContentScript();

      if (!tabResult.success) {
        console.error('[useAutoApply] Failed to get tab with content script:', tabResult.error);
        const errorResponse = getFriendlyErrorMessage(tabResult.error || 'CONTENT_SCRIPT_UNREACHABLE');
        setAutoStatus({
          status: 'error',
          ...errorResponse,
        });
        return;
      }

      const tab = tabResult.tab!;
      console.log('[useAutoApply] Content script is ready on tab:', tab.id);

      // Step 4: Send auto-apply command
      console.log('[useAutoApply] Sending auto-apply command...');
      setAutoStatus({ status: 'pending', message: 'Analyzing page...' });

      const response = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('TIMEOUT'));
        }, 30000); // 30 second timeout for auto-apply

        chrome.tabs.sendMessage(
          tab.id!,
          { action: 'autoApply', profile },
          (response: any) => {
            clearTimeout(timeout);

            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          }
        );
      });

      // Step 5: Process response
      if (!response) {
        throw new Error('No response from content script');
      }

      if (response.status === 'success') {
        console.log('[useAutoApply] Auto-apply succeeded');
        setAutoStatus({
          status: 'success',
          message:
            response.message ||
            `Successfully applied on ${response.jobBoard || 'site'}`,
          jobBoard: response.jobBoard,
          session: response.session,
        });
      } else {
        // Handle error response from content script
        console.error('[useAutoApply] Auto-apply failed:', response);
        const errorCode = response.error || 'UNKNOWN_ERROR';
        const errorResponse = getFriendlyErrorMessage(errorCode);

        setAutoStatus({
          status: 'error',
          message: response.message || errorResponse.message,
          details: errorResponse.details,
          troubleshooting: errorResponse.troubleshooting,
          code: errorResponse.code,
          session: response.session,
        });
      }
    } catch (error: any) {
      console.error('[useAutoApply] Unexpected error:', error);

      // Process the error and get user-friendly message
      const errorResponse = getFriendlyErrorMessage(
        error.message || 'UNKNOWN_ERROR'
      );

      setAutoStatus({
        status: 'error',
        ...errorResponse,
      });
    }
  }, [profile]);

  return {
    autoStatus,
    handleAutoApply,
    resetStatus,
  };
}
