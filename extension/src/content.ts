// Content script for job board auto-apply functionality
// This script runs on job board pages to detect forms and auto-fill them

console.log("Uswift content script loaded");

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

// Listen for messages from popup
chrome.runtime.onMessage.addListener(
  (
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
      const success = autoFillForm(message.profile, jobBoard);

      if (success) {
        // Handle file uploads if needed
        handleFileUploads(message.profile, jobBoard);
        sendResponse({ status: "success", jobBoard });
      } else {
        sendResponse({ status: "error", message: "Failed to auto-fill form" });
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
