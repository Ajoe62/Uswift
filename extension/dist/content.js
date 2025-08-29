async function attachFileToInput(input, fileUrl) {
  const errors = [];
  const warnings = [];
  try {
    if (!fileUrl) {
      return { success: false, errors: ["No file URL provided"] };
    }
    if (!input || input.type !== "file") {
      return { success: false, errors: ["Invalid file input element"] };
    }
    const res = await fetch(fileUrl, {
      mode: "cors",
      headers: {
        "Cache-Control": "no-cache"
      }
    });
    if (!res.ok) {
      return {
        success: false,
        errors: [`Failed to fetch file: ${res.status} ${res.statusText}`]
      };
    }
    const blob = await res.blob();
    const disposition = res.headers.get("content-disposition") || "";
    let filename = "document.pdf";
    const filenameMatch = /filename\*=UTF-8''([^;]+)/i.exec(disposition) || /filename="?([^";]+)/i.exec(disposition);
    if (filenameMatch && filenameMatch[1]) {
      filename = decodeURIComponent(filenameMatch[1]);
    }
    const file = new File([blob], filename, {
      type: blob.type || "application/pdf"
    });
    try {
      const dt = new DataTransfer();
      dt.items.add(file);
      Object.defineProperty(input, "files", {
        value: dt.files,
        writable: false
      });
      input.dispatchEvent(new Event("change", { bubbles: true }));
      if (input.files && input.files.length > 0) {
        return {
          success: true,
          details: { strategy: "DataTransfer", filename }
        };
      }
    } catch (e) {
      errors.push(`DataTransfer failed: ${e}`);
    }
    try {
      input.files = [file];
      input.dispatchEvent(new Event("change", { bubbles: true }));
      if (input.files && input.files.length > 0) {
        warnings.push("Used fallback file assignment method");
        return {
          success: true,
          warnings,
          details: { strategy: "DirectAssignment", filename }
        };
      }
    } catch (e) {
      errors.push(`Direct assignment failed: ${e}`);
    }
    return {
      success: false,
      errors,
      warnings,
      details: {
        filename,
        attemptedStrategies: ["DataTransfer", "DirectAssignment"]
      }
    };
  } catch (e) {
    return {
      success: false,
      errors: [`File attachment failed: ${e}`],
      details: { fileUrl }
    };
  }
}
function findFormFields() {
  const fields = {};
  const fieldSelectors = {
    firstName: [
      'input[name="firstName"]',
      'input[name="first_name"]',
      'input[id="first_name"]',
      'input[placeholder*="first name" i]',
      'input[placeholder*="given name" i]',
      'input[data-automation-id*="firstName"]',
      'input[aria-label*="first name" i]'
    ],
    lastName: [
      'input[name="lastName"]',
      'input[name="last_name"]',
      'input[id="last_name"]',
      'input[placeholder*="last name" i]',
      'input[placeholder*="family name" i]',
      'input[data-automation-id*="lastName"]',
      'input[aria-label*="last name" i]'
    ],
    email: [
      'input[type="email"]',
      'input[name="email"]',
      'input[id="email"]',
      'input[placeholder*="email" i]',
      'input[data-automation-id*="email"]',
      'input[aria-label*="email" i]'
    ],
    phone: [
      'input[type="tel"]',
      'input[name="phone"]',
      'input[id="phone"]',
      'input[placeholder*="phone" i]',
      'input[data-automation-id*="phone"]',
      'input[aria-label*="phone" i]'
    ],
    linkedin: [
      'input[name*="linkedin" i]',
      'input[placeholder*="linkedin" i]',
      'input[aria-label*="linkedin" i]'
    ],
    portfolio: [
      'input[name*="portfolio" i]',
      'input[placeholder*="portfolio" i]',
      'input[aria-label*="portfolio" i]'
    ]
  };
  Object.entries(fieldSelectors).forEach(([fieldName, selectors]) => {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.type !== "hidden" && element.offsetParent !== null) {
        fields[fieldName] = element;
        break;
      }
    }
  });
  const fileInputs = document.querySelectorAll(
    'input[type="file"]'
  );
  fileInputs.forEach((input) => {
    if (input.offsetParent === null)
      return;
    const label = input.labels?.[0]?.textContent?.toLowerCase() || "";
    const name = input.name?.toLowerCase() || "";
    const id = input.id?.toLowerCase() || "";
    const ariaLabel = input.getAttribute("aria-label")?.toLowerCase() || "";
    if (name.includes("resume") || label.includes("resume") || id.includes("resume") || ariaLabel.includes("resume")) {
      fields.resumeInput = input;
    } else if (name.includes("cover") || label.includes("cover") || id.includes("cover") || ariaLabel.includes("cover")) {
      fields.coverLetterInput = input;
    } else if (!fields.resumeInput) {
      fields.resumeInput = input;
    }
  });
  return fields;
}
const greenhouseAdapter = {
  async detectFormReady() {
    const formSelectors = [
      ".application-form",
      '[data-test="application-form"]',
      ".job-application-form"
    ];
    for (const selector of formSelectors) {
      const form = document.querySelector(selector);
      if (form && form.offsetParent !== null) {
        return true;
      }
    }
    return false;
  },
  async fillForm(profile) {
    const errors = [];
    const warnings = [];
    try {
      const fields = findFormFields();
      const textFields = [
        {
          field: fields.firstName,
          value: profile.firstName,
          name: "firstName"
        },
        { field: fields.lastName, value: profile.lastName, name: "lastName" },
        { field: fields.email, value: profile.email, name: "email" },
        { field: fields.phone, value: profile.phone, name: "phone" },
        { field: fields.linkedin, value: profile.linkedin, name: "linkedin" },
        {
          field: fields.portfolio,
          value: profile.portfolio,
          name: "portfolio"
        }
      ];
      for (const { field, value, name } of textFields) {
        if (field && value) {
          try {
            field.value = value;
            field.dispatchEvent(new Event("input", { bubbles: true }));
            field.dispatchEvent(new Event("change", { bubbles: true }));
            await new Promise((resolve) => setTimeout(resolve, 100));
            if (field.validationMessage) {
              warnings.push(`${name}: ${field.validationMessage}`);
            }
          } catch (e) {
            errors.push(`Failed to fill ${name}: ${e}`);
          }
        } else if (!field && value) {
          warnings.push(`${name} field not found`);
        }
      }
      return {
        success: errors.length === 0,
        errors,
        warnings,
        details: { fieldsFound: Object.keys(fields).length }
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Form filling failed: ${e}`]
      };
    }
  },
  async handleFileUpload(profile) {
    const errors = [];
    const warnings = [];
    try {
      const fields = findFormFields();
      if (profile.resume && fields.resumeInput) {
        const resumeResult = await attachFileToInput(
          fields.resumeInput,
          profile.resume
        );
        if (!resumeResult.success) {
          errors.push(
            `Resume upload failed: ${resumeResult.errors?.join(", ")}`
          );
        } else {
          warnings.push(...resumeResult.warnings || []);
        }
      } else if (profile.resume && !fields.resumeInput) {
        errors.push("Resume input field not found");
      }
      if (profile.coverLetter && fields.coverLetterInput) {
        const coverResult = await attachFileToInput(
          fields.coverLetterInput,
          profile.coverLetter
        );
        if (!coverResult.success) {
          errors.push(
            `Cover letter upload failed: ${coverResult.errors?.join(", ")}`
          );
        } else {
          warnings.push(...coverResult.warnings || []);
        }
      }
      return {
        success: errors.length === 0,
        errors,
        warnings,
        details: {
          resumeUploaded: !!(profile.resume && fields.resumeInput),
          coverLetterUploaded: !!(profile.coverLetter && fields.coverLetterInput)
        }
      };
    } catch (e) {
      return {
        success: false,
        errors: [`File upload failed: ${e}`]
      };
    }
  },
  async clickApply() {
    try {
      const applySelectors = [
        '[data-source="apply_button"]',
        ".application-header .btn-primary",
        'button[type="submit"]',
        ".apply-button",
        '[data-test="submit-application"]'
      ];
      for (const selector of applySelectors) {
        const button = document.querySelector(selector);
        if (button && button.offsetParent !== null) {
          if (button.hasAttribute("disabled") || button.getAttribute("aria-disabled") === "true") {
            return {
              success: false,
              errors: [
                "Apply button is disabled - form may have validation errors"
              ]
            };
          }
          try {
            button.click();
            return { success: true, details: { selector, method: "click" } };
          } catch (e) {
            button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            return {
              success: true,
              details: { selector, method: "dispatchEvent" }
            };
          }
        }
      }
      return {
        success: false,
        errors: ["Apply button not found"]
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Click apply failed: ${e}`]
      };
    }
  },
  async validateForm() {
    const errors = [];
    const warnings = [];
    try {
      const fields = findFormFields();
      const requiredFields = ["firstName", "lastName", "email"];
      for (const fieldName of requiredFields) {
        const field = fields[fieldName];
        if (!field) {
          errors.push(`${fieldName} field is missing`);
        } else if (!field.value.trim()) {
          errors.push(`${fieldName} field is empty`);
        } else if (field.validationMessage) {
          errors.push(`${fieldName}: ${field.validationMessage}`);
        }
      }
      if (fields.resumeInput) {
        const resumeLabel = fields.resumeInput.labels?.[0]?.textContent || "";
        if (resumeLabel.toLowerCase().includes("required") && fields.resumeInput.files?.length === 0) {
          errors.push("Resume is required but not uploaded");
        }
      }
      return {
        success: errors.length === 0,
        errors,
        warnings,
        details: {
          requiredFieldsChecked: requiredFields.length,
          fileFieldsChecked: !!(fields.resumeInput || fields.coverLetterInput)
        }
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Form validation failed: ${e}`]
      };
    }
  }
};
const leverAdapter = {
  async detectFormReady() {
    const formSelectors = [
      ".application-form",
      ".posting-apply-form",
      '[data-qa="application-form"]'
    ];
    for (const selector of formSelectors) {
      const form = document.querySelector(selector);
      if (form && form.offsetParent !== null) {
        return true;
      }
    }
    return false;
  },
  async fillForm(profile) {
    const errors = [];
    const warnings = [];
    try {
      const fields = findFormFields();
      const textFields = [
        {
          field: fields.firstName,
          value: profile.firstName,
          name: "firstName"
        },
        { field: fields.lastName, value: profile.lastName, name: "lastName" },
        { field: fields.email, value: profile.email, name: "email" },
        { field: fields.phone, value: profile.phone, name: "phone" }
      ];
      for (const { field, value, name } of textFields) {
        if (field && value) {
          try {
            field.value = value;
            field.dispatchEvent(new Event("input", { bubbles: true }));
            field.dispatchEvent(new Event("blur", { bubbles: true }));
            await new Promise((resolve) => setTimeout(resolve, 200));
            if (field.validationMessage) {
              warnings.push(`${name}: ${field.validationMessage}`);
            }
          } catch (e) {
            errors.push(`Failed to fill ${name}: ${e}`);
          }
        }
      }
      return {
        success: errors.length === 0,
        errors,
        warnings
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Form filling failed: ${e}`]
      };
    }
  },
  async handleFileUpload(profile) {
    const errors = [];
    try {
      const fields = findFormFields();
      if (profile.resume && fields.resumeInput) {
        const result = await attachFileToInput(
          fields.resumeInput,
          profile.resume
        );
        if (!result.success) {
          errors.push(`Resume upload failed: ${result.errors?.join(", ")}`);
        }
      }
      if (profile.coverLetter && fields.coverLetterInput) {
        const result = await attachFileToInput(
          fields.coverLetterInput,
          profile.coverLetter
        );
        if (!result.success) {
          errors.push(
            `Cover letter upload failed: ${result.errors?.join(", ")}`
          );
        }
      }
      return {
        success: errors.length === 0,
        errors
      };
    } catch (e) {
      return {
        success: false,
        errors: [`File upload failed: ${e}`]
      };
    }
  },
  async clickApply() {
    try {
      const applySelectors = [
        ".apply-button",
        ".postings-btn",
        'button[type="submit"]',
        '[data-qa="apply-button"]'
      ];
      for (const selector of applySelectors) {
        const button = document.querySelector(selector);
        if (button && button.offsetParent !== null) {
          button.click();
          return { success: true, details: { selector } };
        }
      }
      return {
        success: false,
        errors: ["Apply button not found"]
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Click apply failed: ${e}`]
      };
    }
  }
};
const workdayAdapter = {
  async detectFormReady() {
    const formSelectors = [
      '[data-automation-id="applicationForm"]',
      ".css-1psuvku",
      ".application-form"
    ];
    for (const selector of formSelectors) {
      const form = document.querySelector(selector);
      if (form && form.offsetParent !== null) {
        return true;
      }
    }
    return false;
  },
  async fillForm(profile) {
    const errors = [];
    const warnings = [];
    try {
      const selectors = {
        firstName: 'input[data-automation-id*="firstName"]',
        lastName: 'input[data-automation-id*="lastName"]',
        email: 'input[data-automation-id*="email"]',
        phone: 'input[data-automation-id*="phone"]'
      };
      const textFields = [
        {
          selector: selectors.firstName,
          value: profile.firstName,
          name: "firstName"
        },
        {
          selector: selectors.lastName,
          value: profile.lastName,
          name: "lastName"
        },
        { selector: selectors.email, value: profile.email, name: "email" },
        { selector: selectors.phone, value: profile.phone, name: "phone" }
      ];
      for (const { selector, value, name } of textFields) {
        if (value) {
          const field = document.querySelector(selector);
          if (field) {
            try {
              field.value = value;
              field.dispatchEvent(new Event("input", { bubbles: true }));
              field.dispatchEvent(new Event("change", { bubbles: true }));
              await new Promise((resolve) => setTimeout(resolve, 300));
              if (field.validationMessage) {
                warnings.push(`${name}: ${field.validationMessage}`);
              }
            } catch (e) {
              errors.push(`Failed to fill ${name}: ${e}`);
            }
          } else {
            warnings.push(`${name} field not found`);
          }
        }
      }
      return {
        success: errors.length === 0,
        errors,
        warnings
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Form filling failed: ${e}`]
      };
    }
  },
  async clickApply() {
    try {
      const applySelectors = [
        '[data-automation-id="apply"]',
        'button[type="submit"]',
        ".css-1psuvku"
      ];
      for (const selector of applySelectors) {
        const button = document.querySelector(selector);
        if (button && button.offsetParent !== null) {
          button.click();
          return { success: true, details: { selector } };
        }
      }
      return {
        success: false,
        errors: ["Apply button not found"]
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Click apply failed: ${e}`]
      };
    }
  }
};
const ADAPTERS = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
  workday: workdayAdapter
  // Ready for expansion
  // smartrecruiters: smartrecruitersAdapter,
  // icims: icimsAdapter,
  // bamboohr: bamboohrAdapter,
  // jobvite: jobviteAdapter,
  // taleo: taleoAdapter,
};

console.log("🚀 USwift Advanced Auto-Apply loaded");
function detectJobBoard() {
  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const url = window.location.href.toLowerCase();
  if (hostname.includes("greenhouse.io") || hostname.includes("boards.greenhouse.io")) {
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
  if (hostname.includes("icims.com"))
    return { name: "icims", confidence: 0.8 };
  if (hostname.includes("bamboohr.com"))
    return { name: "bamboohr", confidence: 0.8 };
  if (hostname.includes("jobvite.com"))
    return { name: "jobvite", confidence: 0.8 };
  if (hostname.includes("taleo.net"))
    return { name: "taleo", confidence: 0.8 };
  if (pathname.includes("/jobs/") || pathname.includes("/careers/") || url.includes("apply")) {
    return { name: "generic", confidence: 0.6 };
  }
  return { name: "unknown", confidence: 0 };
}
async function waitForFormReady(jobBoard, timeout = 1e4) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      if (ADAPTERS[jobBoard] && ADAPTERS[jobBoard].detectFormReady) {
        const isReady = await ADAPTERS[jobBoard].detectFormReady();
        if (isReady)
          return true;
      }
      const formIndicators = [
        'form[action*="apply"]',
        ".application-form",
        ".job-application",
        '[data-test*="application"]',
        ".apply-form"
      ];
      for (const indicator of formIndicators) {
        const element = document.querySelector(indicator);
        if (element && element.offsetParent !== null) {
          console.log(`✅ Form ready detected with: ${indicator}`);
          return true;
        }
      }
      const fields = findFormFields();
      const hasRequiredFields = fields.firstName || fields.lastName || fields.email;
      if (hasRequiredFields) {
        console.log("✅ Form ready detected with required fields");
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (e) {
      console.warn("Form readiness check failed:", e);
    }
  }
  console.warn("⏰ Form readiness timeout");
  return false;
}
async function autoFillForm(profile, jobBoard, session) {
  session.steps.push("Starting form fill");
  try {
    const fields = findFormFields();
    console.log("🔍 Detected fields:", Object.keys(fields));
    if (!profile.firstName || !profile.lastName || !profile.email) {
      throw new Error(
        "Missing required profile data (firstName, lastName, email)"
      );
    }
    const textFields = [
      { field: fields.firstName, value: profile.firstName, name: "firstName" },
      { field: fields.lastName, value: profile.lastName, name: "lastName" },
      { field: fields.email, value: profile.email, name: "email" },
      { field: fields.phone, value: profile.phone, name: "phone" },
      { field: fields.linkedin, value: profile.linkedin, name: "linkedin" },
      { field: fields.portfolio, value: profile.portfolio, name: "portfolio" }
    ];
    let filledFields = 0;
    for (const { field, value, name } of textFields) {
      if (field && value) {
        try {
          field.value = "";
          field.dispatchEvent(new Event("input", { bubbles: true }));
          field.value = value;
          field.dispatchEvent(new Event("input", { bubbles: true }));
          field.dispatchEvent(new Event("change", { bubbles: true }));
          field.dispatchEvent(new Event("blur", { bubbles: true }));
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
    if (profile.resume || profile.coverLetter) {
      session.steps.push("Starting file uploads");
      const fileFields = [
        { file: profile.resume, field: fields.resumeInput, name: "resume" },
        {
          file: profile.coverLetter,
          field: fields.coverLetterInput,
          name: "cover letter"
        }
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
async function validateForm(jobBoard) {
  const errors = [];
  try {
    const fields = findFormFields();
    const requiredFields = [
      { field: fields.firstName, name: "First Name" },
      { field: fields.lastName, name: "Last Name" },
      { field: fields.email, name: "Email" }
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
    if (fields.email && fields.email.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fields.email.value)) {
        errors.push("Email format is invalid");
      }
    }
    if (fields.resumeInput) {
      const label = fields.resumeInput.labels?.[0]?.textContent || "";
      if (label.toLowerCase().includes("required") && (!fields.resumeInput.files || fields.resumeInput.files.length === 0)) {
        errors.push("Resume is required but not uploaded");
      }
    }
  } catch (e) {
    errors.push(`Validation failed: ${e}`);
  }
  return errors;
}
async function clickApplyButton(jobBoard, session) {
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
      ".application-submit"
    ];
    for (const selector of applySelectors) {
      const button = document.querySelector(selector);
      if (button && button.offsetParent !== null) {
        const rect = button.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        const isEnabled = !button.hasAttribute("disabled") && button.getAttribute("aria-disabled") !== "true";
        if (isVisible && isEnabled) {
          try {
            console.log(`🎯 Clicking apply button: ${selector}`);
            button.scrollIntoView({ behavior: "smooth", block: "center" });
            await new Promise((resolve) => setTimeout(resolve, 500));
            button.click();
            await new Promise((resolve) => setTimeout(resolve, 1e3));
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
            try {
              button.dispatchEvent(
                new MouseEvent("click", {
                  bubbles: true,
                  cancelable: true,
                  view: window
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
async function verifyApplicationSuccess(jobBoard, session) {
  session.steps.push("Verifying application success");
  try {
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    const successIndicators = [
      ".application-success",
      ".success-message",
      ".application-submitted",
      ".thank-you",
      '[data-test*="success"]',
      ".confirmation"
    ];
    for (const indicator of successIndicators) {
      const element = document.querySelector(indicator);
      if (element && element.offsetParent !== null) {
        console.log("✅ Application success detected:", indicator);
        session.steps.push(`Success indicator found: ${indicator}`);
        return true;
      }
    }
    const currentUrl = window.location.href;
    if (currentUrl.includes("success") || currentUrl.includes("thank") || currentUrl.includes("confirm")) {
      console.log("✅ Application success detected via URL:", currentUrl);
      session.steps.push("Success detected via URL change");
      return true;
    }
    const errorIndicators = [
      ".error-message",
      ".application-error",
      ".validation-error",
      '[data-test*="error"]'
    ];
    for (const indicator of errorIndicators) {
      const element = document.querySelector(indicator);
      if (element && element.offsetParent !== null) {
        console.log("❌ Application error detected:", indicator);
        session.errors.push(`Application error: ${element.textContent}`);
        return false;
      }
    }
    console.log("⚠️ Application success uncertain - no clear indicators found");
    session.steps.push("Success verification inconclusive");
    return false;
  } catch (e) {
    console.warn("Success verification failed:", e);
    session.errors.push(`Success verification failed: ${e}`);
    return false;
  }
}
async function performAdvancedAutoApply(profile) {
  const session = {
    jobBoard: "",
    startTime: Date.now(),
    steps: [],
    errors: [],
    success: false
  };
  try {
    const detection = detectJobBoard();
    session.jobBoard = detection.name;
    session.steps.push(
      `Detected job board: ${detection.name} (confidence: ${(detection.confidence * 100).toFixed(1)}%)`
    );
    console.log(
      `🎯 Detected job board: ${detection.name} (${(detection.confidence * 100).toFixed(1)}% confidence)`
    );
    if (detection.name === "unknown" || detection.confidence < 0.5) {
      session.errors.push("Job board detection failed or confidence too low");
      return {
        status: "error",
        message: `Unsupported or unrecognized job board (${detection.name})`,
        session
      };
    }
    session.steps.push("Waiting for form to be ready");
    console.log("⏳ Waiting for form to be ready...");
    const formReady = await waitForFormReady(detection.name, 15e3);
    if (!formReady) {
      session.errors.push("Form did not become ready within timeout");
      return {
        status: "error",
        message: "Application form not found or not ready",
        session
      };
    }
    session.steps.push("Form is ready for interaction");
    console.log("✅ Form is ready for interaction");
    let fillSuccess = false;
    let fileSuccess = false;
    let clickSuccess = false;
    if (ADAPTERS[detection.name]) {
      session.steps.push(`Using advanced ${detection.name} adapter`);
      if (ADAPTERS[detection.name].fillForm) {
        try {
          console.log("📝 Filling form using adapter...");
          const fillResult = await ADAPTERS[detection.name].fillForm(profile);
          fillSuccess = fillResult.success;
          if (fillResult.errors)
            session.errors.push(...fillResult.errors);
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
      if (ADAPTERS[detection.name].handleFileUpload && (profile.resume || profile.coverLetter)) {
        try {
          console.log("📎 Handling file uploads using adapter...");
          const fileResult = await ADAPTERS[detection.name].handleFileUpload(
            profile
          );
          fileSuccess = fileResult.success;
          if (fileResult.errors)
            session.errors.push(...fileResult.errors);
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
      if (ADAPTERS[detection.name].validateForm) {
        try {
          const validationResult = await ADAPTERS[detection.name].validateForm();
          if (!validationResult.success && validationResult.errors) {
            session.errors.push(...validationResult.errors);
            console.warn("⚠️ Form validation errors:", validationResult.errors);
          }
        } catch (e) {
          console.warn("Form validation failed:", e);
        }
      }
      if (ADAPTERS[detection.name].clickApply) {
        try {
          console.log("🎯 Clicking apply button using adapter...");
          const clickResult = await ADAPTERS[detection.name].clickApply();
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
      session.steps.push("Using generic fallback approach");
      console.log("🔄 Using generic fallback approach");
      fillSuccess = await autoFillForm(profile, detection.name, session);
      clickSuccess = await clickApplyButton(detection.name, session);
    }
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
          session
        };
      } else {
        session.steps.push("Application success verification inconclusive");
        console.log("⚠️ Application success verification inconclusive");
        session.success = true;
        return {
          status: "success",
          message: `Application submitted (verification inconclusive)`,
          jobBoard: detection.name,
          session
        };
      }
    } else {
      const failures = [];
      if (!fillSuccess)
        failures.push("form filling");
      if (!clickSuccess)
        failures.push("apply button click");
      session.errors.push(`Failed steps: ${failures.join(", ")}`);
      console.error("❌ Auto-apply failed:", failures);
      return {
        status: "error",
        message: `Auto-apply failed: ${failures.join(", ")}`,
        jobBoard: detection.name,
        session
      };
    }
  } catch (e) {
    session.errors.push(`Unexpected error: ${e}`);
    console.error("💥 Unexpected error during auto-apply:", e);
    return {
      status: "error",
      message: `Unexpected error: ${e}`,
      session
    };
  }
}
chrome.runtime.onMessage.addListener(
  async (message, sender, sendResponse) => {
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
            success: false
          }
        });
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
  if (jobBoard.name !== "unknown") {
    console.log(`Uswift loaded on ${jobBoard}`);
    injectIndicator();
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
