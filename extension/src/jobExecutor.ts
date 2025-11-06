/**
 * Job Executor - Content Script Module
 * Handles secure execution of LLM-generated job application instructions
 * with safety checks, consent UI, and CAPTCHA detection
 */

interface JobInstructions {
  platform: string;
  formType: string;
  fields: Array<{
    name: string;
    selector: string;
    value: string;
    type: string;
    required: boolean;
  }>;
  fileUploads: Array<{
    name: string;
    selector: string;
    required: boolean;
  }>;
  actions: Array<{
    type: string;
    order: number;
    requiresConsent?: boolean;
    selector?: string;
  }>;
  safetyChecks: {
    detectCaptcha: boolean;
    requirePreviewConsent: boolean;
    requireSubmitConsent: boolean;
    validateFieldsFilled: boolean;
  };
}

interface ExecutionResult {
  success: boolean;
  status: 'completed' | 'failed' | 'awaiting_captcha' | 'awaiting_consent';
  message: string;
  filledFields?: number;
  errors?: string[];
  captchaDetected?: boolean;
}

export class JobExecutor {
  private jobId: string;
  private instructions: JobInstructions;
  private consentGranted: boolean = false;
  private previewShown: boolean = false;

  constructor(jobId: string, instructions: JobInstructions) {
    this.jobId = jobId;
    this.instructions = instructions;
  }

  /**
   * Execute the job application
   */
  async execute(): Promise<ExecutionResult> {
    console.log(`[JobExecutor] Starting execution for job ${this.jobId}`);

    try {
      // Step 1: Detect CAPTCHA if required
      if (this.instructions.safetyChecks.detectCaptcha) {
        const captchaDetected = this.detectCaptcha();
        if (captchaDetected) {
          console.warn('[JobExecutor] CAPTCHA detected, aborting');
          this.notifyBackend('captcha_detected');
          return {
            success: false,
            status: 'awaiting_captcha',
            message: 'CAPTCHA detected. Please solve it manually.',
            captchaDetected: true,
          };
        }
      }

      // Step 2: Fill form fields
      console.log('[JobExecutor] Filling form fields...');
      const fillResult = await this.fillFields();

      if (!fillResult.success) {
        return {
          success: false,
          status: 'failed',
          message: 'Failed to fill form fields',
          errors: fillResult.errors,
        };
      }

      // Step 3: Upload files
      console.log('[JobExecutor] Uploading files...');
      const uploadResult = await this.uploadFiles();

      if (!uploadResult.success) {
        return {
          success: false,
          status: 'failed',
          message: 'Failed to upload files',
          errors: uploadResult.errors,
        };
      }

      // Step 4: Show preview if required
      if (this.instructions.safetyChecks.requirePreviewConsent) {
        console.log('[JobExecutor] Showing preview and requesting consent...');
        const previewConsent = await this.showPreviewAndRequestConsent();

        if (!previewConsent) {
          return {
            success: false,
            status: 'awaiting_consent',
            message: 'Awaiting user consent to submit',
          };
        }
      }

      // Step 5: Validate fields if required
      if (this.instructions.safetyChecks.validateFieldsFilled) {
        const validationResult = this.validateFields();
        if (!validationResult.valid) {
          return {
            success: false,
            status: 'failed',
            message: 'Field validation failed',
            errors: validationResult.errors,
          };
        }
      }

      // Step 6: Submit if consent granted
      if (this.instructions.safetyChecks.requireSubmitConsent && !this.consentGranted) {
        const submitConsent = await this.requestSubmitConsent();

        if (!submitConsent) {
          return {
            success: false,
            status: 'awaiting_consent',
            message: 'Awaiting user consent to submit',
          };
        }
      }

      // Step 7: Submit the form
      console.log('[JobExecutor] Submitting form...');
      const submitResult = await this.submitForm();

      if (submitResult.success) {
        this.notifyBackend('completed');
        return {
          success: true,
          status: 'completed',
          message: 'Application submitted successfully',
          filledFields: fillResult.filledCount,
        };
      } else {
        return {
          success: false,
          status: 'failed',
          message: 'Failed to submit form',
          errors: submitResult.errors,
        };
      }
    } catch (error: any) {
      console.error('[JobExecutor] Execution error:', error);
      this.notifyBackend('failed', error.message);
      return {
        success: false,
        status: 'failed',
        message: error.message,
        errors: [error.message],
      };
    }
  }

