console.log("Uswift content script loaded");
const JOB_BOARD_SELECTORS = {
  greenhouse: {
    applyButton: '[data-source="apply_button"], .application-header .btn-primary',
    nameField: '#first_name, input[name="first_name"]',
    lastNameField: '#last_name, input[name="last_name"]',
    emailField: '#email, input[name="email"]',
    phoneField: '#phone, input[name="phone"]',
    resumeField: 'input[type="file"][name*="resume"]',
    coverLetterField: 'input[type="file"][name*="cover"]'
  },
  lever: {
    applyButton: ".apply-button, .postings-btn",
    nameField: '.application-form input[name="name"]',
    lastNameField: '.application-form input[name="lastname"]',
    emailField: '.application-form input[name="email"]',
    phoneField: '.application-form input[name="phone"]',
    resumeField: 'input[type="file"]',
    coverLetterField: 'input[type="file"]'
  },
  workday: {
    applyButton: '[data-automation-id="apply"], .css-1psuvku',
    nameField: 'input[data-automation-id*="firstName"]',
    lastNameField: 'input[data-automation-id*="lastName"]',
    emailField: 'input[data-automation-id*="email"]',
    phoneField: 'input[data-automation-id*="phone"]',
    resumeField: 'input[type="file"]',
    coverLetterField: 'input[type="file"]'
  },
  smartrecruiters: {
    applyButton: '.apply-button, [data-test="apply-button"]',
    nameField: 'input[name="firstName"]',
    lastNameField: 'input[name="lastName"]',
    emailField: 'input[name="email"]',
    phoneField: 'input[name="phone"]',
    resumeField: 'input[type="file"]',
    coverLetterField: 'input[type="file"]'
  }
};
function detectJobBoard() {
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes("greenhouse"))
    return "greenhouse";
  if (hostname.includes("lever"))
    return "lever";
  if (hostname.includes("workday"))
    return "workday";
  if (hostname.includes("smartrecruiters"))
    return "smartrecruiters";
  if (hostname.includes("icims"))
    return "icims";
  if (hostname.includes("bamboohr"))
    return "bamboohr";
  if (hostname.includes("jobvite"))
    return "jobvite";
  if (hostname.includes("taleo"))
    return "taleo";
  return "unknown";
}
function autoFillForm(profile, jobBoard) {
  const selectors = JOB_BOARD_SELECTORS[jobBoard];
  if (!selectors)
    return false;
  try {
    if (selectors.nameField && profile.firstName) {
      const nameField = document.querySelector(
        selectors.nameField
      );
      if (nameField) {
        nameField.value = profile.firstName;
        nameField.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    if (selectors.lastNameField && profile.lastName) {
      const lastNameField = document.querySelector(
        selectors.lastNameField
      );
      if (lastNameField) {
        lastNameField.value = profile.lastName;
        lastNameField.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    if (selectors.emailField && profile.email) {
      const emailField = document.querySelector(
        selectors.emailField
      );
      if (emailField) {
        emailField.value = profile.email;
        emailField.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    if (selectors.phoneField && profile.phone) {
      const phoneField = document.querySelector(
        selectors.phoneField
      );
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
async function handleFileUploads(profile, jobBoard) {
  const selectors = JOB_BOARD_SELECTORS[jobBoard];
  if (!selectors)
    return;
  console.log("File upload handling would go here");
}
chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (message.type === "AUTO_APPLY") {
      const jobBoard = detectJobBoard();
      console.log("Auto-apply triggered on:", jobBoard);
      if (jobBoard === "unknown") {
        sendResponse({ status: "error", message: "Unsupported job board" });
        return;
      }
      const success = autoFillForm(message.profile, jobBoard);
      if (success) {
        handleFileUploads(message.profile, jobBoard);
        sendResponse({ status: "success", jobBoard });
      } else {
        sendResponse({ status: "error", message: "Failed to auto-fill form" });
      }
    }
  }
);
function injectIndicator() {
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
  setTimeout(() => {
    indicator.remove();
  }, 3e3);
}
function init() {
  const jobBoard = detectJobBoard();
  if (jobBoard !== "unknown") {
    console.log(`Uswift loaded on ${jobBoard}`);
    injectIndicator();
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
