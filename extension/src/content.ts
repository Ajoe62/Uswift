// Advanced Content Script for High-Precision Job Board Auto-Apply
// Implements intelligent form detection, validation, and error recovery

console.log("🚀 USwift Advanced Auto-Apply loaded");

import { ADAPTERS, findFormFields, attachFileToInput } from "./adapters";

// Enhanced profile interface with additional fields
interface Profile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  resume?: string;
  coverLetter?: string;
  linkedin?: string;
  portfolio?: string;
  location?: string;
}

// Auto-apply session tracking
interface AutoApplySession {
  jobBoard: string;
  startTime: number;
  steps: string[];
  errors: string[];
  success: boolean;
}

// Legacy selectors (keeping for backward compatibility)
interface JobBoardSelectors {
  applyButton: string;
  nameField?: string;
  lastNameField?: string;
  emailField?: string;
  phoneField?: string;
  resumeField?: string;
  coverLetterField?: string;
}

const JOB_BOARD_SELECTORS: Record<string, JobBoardSelectors> = {
  greenhouse: {
    applyButton:
      '[data-source="apply_button"], .application-header .btn-primary',
    nameField: '#first_name, input[name="first_name"]',
    lastNameField: '#last_name, input[name="last_name"]',
    emailField: '#email, input[name="email"]',
    phoneField: '#phone, input[name="phone"]',
    resumeField: 'input[type="file"][name*="resume"]',
    coverLetterField: 'input[type="file"][name*="cover"]',
  },
  lever: {
    applyButton: ".apply-button, .postings-btn",
    nameField: '.application-form input[name="name"]',
    lastNameField: '.application-form input[name="lastname"]',
    emailField: '.application-form input[name="email"]',
    phoneField: '.application-form input[name="phone"]',
    resumeField: 'input[type="file"]',
    coverLetterField: 'input[type="file"]',
  },
  workday: {
    applyButton: '[data-automation-id="apply"], .css-1psuvku',
    nameField: 'input[data-automation-id*="firstName"]',
    lastNameField: 'input[data-automation-id*="lastName"]',
    emailField: 'input[data-automation-id*="email"]',
    phoneField: 'input[data-automation-id*="phone"]',
    resumeField: 'input[type="file"]',
    coverLetterField: 'input[type="file"]',
  },
  smartrecruiters: {
    applyButton: '.apply-button, [data-test="apply-button"]',
    nameField: 'input[name="firstName"]',
    lastNameField: 'input[name="lastName"]',
    emailField: 'input[name="email"]',
    phoneField: 'input[name="phone"]',
    resumeField: 'input[type="file"]',
    coverLetterField: 'input[type="file"]',
  },
};

// Advanced Job Board Detection with Precision
function detectJobBoard(): { name: string; confidence: number } {
  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const url = window.location.href.toLowerCase();

  // High-confidence detections
  if (
    hostname.includes("greenhouse.io") ||
    hostname.includes("boards.greenhouse.io")
  ) {
    return { name: "greenhouse", confidence: 0.95 };
  }
  if (hostname.includes("lever.co")) {
    return { name: "lever", confidence: 0.95 };
  }
  if (hostname.includes("myworkday.com") || hostname.includes("workday.com")) {
    return { name: "workday", confidence: 0.95 };
  }
  if (hostname.includes("smartrecruiters.com")) {
    return { name: "smartrecruiters", confidence: 0.9 };
  }

  // Medium-confidence detections
  if (hostname.includes("icims.com")) return { name: "icims", confidence: 0.8 };
  if (hostname.includes("bamboohr.com"))
    return { name: "bamboohr", confidence: 0.8 };
  if (hostname.includes("jobvite.com"))
    return { name: "jobvite", confidence: 0.8 };
  if (hostname.includes("taleo.net")) return { name: "taleo", confidence: 0.8 };

  // Low-confidence generic detection
  if (
    pathname.includes("/jobs/") ||
    pathname.includes("/careers/") ||
    url.includes("apply")
  ) {
    return { name: "generic", confidence: 0.6 };
  }

  return { name: "unknown", confidence: 0.0 };
}