  /**
   * Detect CAPTCHA on the page
   */
  private detectCaptcha(): boolean {
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="hcaptcha"]',
      '.g-recaptcha',
      '.h-captcha',
      '[data-sitekey]',
      '#recaptcha',
      '#hcaptcha',
    ];

    for (const selector of captchaSelectors) {
      const element = document.querySelector(selector);
      if (element && this.isElementVisible(element as HTMLElement)) {
        console.log(`[JobExecutor] CAPTCHA detected: ${selector}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Fill form fields based on instructions
   */
  private async fillFields(): Promise<{
    success: boolean;
    filledCount: number;
    errors?: string[];
  }> {
    const errors: string[] = [];
    let filledCount = 0;

    for (const field of this.instructions.fields) {
      try {
        const element = document.querySelector(field.selector) as HTMLInputElement | HTMLTextAreaElement;

        if (!element) {
          if (field.required) {
            errors.push(`Required field not found: ${field.name} (${field.selector})`);
          }
          continue;
        }

        // Replace template values with user data
        const value = await this.resolveFieldValue(field.value);

        // Fill the field
        this.fillElement(element, value);
        filledCount++;

        console.log(`[JobExecutor] Filled field: ${field.name} = ${value}`);
      } catch (error: any) {
        const errorMsg = `Failed to fill ${field.name}: ${error.message}`;
        console.error(`[JobExecutor] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    return {
      success: errors.length === 0 || !this.instructions.fields.some(f => f.required),
      filledCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Upload files (resume, cover letter, etc.)
   */
  private async uploadFiles(): Promise<{
    success: boolean;
    errors?: string[];
  }> {
    const errors: string[] = [];

    for (const upload of this.instructions.fileUploads) {
      try {
        const inputElement = document.querySelector(upload.selector) as HTMLInputElement;

        if (!inputElement) {
          if (upload.required) {
            errors.push(`Required file upload not found: ${upload.name}`);
          }
          continue;
        }

        // Get file from extension storage
        const file = await this.getStoredFile(upload.name);

        if (!file) {
          if (upload.required) {
            errors.push(`File not found in storage: ${upload.name}`);
          }
          continue;
        }

        // Attach file to input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        inputElement.files = dataTransfer.files;

        // Trigger change event
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));

        console.log(`[JobExecutor] Uploaded file: ${upload.name}`);
      } catch (error: any) {
        const errorMsg = `Failed to upload ${upload.name}: ${error.message}`;
        console.error(`[JobExecutor] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Show preview of filled form and request consent
   */
  private async showPreviewAndRequestConsent(): Promise<boolean> {
    return new Promise((resolve) => {
      // Create preview overlay
      const overlay = this.createPreviewOverlay();
      document.body.appendChild(overlay);

      this.previewShown = true;

      // Handle consent buttons
      const approveBtn = overlay.querySelector('#uswift-approve-btn');
      const rejectBtn = overlay.querySelector('#uswift-reject-btn');

      approveBtn?.addEventListener('click', () => {
        this.consentGranted = true;
        overlay.remove();
        this.notifyBackend('consent_approved');
        resolve(true);
      });

      rejectBtn?.addEventListener('click', () => {
        overlay.remove();
        this.notifyBackend('consent_rejected');
        resolve(false);
      });
    });
  }

  /**
   * Request submit consent from user
   */
  private async requestSubmitConsent(): Promise<boolean> {
    return new Promise((resolve) => {
      // If preview consent was already granted, auto-approve submit
      if (this.consentGranted) {
        resolve(true);
        return;
      }

      const confirmed = confirm(
        'USwift is ready to submit your application. Do you want to proceed?'
      );

      if (confirmed) {
        this.consentGranted = true;
        this.notifyBackend('submit_consent_approved');
        resolve(true);
      } else {
        this.notifyBackend('submit_consent_rejected');
        resolve(false);
      }
    });
  }

  /**
   * Validate that required fields are filled
   */
  private validateFields(): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    for (const field of this.instructions.fields) {
      if (!field.required) continue;

      const element = document.querySelector(field.selector) as HTMLInputElement | HTMLTextAreaElement;

      if (!element) {
        errors.push(`Required field missing: ${field.name}`);
        continue;
      }

      if (!element.value || element.value.trim() === '') {
        errors.push(`Required field empty: ${field.name}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Submit the form
   */
  private async submitForm(): Promise<{
    success: boolean;
    errors?: string[];
  }> {
    try {
      const submitAction = this.instructions.actions.find(a => a.type === 'submit');

      if (!submitAction || !submitAction.selector) {
        return {
          success: false,
          errors: ['Submit button selector not found in instructions'],
        };
      }

      const submitButton = document.querySelector(submitAction.selector) as HTMLButtonElement;

      if (!submitButton) {
        return {
          success: false,
          errors: ['Submit button not found on page'],
        };
      }

      // Click submit button
      submitButton.click();

      console.log('[JobExecutor] Form submitted');

      // Wait a bit to see if submission succeeded
      await new Promise(resolve => setTimeout(resolve, 2000));

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Helper: Fill a form element
   */
  private fillElement(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
    // Set value
    element.value = value;

    // Trigger events to ensure frameworks detect the change
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  /**
   * Helper: Resolve template values like {{user.firstName}}
   */
  private async resolveFieldValue(template: string): Promise<string> {
    // Check if it's a template
    if (!template.includes('{{')) {
      return template;
    }

    // Extract variable name
    const match = template.match(/\{\{user\.(\w+)\}\}/);
    if (!match) {
      return template;
    }

    const fieldName = match[1];

    // Get value from chrome storage
    const result = await chrome.storage.local.get(['profile']);
    const profile = result.profile || {};

    return profile[fieldName] || '';
  }

  /**
   * Helper: Get stored file from extension storage
   */
  private async getStoredFile(fileName: string): Promise<File | null> {
    try {
      const result = await chrome.storage.local.get(['files']);
      const files = result.files || {};

      const fileData = files[fileName];

      if (!fileData) {
        return null;
      }

      // Convert base64 to File
      const response = await fetch(fileData.dataUrl);
      const blob = await response.blob();
      return new File([blob], fileData.name, { type: fileData.type });
    } catch (error) {
      console.error(`[JobExecutor] Failed to get file ${fileName}:`, error);
      return null;
    }
  }

  /**
   * Helper: Check if element is visible
   */
  private isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }

  /**
   * Create preview overlay UI
   */
  private createPreviewOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.id = 'uswift-preview-overlay';
    overlay.innerHTML = `
      <style>
        #uswift-preview-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          z-index: 999999;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        #uswift-preview-box {
          background: white;
          padding: 24px;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
        }
        #uswift-preview-box h2 {
          margin: 0 0 16px 0;
          font-size: 20px;
          color: #333;
        }
        #uswift-preview-box p {
          margin: 0 0 20px 0;
          color: #666;
          line-height: 1.5;
        }
        #uswift-preview-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        #uswift-preview-actions button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        #uswift-approve-btn {
          background: #4CAF50;
          color: white;
        }
        #uswift-approve-btn:hover {
          background: #45a049;
        }
        #uswift-reject-btn {
          background: #f44336;
          color: white;
        }
        #uswift-reject-btn:hover {
          background: #da190b;
        }
      </style>
      <div id="uswift-preview-box">
        <h2>Review Application</h2>
        <p>
          USwift has filled out the application form with your profile information.
          Please review the filled fields and click "Submit" to continue, or "Cancel" to abort.
        </p>
        <div id="uswift-preview-actions">
          <button id="uswift-reject-btn">Cancel</button>
          <button id="uswift-approve-btn">Submit</button>
        </div>
      </div>
    `;

    return overlay;
  }

  /**
   * Notify backend of execution status
   */
  private notifyBackend(event: string, message?: string): void {
    try {
      chrome.runtime.sendMessage({
        type: 'JOB_EXECUTION_EVENT',
        jobId: this.jobId,
        event,
        message,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[JobExecutor] Failed to notify backend:', error);
    }
  }
}

// Listen for job execution requests from background/popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXECUTE_JOB') {
    const { jobId, instructions } = message;

    console.log('[JobExecutor] Received job execution request:', jobId);

    const executor = new JobExecutor(jobId, instructions);
    executor.execute().then((result) => {
      sendResponse(result);
    });

    return true; // Keep message channel open for async response
  }
});
