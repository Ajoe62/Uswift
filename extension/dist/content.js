const greenhouseAdapter = {
  async fillForm(profile) {
    try {
      const first = document.querySelector('#first_name, input[name="first_name"]');
      const last = document.querySelector('#last_name, input[name="last_name"]');
      const email = document.querySelector('#email, input[name="email"]');
      const phone = document.querySelector('#phone, input[name="phone"]');
      if (first && profile.firstName) {
        first.value = profile.firstName;
        first.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (last && profile.lastName) {
        last.value = profile.lastName;
        last.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (email && profile.email) {
        email.value = profile.email;
        email.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (phone && profile.phone) {
        phone.value = profile.phone;
        phone.dispatchEvent(new Event("input", { bubbles: true }));
      }
      return { success: true };
    } catch (e) {
      return { success: false, details: e };
    }
  },
  async clickApply() {
    try {
      const btn = document.querySelector('[data-source="apply_button"], .application-header .btn-primary');
      if (btn) {
        try {
          btn.click();
        } catch (e) {
          btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }
        return { success: true };
      }
      return { success: false };
    } catch (e) {
      return { success: false, details: e };
    }
  }
};
const ADAPTERS = {
  greenhouse: greenhouseAdapter
  // Add 'lever', 'workday', etc. here when you implement their adapters
};

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
    debugSelectors(selectors);
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
function debugSelectors(selectors) {
  try {
    console.log("debugSelectors:", selectors);
    ["nameField", "lastNameField", "emailField", "phoneField", "resumeField", "coverLetterField", "applyButton"].forEach((k) => {
      const sel = selectors[k];
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
function waitForSelector(sel, timeout = 3e3) {
  return new Promise((resolve) => {
    const el = document.querySelector(sel);
    if (el)
      return resolve(el);
    const obs = new MutationObserver((mutations, observer) => {
      const found = document.querySelector(sel);
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });
    obs.observe(document.documentElement || document.body, { childList: true, subtree: true });
    setTimeout(() => {
      try {
        obs.disconnect();
      } catch (e) {
      }
      resolve(null);
    }, timeout);
  });
}
async function clickApplyIfPossible(selectors) {
  try {
    const applySel = selectors.applyButton;
    if (!applySel)
      return false;
    let btn = document.querySelector(applySel);
    if (!btn) {
      btn = await waitForSelector(applySel, 2e3);
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
chrome.runtime.onMessage.addListener(
  async (message, sender, sendResponse) => {
    if (message.type === "AUTO_APPLY") {
      const jobBoard = detectJobBoard();
      console.log("Auto-apply triggered on:", jobBoard);
      if (jobBoard === "unknown") {
        sendResponse({ status: "error", message: "Unsupported job board" });
        return;
      }
      const details = { adapter: !!ADAPTERS[jobBoard], clickedApply: false };
      let success = false;
      if (ADAPTERS[jobBoard] && ADAPTERS[jobBoard].fillForm) {
        try {
          const r = await ADAPTERS[jobBoard].fillForm(message.profile);
          success = !!(r && r.success);
          details.adapterResult = r;
        } catch (e) {
          details.adapterError = e;
        }
      }
      if (!success) {
        const generic = autoFillForm(message.profile, jobBoard);
        success = generic;
        details.fallbackUsed = true;
      }
      if (success) {
        if (ADAPTERS[jobBoard] && ADAPTERS[jobBoard].handleFileUpload) {
          try {
            details.fileResult = await ADAPTERS[jobBoard].handleFileUpload(message.profile);
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
        if (ADAPTERS[jobBoard] && ADAPTERS[jobBoard].clickApply) {
          try {
            const ar = await ADAPTERS[jobBoard].clickApply();
            details.clickedApply = !!ar.success;
            details.adapterClick = ar;
          } catch (e) {
            details.adapterClickError = e;
          }
        } else {
          try {
            const clicked = await clickApplyIfPossible(JOB_BOARD_SELECTORS[jobBoard]);
            details.clickedApply = clicked;
          } catch (e) {
            console.warn("click attempt failed", e);
            details.clickError = e;
          }
        }
        sendResponse({ status: "success", jobBoard, details });
      } else {
        sendResponse({ status: "error", message: "Failed to auto-fill form", details });
      }
      if (success) {
        try {
          await handleFileUploads(message.profile, jobBoard);
        } catch (e) {
          console.warn("file upload failed", e);
        }
        try {
          const clicked = await clickApplyIfPossible(JOB_BOARD_SELECTORS[jobBoard]);
          details.clickedApply = clicked;
        } catch (e) {
          console.warn("click attempt failed", e);
        }
        sendResponse({ status: "success", jobBoard, details });
      } else {
        sendResponse({ status: "error", message: "Failed to auto-fill form", details });
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