// Legacy auto-fill function (kept for compatibility)
function legacyAutoFillForm(profile: Profile, jobBoard: string): boolean {
  const selectors = JOB_BOARD_SELECTORS[jobBoard];
  if (!selectors) return false;

  try {
    // Fill basic fields using legacy selectors
    if (selectors.nameField && profile.firstName) {
      const nameField = document.querySelector(
        selectors.nameField
      ) as HTMLInputElement;
      if (nameField) {
        nameField.value = profile.firstName;
        nameField.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    if (selectors.lastNameField && profile.lastName) {
      const lastNameField = document.querySelector(
        selectors.lastNameField
      ) as HTMLInputElement;
      if (lastNameField) {
        lastNameField.value = profile.lastName;
        lastNameField.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    if (selectors.emailField && profile.email) {
      const emailField = document.querySelector(
        selectors.emailField
      ) as HTMLInputElement;
      if (emailField) {
        emailField.value = profile.email;
        emailField.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    if (selectors.phoneField && profile.phone) {
      const phoneField = document.querySelector(
        selectors.phoneField
      ) as HTMLInputElement;
      if (phoneField) {
        phoneField.value = profile.phone;
        phoneField.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    console.log("Legacy form auto-filled successfully");
    return true;
  } catch (error) {
    console.error("Error legacy auto-filling form:", error);
    return false;
  }
}

// Handle file uploads (resumes, cover letters)
async function handleFileUploads(
  profile: Profile,
  jobBoard: string
): Promise<void> {
  const selectors = JOB_BOARD_SELECTORS[jobBoard];
  if (!selectors) return;

  // This is a simplified version - in practice, you'd need to handle
  // file uploads more carefully, potentially using blob URLs or
  // converting base64 data to files
  console.log("File upload handling would go here");
}

// Debug helper: test whether selectors match and log results
function debugSelectors(selectors: JobBoardSelectors) {
  try {
    console.log("debugSelectors:", selectors);
    [
      "nameField",
      "lastNameField",
      "emailField",
      "phoneField",
      "resumeField",
      "coverLetterField",
      "applyButton",
    ].forEach((k: any) => {
      const sel = (selectors as any)[k];
      if (!sel) {
        console.log(k, "no selector");
        return;
      }
      try {
        const el = document.querySelector(sel);
        console.log(k, sel, !!el, el);
      } catch (e) {
        console.warn("selector check failed", k, sel, e);
      }
    });
  } catch (e) {
    console.warn("debugSelectors failed", e);
  }
}

// Wait for selector to appear using MutationObserver (timeout in ms)
function waitForSelector(sel: string, timeout = 3000): Promise<Element | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(sel);
    if (el) return resolve(el);
    const obs = new MutationObserver((mutations, observer) => {
      const found = document.querySelector(sel);
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });
    obs.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });
    setTimeout(() => {
      try {
        obs.disconnect();
      } catch (e) {}
      resolve(null);
    }, timeout);
  });
}

// Intelligent Form Readiness Detection
async function waitForFormReady(
  jobBoard: string,
  timeout = 10000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      // Check if adapter has form readiness detection
      if (ADAPTERS[jobBoard] && ADAPTERS[jobBoard].detectFormReady) {
        const isReady = await ADAPTERS[jobBoard].detectFormReady!();
        if (isReady) return true;
      }

      // Fallback: Check for common form indicators
      const formIndicators = [
        'form[action*="apply"]',
        ".application-form",
        ".job-application",
        '[data-test*="application"]',
        ".apply-form",
      ];

      for (const indicator of formIndicators) {
        const element = document.querySelector(indicator) as HTMLElement;
        if (element && element.offsetParent !== null) {
          console.log(`✅ Form ready detected with: ${indicator}`);
          return true;
        }
      }

      // Check for specific input fields
      const fields = findFormFields();
      const hasRequiredFields =
        fields.firstName || fields.lastName || fields.email;
      if (hasRequiredFields) {
        console.log("✅ Form ready detected with required fields");
        return true;
      }

      // Wait before next check
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (e) {
      console.warn("Form readiness check failed:", e);
    }
  }

  console.warn("⏰ Form readiness timeout");
  return false;
}

// Advanced Auto-Fill with Validation
async function autoFillForm(
  profile: Profile,
  jobBoard: string,
  session: AutoApplySession
) {
  session.steps.push("Starting form fill");

  try {
    const fields = findFormFields();
    console.log("🔍 Detected fields:", Object.keys(fields));

    // Validate profile data
    if (!profile.firstName || !profile.lastName || !profile.email) {
      throw new Error(
        "Missing required profile data (firstName, lastName, email)"
      );
    }

    // Fill text fields with validation
    const textFields = [
      { field: fields.firstName, value: profile.firstName, name: "firstName" },
      { field: fields.lastName, value: profile.lastName, name: "lastName" },
      { field: fields.email, value: profile.email, name: "email" },
      { field: fields.phone, value: profile.phone, name: "phone" },
      { field: fields.linkedin, value: profile.linkedin, name: "linkedin" },
      { field: fields.portfolio, value: profile.portfolio, name: "portfolio" },
    ];

    let filledFields = 0;
    for (const { field, value, name } of textFields) {
      if (field && value) {
        try {
          // Clear field first
          field.value = "";
          field.dispatchEvent(new Event("input", { bubbles: true }));

          // Fill with value
          field.value = value;
          field.dispatchEvent(new Event("input", { bubbles: true }));
          field.dispatchEvent(new Event("change", { bubbles: true }));
          field.dispatchEvent(new Event("blur", { bubbles: true }));

          // Wait for validation
          await new Promise((resolve) => setTimeout(resolve, 200));

          if (field.validationMessage) {
            session.errors.push(
              `${name} validation: ${field.validationMessage}`
            );
            console.warn(
              `⚠️ ${name} validation warning:`,
              field.validationMessage
            );
          } else {
            filledFields++;
            console.log(`✅ Filled ${name}: ${value}`);
          }
        } catch (e) {
          session.errors.push(`Failed to fill ${name}: ${e}`);
          console.error(`❌ Failed to fill ${name}:`, e);
        }
      }
    }

    session.steps.push(`Filled ${filledFields} text fields`);

    // Handle file uploads
    if (profile.resume || profile.coverLetter) {
      session.steps.push("Starting file uploads");

      const fileFields = [
        { file: profile.resume, field: fields.resumeInput, name: "resume" },
        {
          file: profile.coverLetter,
          field: fields.coverLetterInput,
          name: "cover letter",
        },
      ];

      for (const { file, field, name } of fileFields) {
        if (file && field) {
          try {
            console.log(`📎 Uploading ${name}...`);
            const result = await attachFileToInput(field, file);

            if (result.success) {
              session.steps.push(`Uploaded ${name} successfully`);
              console.log(`✅ ${name} uploaded successfully`);
            } else {
              session.errors.push(
                `${name} upload failed: ${result.errors?.join(", ")}`
              );
              console.error(`❌ ${name} upload failed:`, result.errors);
            }
          } catch (e) {
            session.errors.push(`${name} upload error: ${e}`);
            console.error(`❌ ${name} upload error:`, e);
          }
        }
      }
    }

    // Validate form after filling
    const validationErrors = await validateForm(jobBoard);
    if (validationErrors.length > 0) {
      session.errors.push(...validationErrors);
      console.warn("⚠️ Form validation errors:", validationErrors);
    }

    return filledFields > 0;
  } catch (e) {
    session.errors.push(`Form fill failed: ${e}`);
    console.error("❌ Form fill failed:", e);
    return false;
  }
}

// Form Validation
async function validateForm(jobBoard: string): Promise<string[]> {
  const errors: string[] = [];

  try {
    const fields = findFormFields();

    // Check required fields
    const requiredFields = [
      { field: fields.firstName, name: "First Name" },
      { field: fields.lastName, name: "Last Name" },
      { field: fields.email, name: "Email" },
    ];

    for (const { field, name } of requiredFields) {
      if (!field) {
        errors.push(`${name} field not found`);
      } else if (!field.value.trim()) {
        errors.push(`${name} field is empty`);
      } else if (field.validationMessage) {
        errors.push(`${name}: ${field.validationMessage}`);
      }
    }

    // Check email format
    if (fields.email && fields.email.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fields.email.value)) {
        errors.push("Email format is invalid");
      }
    }

    // Check file requirements
    if (fields.resumeInput) {
      const label = fields.resumeInput.labels?.[0]?.textContent || "";
      if (
        label.toLowerCase().includes("required") &&
        (!fields.resumeInput.files || fields.resumeInput.files.length === 0)
      ) {
        errors.push("Resume is required but not uploaded");
      }
    }
  } catch (e) {
    errors.push(`Validation failed: ${e}`);
  }

  return errors;
}

