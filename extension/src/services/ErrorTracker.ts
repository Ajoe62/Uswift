/**
 * Centralized Error Tracking Service
 * Supports Sentry integration + local logging fallback
 */

export type ErrorSeverity = "fatal" | "error" | "warning" | "info" | "debug";

export interface ErrorContext {
  user?: {
    id?: string;
    email?: string;
  };
  platform?: string;
  jobUrl?: string;
  feature?: string;
  component?: string;
  action?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  timestamp: string;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context?: ErrorContext;
  fingerprint?: string[];
}

export interface ErrorTrackerConfig {
  enabled: boolean;
  sentryDsn?: string;
  environment: "development" | "production" | "staging";
  debug: boolean;
  sampleRate: number;
  maxBreadcrumbs: number;
  enableLocalStorage: boolean;
}

class ErrorTrackerService {
  private static instance: ErrorTrackerService;
  private config: ErrorTrackerConfig;
  private breadcrumbs: Array<{ timestamp: string; message: string; data?: any }> = [];
  private sentryInitialized: boolean = false;
  private errorQueue: ErrorReport[] = [];

  private constructor(config: Partial<ErrorTrackerConfig> = {}) {
    this.config = {
      enabled: true,
      environment: (import.meta.env?.MODE as any) || "production",
      debug: import.meta.env?.VITE_DEBUG_MODE === "true" || false,
      sampleRate: 1.0,
      maxBreadcrumbs: 50,
      enableLocalStorage: true,
      ...config,
    };

    if (this.config.enabled) {
      this.initializeSentry();
      this.setupGlobalErrorHandlers();
    }
  }

  public static getInstance(config?: Partial<ErrorTrackerConfig>): ErrorTrackerService {
    if (!ErrorTrackerService.instance) {
      ErrorTrackerService.instance = new ErrorTrackerService(config);
    }
    return ErrorTrackerService.instance;
  }

