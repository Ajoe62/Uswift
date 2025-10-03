/**
 * Error Handling Utilities
 * Decorators and helpers for consistent error handling
 */

import { errorTracker, ErrorContext, ErrorSeverity } from "../services/ErrorTracker";

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      errorTracker.captureException(error as Error, context);
      throw error;
    }
  }) as T;
}

/**
 * Wrap async function with error handling and return result object
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context?: ErrorContext
): Promise<{ data?: T; error?: Error }> {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    errorTracker.captureException(error as Error, context);
    return { error: error as Error };
  }
}

/**
 * Wrap sync function with error handling
 */
export function safe<T>(
  fn: () => T,
  context?: ErrorContext
): { data?: T; error?: Error } {
  try {
    const data = fn();
    return { data };
  } catch (error) {
    errorTracker.captureException(error as Error, context);
    return { error: error as Error };
  }
}

/**
 * Retry async function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    onRetry?: (attempt: number, error: Error) => void;
    context?: ErrorContext;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
    context,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Log retry attempt
      errorTracker.addBreadcrumb(`Retry attempt ${attempt + 1}/${maxRetries}`, {
        error: lastError.message,
        delay,
      });

      // Call onRetry callback
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay for next attempt
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  // All retries failed, capture error
  errorTracker.captureException(lastError!, {
    ...context,
    tags: {
      ...context?.tags,
      retries: String(maxRetries),
      final_attempt: "true",
    },
  });

  throw lastError!;
}

/**
 * Timeout wrapper for promises
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: string
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(timeoutError || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle!);
    throw error;
  }
}

/**
 * Debounced error reporter
 * Prevents flooding error tracker with duplicate errors
 */
export class DebouncedErrorReporter {
  private errorCounts: Map<string, { count: number; firstSeen: number }> = new Map();
  private reportThreshold = 5; // Report after N occurrences
  private timeWindow = 60000; // 1 minute window

  report(error: Error | string, context?: ErrorContext, severity?: ErrorSeverity): void {
    const errorKey = this.getErrorKey(error, context);
    const now = Date.now();

    const existing = this.errorCounts.get(errorKey);

    if (existing) {
      // Check if still in time window
      if (now - existing.firstSeen < this.timeWindow) {
        existing.count++;

        // Report when threshold is reached
        if (existing.count === this.reportThreshold) {
          errorTracker.captureException(error, {
            ...context,
            tags: {
              ...context?.tags,
              debounced: "true",
              occurrences: String(existing.count),
            },
          });
        }
      } else {
        // Time window expired, reset counter
        this.errorCounts.set(errorKey, { count: 1, firstSeen: now });
        errorTracker.captureException(error, context, severity);
      }
    } else {
      // First occurrence
      this.errorCounts.set(errorKey, { count: 1, firstSeen: now });
      errorTracker.captureException(error, context, severity);
    }

    // Cleanup old entries
    this.cleanup();
  }

  private getErrorKey(error: Error | string, context?: ErrorContext): string {
    const message = error instanceof Error ? error.message : error;
    const component = context?.component || "unknown";
    return `${component}:${message}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.errorCounts.entries()) {
      if (now - value.firstSeen > this.timeWindow) {
        this.errorCounts.delete(key);
      }
    }
  }
}

/**
 * Create error with context
 */
export class ContextualError extends Error {
  public context?: ErrorContext;

  constructor(message: string, context?: ErrorContext) {
    super(message);
    this.name = "ContextualError";
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, ContextualError);
    }
  }
}

/**
 * Assert with error tracking
 */
export function assert(condition: boolean, message: string, context?: ErrorContext): asserts condition {
  if (!condition) {
    const error = new ContextualError(message, context);
    errorTracker.captureException(error, context, "error");
    throw error;
  }
}

/**
 * Log and track performance issues
 */
export function trackPerformance(name: string, threshold: number): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - start;

        if (duration > threshold) {
          errorTracker.captureMessage(
            `Performance issue: ${name} took ${duration.toFixed(2)}ms`,
            {
              component: target.constructor.name,
              action: String(propertyKey),
              tags: {
                type: "performance",
                threshold: String(threshold),
              },
              extra: {
                duration,
                name,
              },
            },
            "warning"
          );
        }

        return result;
      } catch (error) {
        errorTracker.captureException(error as Error, {
          component: target.constructor.name,
          action: String(propertyKey),
        });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Global error handler for Chrome extension
 */
export function initializeExtensionErrorHandling(): void {
  // Log extension errors
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "ERROR_REPORT") {
      errorTracker.captureException(message.error, {
        component: message.component,
        tags: {
          source: "content_script",
          tabId: sender.tab?.id ? String(sender.tab.id) : "unknown",
        },
        extra: message.extra,
      });
    }
  });

  // Track successful operations for context
  errorTracker.addBreadcrumb("Extension initialized", {
    version: chrome.runtime.getManifest().version,
  });
}

// Export singleton debounced reporter
export const debouncedErrorReporter = new DebouncedErrorReporter();