// Advanced Apply Button Detection and Clicking
async function clickApplyButton(
  jobBoard: string,
  session: AutoApplySession
): Promise<boolean> {
  session.steps.push("Attempting to click apply button");

  try {
    const applySelectors = [
      '[data-source="apply_button"]',
      '[data-automation-id="apply"]',
      '[data-test="apply-button"]',
      '[data-qa="apply-button"]',
      'button[type="submit"]',
      ".apply-button",
      ".btn-primary",
      ".submit-application",
      ".apply-submit",
      ".application-submit",
    ];

    for (const selector of applySelectors) {
      const button = document.querySelector(selector) as HTMLElement;

      if (button && button.offsetParent !== null) {
        // Check if button is visible and enabled
        const rect = button.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        const isEnabled =
          !button.hasAttribute("disabled") &&
          button.getAttribute("aria-disabled") !== "true";

        if (isVisible && isEnabled) {
          try {
            console.log(`🎯 Clicking apply button: ${selector}`);

            // Scroll button into view
            button.scrollIntoView({ behavior: "smooth", block: "center" });
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Try native click first
            button.click();

            // Wait for potential navigation or form submission
            await new Promise((resolve) => setTimeout(resolve, 1000));

            session.steps.push(
              `Clicked apply button with selector: ${selector}`
            );
            console.log("✅ Apply button clicked successfully");
            return true;
          } catch (e) {
            console.warn(
              `Native click failed for ${selector}, trying dispatch:`,
              e
            );

            // Fallback to dispatchEvent
            try {
              button.dispatchEvent(
                new MouseEvent("click", {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                })
              );

              session.steps.push(
                `Dispatched click event for selector: ${selector}`
              );
              console.log("✅ Apply button clicked with dispatchEvent");
              return true;
            } catch (dispatchError) {
              console.error(
                `Dispatch click failed for ${selector}:`,
                dispatchError
              );
            }
          }
        } else {
          console.log(
            `Button ${selector} is not clickable (visible: ${isVisible}, enabled: ${isEnabled})`
          );
        }
      }
    }

    session.errors.push("No clickable apply button found");
    console.error("❌ No clickable apply button found");
    return false;
  } catch (e) {
    session.errors.push(`Apply button click failed: ${e}`);
    console.error("❌ Apply button click failed:", e);
    return false;
  }
}

