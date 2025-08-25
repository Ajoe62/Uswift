// Content script for job board auto-apply functionality
// This script runs on job board pages to detect forms and auto-fill them

console.log("Uswift content script loaded");

import { ADAPTERS } from "./adapters";

// Define interface for job board selectors
interface JobBoardSelectors {
  applyButton: string;
  nameField?: string;
  lastNameField?: string;
  emailField?: string;
  phoneField?: string;
  resumeField?: string;
  coverLetterField?: string;
}

// Define profile interface
interface Profile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  resume?: string;
  coverLetter?: string;
}

// Common job board selectors
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

// Detect which job board we're on
function detectJobBoard(): string {
  const hostname = window.location.hostname.toLowerCase();

  if (hostname.includes("greenhouse")) return "greenhouse";
  if (hostname.includes("lever")) return "lever";
  if (hostname.includes("workday")) return "workday";
  if (hostname.includes("smartrecruiters")) return "smartrecruiters";
  if (hostname.includes("icims")) return "icims";
  if (hostname.includes("bamboohr")) return "bamboohr";
  if (hostname.includes("jobvite")) return "jobvite";
  if (hostname.includes("taleo")) return "taleo";

  return "unknown";
}

// Auto-fill form fields
function autoFillForm(profile: Profile, jobBoard: string): boolean {
  const selectors = JOB_BOARD_SELECTORS[jobBoard];
  if (!selectors) return false;

  try {
    // Debug: log which selectors are available and whether they match
    debugSelectors(selectors);
    // Fill name fields
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

    // Fill email
    if (selectors.emailField && profile.email) {
      const emailField = document.querySelector(
        selectors.emailField
      ) as HTMLInputElement;
      if (emailField) {
        emailField.value = profile.email;
        emailField.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    // Fill phone
    if (selectors.phoneField && profile.phone) {
      const phoneField = document.querySelector(
        selectors.phoneField
      ) as HTMLInputElement;
      if (phoneField) {
        phoneField.value = profile.phone;
        phoneField.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    console.log("Form auto-filled successfully");
    return true;
  } catch (error) {
    console.error("Error auto-filling form:", error);
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

// Listen for messages from popup
chrome.runtime.onMessage.addListener(
  async (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) => {
    if (message.type === "AUTO_APPLY") {
      const jobBoard = detectJobBoard();
      console.log("Auto-apply triggered on:", jobBoard);

      if (jobBoard === "unknown") {
        sendResponse({ status: "error", message: "Unsupported job board" });
        return;
      }

      // Auto-fill the form
      // Use adapter if present (more robust board-specific logic)
      const details: any = {
        adapter: !!ADAPTERS[jobBoard],
        clickedApply: false,
      };
      let success = false;
      if (ADAPTERS[jobBoard] && ADAPTERS[jobBoard].fillForm) {
        try {
          const r = await ADAPTERS[jobBoard].fillForm!(message.profile);
          success = !!(r && r.success);
          details.adapterResult = r;
        } catch (e) {
          details.adapterError = e;
        }
      }

      // Fallback to generic selector-based autofill
      if (!success) {
        const generic = autoFillForm(message.profile, jobBoard);
        success = generic;
        details.fallbackUsed = true;
      }

      if (success) {
        // Try adapter file upload first
        if (ADAPTERS[jobBoard] && ADAPTERS[jobBoard].handleFileUpload) {
          try {
            details.fileResult = await ADAPTERS[jobBoard].handleFileUpload!(
              message.profile
            );
          } catch (e) {
            details.fileError = e;
          }
        } else {
          try {
            await handleFileUploads(message.profile, jobBoard);
          } catch (e) {
            console.warn("file upload failed", e);
            details.fileError = e;
          }
        }

        // Attempt to click apply via adapter or generic click
        if (ADAPTERS[jobBoard] && ADAPTERS[jobBoard].clickApply) {
          try {
            const ar = await ADAPTERS[jobBoard].clickApply!();
            details.clickedApply = !!ar.success;
            details.adapterClick = ar;
          } catch (e) {
            details.adapterClickError = e;
          }
        } else {
          try {
            const clicked = await clickApplyIfPossible(
              JOB_BOARD_SELECTORS[jobBoard]
            );
            details.clickedApply = clicked;
          } catch (e) {
            console.warn("click attempt failed", e);
            details.clickError = e;
          }
        }

        sendResponse({ status: "success", jobBoard, details });
      } else {
        sendResponse({
          status: "error",
          message: "Failed to auto-fill form",
          details,
        });
      }

      if (success) {
        // Handle file uploads if needed
        try {
          await handleFileUploads(message.profile, jobBoard);
        } catch (e) {
          console.warn("file upload failed", e);
        }
        // Attempt to click apply automatically when possible
        try {
          const clicked = await clickApplyIfPossible(
            JOB_BOARD_SELECTORS[jobBoard]
          );
          details.clickedApply = clicked;
        } catch (e) {
          console.warn("click attempt failed", e);
        }
        sendResponse({ status: "success", jobBoard, details });
      } else {
        sendResponse({
          status: "error",
          message: "Failed to auto-fill form",
          details,
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
  if (jobBoard !== "unknown") {
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