  /**
   * Initialize Sentry if DSN is available
   */
  private initializeSentry(): void {
    const dsn = import.meta.env?.VITE_SENTRY_DSN || this.config.sentryDsn;

    if (!dsn) {
      this.log("info", "Sentry DSN not configured. Using local error tracking only.");
      return;
    }

    try {
      // Check if Sentry is available (would be loaded from CDN or npm)
      if (typeof (window as any).Sentry !== "undefined") {
        const Sentry = (window as any).Sentry;

        Sentry.init({
          dsn,
          environment: this.config.environment,
          debug: this.config.debug,
          sampleRate: this.config.sampleRate,
          maxBreadcrumbs: this.config.maxBreadcrumbs,
          beforeSend: (event: any, hint: any) => {
            // Filter out known non-critical errors
            if (this.shouldIgnoreError(event, hint)) {
              return null;
            }
            return event;
          },
        });

        this.sentryInitialized = true;
        this.log("info", "✅ Sentry initialized successfully");

        // Flush any queued errors
        this.flushErrorQueue();
      } else {
        this.log("warning", "Sentry SDK not loaded. Install @sentry/browser for full tracking.");
      }
    } catch (error) {
      this.log("error", "Failed to initialize Sentry:", error);
    }
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.captureException(event.reason, {
        tags: { type: "unhandled_rejection" },
      });
    });

    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      this.captureException(event.error || event.message, {
        tags: { type: "uncaught_error" },
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    this.log("info", "✅ Global error handlers registered");
  }

  /**
   * Capture an exception
   */
  public captureException(
    error: Error | string,
    context?: ErrorContext,
    severity: ErrorSeverity = "error"
  ): string {
    const errorReport = this.createErrorReport(error, context, severity);

    // Log to console in debug mode
    if (this.config.debug) {
      console.error(
        `[ErrorTracker] ${severity.toUpperCase()}:`,
        errorReport.message,
        errorReport.context
      );
      if (errorReport.stack) {
        console.error("Stack:", errorReport.stack);
      }
    }

    // Send to Sentry if available
    if (this.sentryInitialized && typeof (window as any).Sentry !== "undefined") {
      const Sentry = (window as any).Sentry;

      // Set context
      if (context?.user) {
        Sentry.setUser(context.user);
      }
      if (context?.tags) {
        Sentry.setTags(context.tags);
      }
      if (context) {
        Sentry.setContext("errorContext", context);
      }

      // Capture exception
      const eventId = Sentry.captureException(
        error instanceof Error ? error : new Error(String(error)),
        {
          level: severity,
          fingerprint: errorReport.fingerprint,
        }
      );

      errorReport.id = eventId;
    } else {
      // Queue for later if Sentry not ready
      this.errorQueue.push(errorReport);
    }

    // Save to local storage
    if (this.config.enableLocalStorage) {
      this.saveToLocalStorage(errorReport);
    }

    return errorReport.id;
  }

  /**
   * Capture a message
   */
  public captureMessage(
    message: string,
    context?: ErrorContext,
    severity: ErrorSeverity = "info"
  ): string {
    const errorReport = this.createErrorReport(message, context, severity);

    if (this.config.debug) {
      console.log(`[ErrorTracker] ${severity.toUpperCase()}:`, message, context);
    }

    if (this.sentryInitialized && typeof (window as any).Sentry !== "undefined") {
      const Sentry = (window as any).Sentry;

      if (context?.tags) {
        Sentry.setTags(context.tags);
      }
      if (context) {
        Sentry.setContext("messageContext", context);
      }

      const eventId = Sentry.captureMessage(message, severity);
      errorReport.id = eventId;
    }

    if (this.config.enableLocalStorage) {
      this.saveToLocalStorage(errorReport);
    }

    return errorReport.id;
  }

  /**
   * Add breadcrumb for debugging context
   */
  public addBreadcrumb(message: string, data?: any): void {
    const breadcrumb = {
      timestamp: new Date().toISOString(),
      message,
      data,
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only last N breadcrumbs
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }

    // Send to Sentry
    if (this.sentryInitialized && typeof (window as any).Sentry !== "undefined") {
      (window as any).Sentry.addBreadcrumb({
        message,
        data,
        timestamp: Date.now() / 1000,
      });
    }

    if (this.config.debug) {
      console.log(`[ErrorTracker] Breadcrumb:`, message, data);
    }
  }

  /**
   * Set user context
   */
  public setUser(user: { id?: string; email?: string; username?: string }): void {
    if (this.sentryInitialized && typeof (window as any).Sentry !== "undefined") {
      (window as any).Sentry.setUser(user);
    }

    if (this.config.debug) {
      console.log("[ErrorTracker] User set:", user);
    }
  }

  /**
   * Clear user context
   */
  public clearUser(): void {
    if (this.sentryInitialized && typeof (window as any).Sentry !== "undefined") {
      (window as any).Sentry.setUser(null);
    }
  }

  /**
   * Set custom tags
   */
  public setTags(tags: Record<string, string>): void {
    if (this.sentryInitialized && typeof (window as any).Sentry !== "undefined") {
      (window as any).Sentry.setTags(tags);
    }
  }

  /**
   * Get recent breadcrumbs
   */
  public getBreadcrumbs(): Array<{ timestamp: string; message: string; data?: any }> {
    return [...this.breadcrumbs];
  }

  /**
   * Get recent errors from local storage
   */
  public getRecentErrors(limit: number = 10): ErrorReport[] {
    if (!this.config.enableLocalStorage) {
      return [];
    }

    try {
      const stored = localStorage.getItem("uswift_error_reports");
      if (!stored) return [];

      const errors: ErrorReport[] = JSON.parse(stored);
      return errors.slice(-limit);
    } catch (error) {
      console.error("Failed to get recent errors:", error);
      return [];
    }
  }

  /**
   * Clear error history
   */
  public clearErrorHistory(): void {
    try {
      localStorage.removeItem("uswift_error_reports");
      this.breadcrumbs = [];
      this.errorQueue = [];
    } catch (error) {
      console.error("Failed to clear error history:", error);
    }
  }

  /**
   * Create error report object
   */
  private createErrorReport(
    error: Error | string,
    context?: ErrorContext,
    severity: ErrorSeverity = "error"
  ): ErrorReport {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const message = errorObj.message || String(error);

    // Create fingerprint for grouping similar errors
    const fingerprint = this.createFingerprint(message, context);

    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      severity,
      message,
      stack: errorObj.stack,
      context,
      fingerprint,
    };
  }

  /**
   * Create fingerprint for error grouping
   */
  private createFingerprint(message: string, context?: ErrorContext): string[] {
    const parts: string[] = ["uswift"];

    if (context?.component) {
      parts.push(context.component);
    }
    if (context?.action) {
      parts.push(context.action);
    }

    // Normalize message for grouping
    const normalizedMessage = message
      .replace(/\d+/g, "N") // Replace numbers
      .replace(/['"]/g, "") // Remove quotes
      .substring(0, 100);

    parts.push(normalizedMessage);

    return parts;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Check if error should be ignored
   */
  private shouldIgnoreError(event: any, hint: any): boolean {
    const message = event.message || "";

    // Ignore known non-critical errors
    const ignorePatterns = [
      /Loading chunk \d+ failed/i,
      /ResizeObserver loop limit exceeded/i,
      /Extension context invalidated/i,
    ];

    return ignorePatterns.some((pattern) => pattern.test(message));
  }

  /**
   * Flush queued errors to Sentry
   */
  private flushErrorQueue(): void {
    if (this.errorQueue.length === 0) return;

    this.log("info", `Flushing ${this.errorQueue.length} queued errors to Sentry`);

    this.errorQueue.forEach((report) => {
      if (typeof (window as any).Sentry !== "undefined") {
        (window as any).Sentry.captureException(new Error(report.message), {
          level: report.severity,
          contexts: { errorReport: report },
        });
      }
    });

    this.errorQueue = [];
  }

  /**
   * Save error to local storage
   */
  private saveToLocalStorage(report: ErrorReport): void {
    try {
      const stored = localStorage.getItem("uswift_error_reports");
      const errors: ErrorReport[] = stored ? JSON.parse(stored) : [];

      errors.push(report);

      // Keep only last 100 errors
      if (errors.length > 100) {
        errors.shift();
      }

      localStorage.setItem("uswift_error_reports", JSON.stringify(errors));
    } catch (error) {
      console.error("Failed to save error to localStorage:", error);
    }
  }

  /**
   * Internal logging
   */
  private log(level: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[ErrorTracker:${level}]`, ...args);
    }
  }
}

// Export singleton instance
export const errorTracker = ErrorTrackerService.getInstance();

// Convenience functions
export function captureException(
  error: Error | string,
  context?: ErrorContext,
  severity?: ErrorSeverity
): string {
  return errorTracker.captureException(error, context, severity);
}

export function captureMessage(
  message: string,
  context?: ErrorContext,
  severity?: ErrorSeverity
): string {
  return errorTracker.captureMessage(message, context, severity);
}

export function addBreadcrumb(message: string, data?: any): void {
  errorTracker.addBreadcrumb(message, data);
}

export function setUser(user: { id?: string; email?: string; username?: string }): void {
  errorTracker.setUser(user);
}

export function clearUser(): void {
  errorTracker.clearUser();
}

export function setTags(tags: Record<string, string>): void {
  errorTracker.setTags(tags);
}