// Success Verification
async function verifyApplicationSuccess(
  jobBoard: string,
  session: AutoApplySession
): Promise<boolean> {
  session.steps.push("Verifying application success");

  try {
    // Wait for page changes
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check for success indicators
    const successIndicators = [
      ".application-success",
      ".success-message",
      ".application-submitted",
      ".thank-you",
      '[data-test*="success"]',
      ".confirmation",
    ];

    for (const indicator of successIndicators) {
      const element = document.querySelector(indicator) as HTMLElement;
      if (element && element.offsetParent !== null) {
        console.log("✅ Application success detected:", indicator);
        session.steps.push(`Success indicator found: ${indicator}`);
        return true;
      }
    }

    // Check URL changes (common success pattern)
    const currentUrl = window.location.href;
    if (
      currentUrl.includes("success") ||
      currentUrl.includes("thank") ||
      currentUrl.includes("confirm")
    ) {
      console.log("✅ Application success detected via URL:", currentUrl);
      session.steps.push("Success detected via URL change");
      return true;
    }

    // Check for error messages (negative confirmation)
    const errorIndicators = [
      ".error-message",
      ".application-error",
      ".validation-error",
      '[data-test*="error"]',
    ];

    for (const indicator of errorIndicators) {
      const element = document.querySelector(indicator) as HTMLElement;
      if (element && element.offsetParent !== null) {
        console.log("❌ Application error detected:", indicator);
        session.errors.push(`Application error: ${element.textContent}`);
        return false;
      }
    }

    console.log("⚠️ Application success uncertain - no clear indicators found");
    session.steps.push("Success verification inconclusive");
    return false; // Conservative approach
  } catch (e) {
    console.warn("Success verification failed:", e);
    session.errors.push(`Success verification failed: ${e}`);
    return false;
  }
}

// Attempt to click the apply button if present; returns true if clicked
async function clickApplyIfPossible(selectors: JobBoardSelectors) {
  try {
    const applySel = selectors.applyButton;
    if (!applySel) return false;
    let btn = document.querySelector(applySel) as HTMLElement | null;
    if (!btn) {
      // Wait briefly for dynamic injection
      btn = (await waitForSelector(applySel, 2000)) as HTMLElement | null;
    }
    if (btn) {
      try {
        btn.click();
      } catch (e) {
        btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
      console.log("Clicked apply button", applySel, btn);
      return true;
    }
  } catch (e) {
    console.warn("clickApplyIfPossible failed", e);
  }
  return false;
}

// Advanced Auto-Apply with High Precision
async function performAdvancedAutoApply(profile: Profile): Promise<any> {
  const session: AutoApplySession = {
    jobBoard: "",
    startTime: Date.now(),
    steps: [],
    errors: [],
    success: false,
  };

  try {
    // Step 1: Detect job board with confidence
    const detection = detectJobBoard();
    session.jobBoard = detection.name;
    session.steps.push(
      `Detected job board: ${detection.name} (confidence: ${(
        detection.confidence * 100
      ).toFixed(1)}%)`
    );

    console.log(
      `🎯 Detected job board: ${detection.name} (${(
        detection.confidence * 100
      ).toFixed(1)}% confidence)`
    );

    if (detection.name === "unknown" || detection.confidence < 0.5) {
      session.errors.push("Job board detection failed or confidence too low");
      return {
        status: "error",
        message: `Unsupported or unrecognized job board (${detection.name})`,
        session,
      };
    }

    // Step 2: Wait for form to be ready
    session.steps.push("Waiting for form to be ready");
    console.log("⏳ Waiting for form to be ready...");

    const formReady = await waitForFormReady(detection.name, 15000);
    if (!formReady) {
      session.errors.push("Form did not become ready within timeout");
      return {
        status: "error",
        message: "Application form not found or not ready",
        session,
      };
    }

    session.steps.push("Form is ready for interaction");
    console.log("✅ Form is ready for interaction");

    // Step 3: Use advanced adapter if available
    let fillSuccess = false;
    let fileSuccess = false;
    let clickSuccess = false;

    if (ADAPTERS[detection.name]) {
      session.steps.push(`Using advanced ${detection.name} adapter`);

      // Fill form using adapter
      if (ADAPTERS[detection.name].fillForm) {
        try {
          console.log("📝 Filling form using adapter...");
          const fillResult = await ADAPTERS[detection.name].fillForm!(profile);
          fillSuccess = fillResult.success;

          if (fillResult.errors) session.errors.push(...fillResult.errors);
          if (fillResult.warnings)
            session.steps.push(
              ...fillResult.warnings.map((w) => `Warning: ${w}`)
            );

          session.steps.push(
            `Adapter form fill: ${fillSuccess ? "SUCCESS" : "FAILED"}`
          );
          console.log(`📝 Form fill result:`, fillResult);
        } catch (e) {
          session.errors.push(`Adapter form fill error: ${e}`);
          console.error("❌ Adapter form fill error:", e);
        }
      }

      // Handle file uploads using adapter
      if (
        ADAPTERS[detection.name].handleFileUpload &&
        (profile.resume || profile.coverLetter)
      ) {
        try {
          console.log("📎 Handling file uploads using adapter...");
          const fileResult = await ADAPTERS[detection.name].handleFileUpload!(
            profile
          );
          fileSuccess = fileResult.success;

          if (fileResult.errors) session.errors.push(...fileResult.errors);
          if (fileResult.warnings)
            session.steps.push(
              ...fileResult.warnings.map((w) => `Warning: ${w}`)
            );

          session.steps.push(
            `Adapter file upload: ${fileSuccess ? "SUCCESS" : "FAILED"}`
          );
          console.log(`📎 File upload result:`, fileResult);
        } catch (e) {
          session.errors.push(`Adapter file upload error: ${e}`);
          console.error("❌ Adapter file upload error:", e);
        }
      }

      // Validate form using adapter
      if (ADAPTERS[detection.name].validateForm) {
        try {
          const validationResult = await ADAPTERS[detection.name]
            .validateForm!();
          if (!validationResult.success && validationResult.errors) {
            session.errors.push(...validationResult.errors);
            console.warn("⚠️ Form validation errors:", validationResult.errors);
          }
        } catch (e) {
          console.warn("Form validation failed:", e);
        }
      }

      // Click apply using adapter
      if (ADAPTERS[detection.name].clickApply) {
        try {
          console.log("🎯 Clicking apply button using adapter...");
          const clickResult = await ADAPTERS[detection.name].clickApply!();
          clickSuccess = clickResult.success;

          session.steps.push(
            `Adapter apply click: ${clickSuccess ? "SUCCESS" : "FAILED"}`
          );
          console.log(`🎯 Apply click result:`, clickResult);
        } catch (e) {
          session.errors.push(`Adapter apply click error: ${e}`);
          console.error("❌ Adapter apply click error:", e);
        }
      }
    } else {
      // Fallback to generic approach
      session.steps.push("Using generic fallback approach");
      console.log("🔄 Using generic fallback approach");

      fillSuccess = await autoFillForm(profile, detection.name, session);
      clickSuccess = await clickApplyButton(detection.name, session);
    }

    // Step 4: Verify success
    if (fillSuccess && clickSuccess) {
      session.steps.push("Verifying application success");
      console.log("🔍 Verifying application success...");

      const verificationSuccess = await verifyApplicationSuccess(
        detection.name,
        session
      );

      if (verificationSuccess) {
        session.success = true;
        session.steps.push("Application submitted successfully");
        console.log("🎉 Application submitted successfully!");

        return {
          status: "success",
          message: `Successfully applied to job on ${detection.name}`,
          jobBoard: detection.name,
          session,
        };
      } else {
        session.steps.push("Application success verification inconclusive");
        console.log("⚠️ Application success verification inconclusive");

        // Still consider it a success if we filled and clicked
        session.success = true;
        return {
          status: "success",
          message: `Application submitted (verification inconclusive)`,
          jobBoard: detection.name,
          session,
        };
      }
    } else {
      const failures = [];
      if (!fillSuccess) failures.push("form filling");
      if (!clickSuccess) failures.push("apply button click");

      session.errors.push(`Failed steps: ${failures.join(", ")}`);
      console.error("❌ Auto-apply failed:", failures);

      return {
        status: "error",
        message: `Auto-apply failed: ${failures.join(", ")}`,
        jobBoard: detection.name,
        session,
      };
    }
  } catch (e) {
    session.errors.push(`Unexpected error: ${e}`);
    console.error("💥 Unexpected error during auto-apply:", e);

    return {
      status: "error",
      message: `Unexpected error: ${e}`,
      session,
    };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(
  async (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) => {
    if (message.type === "AUTO_APPLY") {
      console.log("🚀 Advanced Auto-Apply triggered");
      console.log("📋 Profile data:", message.profile);

      try {
        const result = await performAdvancedAutoApply(message.profile);
        sendResponse(result);
      } catch (e) {
        console.error("💥 Auto-apply failed with exception:", e);
        sendResponse({
          status: "error",
          message: `Exception during auto-apply: ${e}`,
          session: {
            jobBoard: "unknown",
            startTime: Date.now(),
            steps: ["Exception occurred"],
            errors: [`Exception: ${e}`],
            success: false,
          },
        });
      }
    }
  }
);

// Inject visual indicator when extension is active
function injectIndicator(): void {
  const indicator = document.createElement("div");
  indicator.id = "uswift-indicator";
  indicator.innerHTML = "🚀 Uswift Active";
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #6D28D9;
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(indicator);

  // Remove after 3 seconds
  setTimeout(() => {
    indicator.remove();
  }, 3000);
}

// Initialize content script
function init(): void {
  const jobBoard = detectJobBoard();
  if (jobBoard.name !== "unknown") {
    console.log(`Uswift loaded on ${jobBoard}`);
    injectIndicator();
  }
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
