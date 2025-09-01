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

console.log("ðŸš€ USwift Advanced Auto-Apply loaded");
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
  },
  // New supported platforms
  linkedin: {
    applyButton: '.jobs-apply-button, [data-control-name="job_application"]',
    nameField: '#firstName, input[name*="first"], input[placeholder*="first name" i]',
    lastNameField: '#lastName, input[name*="last"], input[placeholder*="last name" i]',
    emailField: '#email, input[type="email"], input[name="email"]',
    phoneField: '#phone, input[name="phone"], input[type="tel"]',
    resumeField: 'input[type="file"]',
    coverLetterField: 'input[type="file"]'
  },
  indeed: {
    applyButton: ".jobsearch-IndeedApplyButton, .indeed-apply-button",
    nameField: 'input[name*="first"], input[id*="first"]',
    lastNameField: 'input[name*="last"], input[id*="last"]',
    emailField: 'input[type="email"], input[name="email"]',
    phoneField: 'input[name="phone"], input[type="tel"]',
    resumeField: 'input[type="file"]',
    coverLetterField: 'input[type="file"]'
  },
  glassdoor: {
    applyButton: ".apply-button, .gd-btn-apply",
    nameField: 'input[name="firstName"], input[id="firstName"]',
    lastNameField: 'input[name="lastName"], input[id="lastName"]',
    emailField: 'input[type="email"], input[name="email"]',
    phoneField: 'input[name="phone"], input[type="tel"]',
    resumeField: 'input[type="file"]',
    coverLetterField: 'input[type="file"]'
  },
  ziprecruiter: {
    applyButton: ".apply-button, .job-apply-btn",
    nameField: 'input[name*="first"], input[placeholder*="first name" i]',
    lastNameField: 'input[name*="last"], input[placeholder*="last name" i]',
    emailField: 'input[type="email"], input[name="email"]',
    phoneField: 'input[name="phone"], input[type="tel"]',
    resumeField: 'input[type="file"]',
    coverLetterField: 'input[type="file"]'
  },
  // Generic selectors for unknown platforms
  generic: {
    applyButton: 'button[type="submit"], .apply-button, .submit, .apply, input[type="submit"]',
    nameField: 'input[name*="first"], input[name*="given"], input[placeholder*="first name" i], input[id*="first"]',
    lastNameField: 'input[name*="last"], input[name*="family"], input[placeholder*="last name" i], input[id*="last"]',
    emailField: 'input[type="email"], input[name="email"], input[placeholder*="email" i]',
    phoneField: 'input[type="tel"], input[name="phone"], input[placeholder*="phone" i]',
    resumeField: 'input[type="file"]',
    coverLetterField: 'input[type="file"]'
  }
};
function detectJobBoard() {
  const startTime = Date.now();
  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const url = window.location.href.toLowerCase();
  document.title.toLowerCase();
  console.log(`ðŸ” Analyzing page: ${hostname}${pathname}`);
  if (hostname.includes("greenhouse.io") || hostname.includes("boards.greenhouse.io")) {
    return {
      name: "greenhouse",
      confidence: 0.98,
      url: window.location.hostname
    };
  }
  if (hostname.includes("lever.co")) {
    return { name: "lever", confidence: 0.98, url: window.location.hostname };
  }
  if (hostname.includes("myworkday.com") || hostname.includes("workday.com")) {
    return { name: "workday", confidence: 0.98, url: window.location.hostname };
  }
  if (hostname.includes("smartrecruiters.com")) {
    return {
      name: "smartrecruiters",
      confidence: 0.95,
      url: window.location.hostname
    };
  }
  if (hostname.includes("linkedin.com")) {
    return {
      name: "linkedin",
      confidence: 0.95,
      url: window.location.hostname,
      notes: "LinkedIn Easy Apply"
    };
  }
  if (hostname.includes("indeed.com")) {
    return { name: "indeed", confidence: 0.95, url: window.location.hostname };
  }
  if (hostname.includes("glassdoor.com")) {
    return {
      name: "glassdoor",
      confidence: 0.95,
      url: window.location.hostname
    };
  }
  if (hostname.includes("ziprecruiter.com")) {
    return {
      name: "ziprecruiter",
      confidence: 0.95,
      url: window.location.hostname
    };
  }
  if (hostname.includes("icims.com")) {
    return { name: "icims", confidence: 0.85, url: window.location.hostname };
  }
  if (hostname.includes("bamboohr.com")) {
    return {
      name: "bamboohr",
      confidence: 0.85,
      url: window.location.hostname
    };
  }
  if (hostname.includes("jobvite.com")) {
    return { name: "jobvite", confidence: 0.85, url: window.location.hostname };
  }
  if (hostname.includes("taleo.net")) {
    return { name: "taleo", confidence: 0.85, url: window.location.hostname };
  }
  if (hostname.includes("ultipro.com")) {
    return { name: "ultipro", confidence: 0.85, url: window.location.hostname };
  }
  if (hostname.includes("successfactors.com") || hostname.includes("sapsf.com")) {
    return {
      name: "successfactors",
      confidence: 0.85,
      url: window.location.hostname
    };
  }
  if (hostname.includes("oracle.com") && pathname.includes("/recruitment")) {
    return {
      name: "oracle-hcm",
      confidence: 0.85,
      url: window.location.hostname
    };
  }
  const jobApplicationPatterns = [
    /\/job/i,
    /\/jobs/i,
    /\/career/i,
    /\/careers/i,
    /\/position/i,
    /\/positions/i,
    /\/opening/i,
    /\/openings/i,
    /\/apply/i,
    /\/application/i,
    /\/recruit/i,
    /\/hiring/i
  ];
  const hasJobPattern = jobApplicationPatterns.some(
    (pattern) => pattern.test(pathname) || pattern.test(url)
  );
  const hasApplyKeyword = /\b(apply|application|submit|join|now)\b/i.test(url) || /\b(apply|application|submit)\b/i.test(document.title);
  const hasApplicationForm = document.querySelectorAll(
    'form input[type="email"], form input[placeholder*="email" i], .application-form, .job-application'
  ).length > 0;
  if (hasJobPattern && (hasApplyKeyword || hasApplicationForm)) {
    return {
      name: "generic",
      confidence: 0.75,
      url: window.location.hostname,
      notes: "Generic job application form detected"
    };
  }
  if (hasJobPattern) {
    return {
      name: "generic",
      confidence: 0.65,
      url: window.location.hostname,
      notes: "Job page detected"
    };
  }
  if (hasApplicationForm) {
    return {
      name: "generic",
      confidence: 0.55,
      url: window.location.hostname,
      notes: "Potential application form detected"
    };
  }
  const analysisTime = Date.now() - startTime;
  console.log(`âš¡ Job board detection completed in ${analysisTime}ms`);
  return {
    name: "unknown",
    confidence: 0,
    url: window.location.hostname,
    notes: "No job application patterns detected"
  };
}
function analyzePageStructure() {
  const forms = document.querySelectorAll("form");
  const inputs = document.querySelectorAll("input");
  const fileInputs = document.querySelectorAll('input[type="file"]');
  const buttons = document.querySelectorAll('button, input[type="submit"]');
  const applicationKeywords = [
    "apply",
    "application",
    "submit",
    "job",
    "career",
    "resume",
    "cv",
    "position",
    "opening",
    "hiring",
    "recruit",
    "employment"
  ];
  const foundKeywords = applicationKeywords.filter(
    (keyword) => document.body?.textContent?.toLowerCase().includes(keyword) || document.title.toLowerCase().includes(keyword)
  );
  let estimatedDifficulty = "easy";
  if (forms.length > 3 || inputs.length > 15) {
    estimatedDifficulty = "hard";
  } else if (forms.length > 1 || inputs.length > 8) {
    estimatedDifficulty = "medium";
  }
  return {
    hasApplicationForm: forms.length > 0,
    formCount: forms.length,
    inputFields: inputs.length,
    fileInputs: fileInputs.length,
    submitButtons: buttons.length,
    applicationKeywords: foundKeywords,
    estimatedDifficulty
  };
}
function findFormFieldsAdvanced() {
  const fields = {};
  const detectedFields = [];
  const detectionStrategies = [
    // Strategy 1: Standard HTML attributes
    () => findByAttributes(["name", "id", "placeholder"]),
    // Strategy 2: Label association
    () => findByLabels(),
    // Strategy 3: Data attributes (ATS specific)
    () => findByDataAttributes(),
    // Strategy 4: Proximity and context
    () => findByContext(),
    // Strategy 5: Pattern matching
    () => findByPatterns()
  ];
  function findByAttributes(attrs) {
    const fieldMappings = {
      firstName: ["first", "firstname", "given", "fname"],
      lastName: ["last", "lastname", "family", "lname", "surname"],
      email: ["email", "e-mail", "mail"],
      phone: ["phone", "telephone", "tel", "mobile", "cell"],
      linkedin: ["linkedin", "linked-in"],
      portfolio: ["portfolio", "website", "site", "url"]
    };
    for (const [fieldName, keywords] of Object.entries(fieldMappings)) {
      for (const attr of attrs) {
        for (const keyword of keywords) {
          const selectors = [
            `input[${attr}*="${keyword}" i]`,
            `input[${attr}*="${keyword.replace("-", "")}" i]`
          ];
          for (const selector of selectors) {
            const element = document.querySelector(
              selector
            );
            if (element && isVisible(element)) {
              fields[fieldName] = element;
              detectedFields.push(`${fieldName} (${attr}: ${keyword})`);
              break;
            }
          }
          if (fields[fieldName])
            break;
        }
        if (fields[fieldName])
          break;
      }
    }
  }
  function findByLabels() {
    const labels = document.querySelectorAll("label");
    labels.forEach((label) => {
      const text = label.textContent?.toLowerCase() || "";
      const input = label.querySelector("input") || document.querySelector(`#${label.getAttribute("for")}`);
      if (input && isVisible(input)) {
        if (text.includes("first") && text.includes("name")) {
          fields.firstName = input;
          detectedFields.push("firstName (label)");
        } else if (text.includes("last") && text.includes("name")) {
          fields.lastName = input;
          detectedFields.push("lastName (label)");
        } else if (text.includes("email")) {
          fields.email = input;
          detectedFields.push("email (label)");
        } else if (text.includes("phone") || text.includes("tel")) {
          fields.phone = input;
          detectedFields.push("phone (label)");
        }
      }
    });
  }
  function findByDataAttributes() {
    const dataAttrs = [
      "data-automation-id",
      "data-testid",
      "data-cy",
      "data-qa"
    ];
    const fieldPatterns = {
      firstName: /first.?name|given.?name/i,
      lastName: /last.?name|family.?name|surname/i,
      email: /email/i,
      phone: /phone|tel|mobile/i
    };
    for (const attr of dataAttrs) {
      for (const [fieldName, pattern] of Object.entries(fieldPatterns)) {
        const element = document.querySelector(
          `input[${attr}*="${fieldName}" i]`
        );
        if (element && isVisible(element)) {
          fields[fieldName] = element;
          detectedFields.push(`${fieldName} (${attr})`);
        }
      }
    }
  }
  function findByContext() {
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      const inputs = form.querySelectorAll("input");
      inputs.forEach((input, index) => {
        if (input.type === "email" && !fields.email) {
          fields.email = input;
          detectedFields.push("email (type)");
        } else if (input.type === "tel" && !fields.phone) {
          fields.phone = input;
          detectedFields.push("phone (type)");
        } else if (input.type === "text" && !fields.firstName && index === 0) {
          fields.firstName = input;
          detectedFields.push("firstName (position)");
        } else if (input.type === "text" && !fields.lastName && fields.firstName && index === 1) {
          fields.lastName = input;
          detectedFields.push("lastName (position)");
        }
      });
    });
  }
  function findByPatterns() {
    const allInputs = document.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="tel"]'
    );
    allInputs.forEach((input) => {
      if (!isVisible(input))
        return;
      const htmlInput = input;
      const placeholder = htmlInput.placeholder?.toLowerCase() || "";
      const name = htmlInput.name?.toLowerCase() || "";
      const id = input.id?.toLowerCase() || "";
      if (!fields.firstName && (placeholder.includes("first") || name.includes("first") || id.includes("first"))) {
        fields.firstName = input;
        detectedFields.push("firstName (pattern)");
      } else if (!fields.lastName && (placeholder.includes("last") || name.includes("last") || id.includes("last"))) {
        fields.lastName = input;
        detectedFields.push("lastName (pattern)");
      }
    });
  }
  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && window.getComputedStyle(element).visibility !== "hidden" && window.getComputedStyle(element).display !== "none";
  }
  detectionStrategies.forEach((strategy) => strategy());
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach((input) => {
    if (!isVisible(input))
      return;
    const htmlInput = input;
    const label = htmlInput.labels?.[0]?.textContent?.toLowerCase() || "";
    const name = htmlInput.name?.toLowerCase() || "";
    const id = input.id?.toLowerCase() || "";
    if (name.includes("resume") || label.includes("resume") || id.includes("resume")) {
      fields.resumeInput = input;
      detectedFields.push("resume (file)");
    } else if (name.includes("cover") || label.includes("cover") || id.includes("cover")) {
      fields.coverLetterInput = input;
      detectedFields.push("coverLetter (file)");
    } else if (!fields.resumeInput) {
      fields.resumeInput = input;
      detectedFields.push("resume (default file)");
    }
  });
  const requiredFields = ["firstName", "lastName", "email"];
  const optionalFields = ["phone", "resumeInput"];
  const detectedRequired = requiredFields.filter(
    (field) => fields[field]
  ).length;
  const detectedOptional = optionalFields.filter(
    (field) => fields[field]
  ).length;
  const confidence = Math.min(
    1,
    detectedRequired * 0.4 + detectedOptional * 0.2 + detectedFields.length * 0.1
  );
  console.log(
    `ðŸŽ¯ Advanced field detection: ${detectedFields.length} fields found, ${confidence.toFixed(2)} confidence`
  );
  return {
    ...fields,
    confidence,
    detectedFields
  };
}
async function fillFormUltraFast(profile, session) {
  const startTime = Date.now();
  try {
    const fields = findFormFieldsAdvanced();
    session.steps.push(
      `Advanced field detection: ${fields.detectedFields.join(", ")}`
    );
    if (fields.confidence < 0.3) {
      session.errors.push(
        `Low confidence field detection (${fields.confidence.toFixed(2)})`
      );
      return false;
    }
    const fillOperations = [];
    const fieldMappings = [
      { field: fields.firstName, value: profile.firstName, name: "firstName" },
      { field: fields.lastName, value: profile.lastName, name: "lastName" },
      { field: fields.email, value: profile.email, name: "email" },
      { field: fields.phone, value: profile.phone, name: "phone" },
      { field: fields.linkedin, value: profile.linkedin, name: "linkedin" },
      { field: fields.portfolio, value: profile.portfolio, name: "portfolio" }
    ];
    for (const mapping of fieldMappings) {
      if (mapping.field && mapping.value) {
        fillOperations.push(
          fillFieldSmart(mapping.field, mapping.value, mapping.name)
        );
      }
    }
    const results = await Promise.allSettled(fillOperations);
    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value
    ).length;
    session.steps.push(
      `Ultra-fast filling: ${successful}/${fillOperations.length} fields successful`
    );
    console.log(
      `âš¡ Ultra-fast form filling completed in ${Date.now() - startTime}ms`
    );
    return successful >= 3;
  } catch (error) {
    session.errors.push(`Ultra-fast filling failed: ${error}`);
    return false;
  }
}
async function fillFieldSmart(field, value, name) {
  try {
    field.value = "";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    if (field.form) {
      field.form.dispatchEvent(new Event("input", { bubbles: true }));
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
    if (field.validationMessage) {
      console.warn(`âš ï¸ ${name} validation: ${field.validationMessage}`);
      return false;
    }
    console.log(`âœ… ${name} filled successfully`);
    return true;
  } catch (error) {
    console.error(`âŒ ${name} filling failed:`, error);
    return false;
  }
}
async function findAndClickApplyButton(jobBoard, session) {
  const startTime = Date.now();
  const strategies = [
    () => findByStandardSelectors(jobBoard),
    () => findByAdvancedSelectors(),
    () => findByContextAndBehavior(),
    () => findByTextContent()
  ];
  for (const strategy of strategies) {
    const button = await strategy();
    if (button) {
      const clicked = await clickButtonSmart(button, session);
      if (clicked) {
        console.log(`ðŸŽ¯ Apply button clicked in ${Date.now() - startTime}ms`);
        return true;
      }
    }
  }
  session.errors.push("No clickable apply button found");
  return false;
  async function findByStandardSelectors(board) {
    const selectors = JOB_BOARD_SELECTORS[board]?.applyButton;
    if (selectors) {
      return document.querySelector(selectors);
    }
    return null;
  }
  async function findByAdvancedSelectors() {
    const advancedSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      ".apply-button",
      ".submit-button",
      ".job-apply-btn",
      '[data-automation-id*="apply"]',
      '[data-testid*="apply"]',
      'button:contains("Apply")',
      'button:contains("Submit")'
    ];
    for (const selector of advancedSelectors) {
      const element = document.querySelector(selector);
      if (element && isButtonVisible(element)) {
        return element;
      }
    }
    return null;
  }
  async function findByContextAndBehavior() {
    const forms = document.querySelectorAll("form");
    for (const form of forms) {
      const buttons = form.querySelectorAll('button, input[type="submit"]');
      for (const button of buttons) {
        if (isButtonVisible(button) && isLikelyApplyButton(button)) {
          return button;
        }
      }
    }
    return null;
  }
  async function findByTextContent() {
    const applyKeywords = ["apply", "submit", "send", "join", "start"];
    const buttons = document.querySelectorAll('button, input[type="submit"]');
    for (const button of buttons) {
      const text = button.textContent?.toLowerCase() || "";
      if (applyKeywords.some((keyword) => text.includes(keyword)) && isButtonVisible(button)) {
        return button;
      }
    }
    return null;
  }
  function isButtonVisible(button) {
    const rect = button.getBoundingClientRect();
    const style = window.getComputedStyle(button);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none" && !button.hasAttribute("disabled");
  }
  function isLikelyApplyButton(button) {
    const text = button.textContent?.toLowerCase() || "";
    const className = button.className?.toLowerCase() || "";
    const id = button.id?.toLowerCase() || "";
    return text.includes("apply") || text.includes("submit") || className.includes("apply") || className.includes("submit") || id.includes("apply") || id.includes("submit");
  }
}
async function clickButtonSmart(button, session) {
  try {
    if (button.hasAttribute("disabled")) {
      session.errors.push("Apply button is disabled");
      return false;
    }
    button.scrollIntoView({ behavior: "smooth", block: "center" });
    await new Promise((resolve) => setTimeout(resolve, 300));
    const clickMethods = [
      () => {
        button.click();
      },
      () => {
        button.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true })
        );
      },
      () => {
        button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        button.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
        button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
    ];
    for (const method of clickMethods) {
      try {
        method();
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (didPageChange() || hasSuccessIndicators()) {
          session.steps.push("Apply button clicked successfully");
          return true;
        }
      } catch (error) {
        console.warn("Click method failed:", error);
      }
    }
    return false;
  } catch (error) {
    session.errors.push(`Button click failed: ${error}`);
    return false;
  }
  function didPageChange() {
    return window.location.href !== session.url || document.querySelectorAll(".success, .submitted, .confirmation").length > 0;
  }
  function hasSuccessIndicators() {
    const indicators = [
      ".application-success",
      ".success-message",
      ".application-submitted",
      ".thank-you",
      ".confirmation"
    ];
    return indicators.some((selector) => document.querySelector(selector));
  }
}
class AutoApplyPerformanceMonitor {
  metrics = {
    detectionTime: 0,
    fillingTime: 0,
    clickTime: 0,
    totalTime: 0,
    successRate: 0,
    retryCount: 0
  };
  startTimer(metric) {
    this.metrics[`${metric}Start`] = Date.now();
  }
  endTimer(metric) {
    const startKey = `${metric}Start`;
    const startTime = this.metrics[startKey];
    if (startTime) {
      this.metrics[metric] = Date.now() - startTime;
    }
  }
  recordSuccess(success) {
    this.metrics.successRate = success ? 1 : 0;
  }
  incrementRetry() {
    this.metrics.retryCount++;
  }
  getReport() {
    return { ...this.metrics };
  }
  logPerformance() {
    console.log("ðŸ“Š Auto-Apply Performance Report:");
    console.log(`   Detection: ${this.metrics.detectionTime}ms`);
    console.log(`   Filling: ${this.metrics.fillingTime}ms`);
    console.log(`   Clicking: ${this.metrics.clickTime}ms`);
    console.log(`   Total: ${this.metrics.totalTime}ms`);
    console.log(`   Success: ${this.metrics.successRate ? "âœ…" : "âŒ"}`);
    console.log(`   Retries: ${this.metrics.retryCount}`);
  }
}
async function performAdvancedAutoApply(profile) {
  const monitor = new AutoApplyPerformanceMonitor();
  const session = {
    jobBoard: "",
    startTime: Date.now(),
    steps: [],
    errors: [],
    success: false,
    url: window.location.href
  };
  monitor.startTimer("totalTime");
  try {
    console.log("ðŸš€ Starting Ultra-Advanced Auto-Apply...");
    monitor.startTimer("detectionTime");
    const pageAnalysis = analyzePageStructure();
    session.steps.push(
      `Page analysis: ${pageAnalysis.formCount} forms, ${pageAnalysis.inputFields} inputs, difficulty: ${pageAnalysis.estimatedDifficulty}`
    );
    const detection = detectJobBoard();
    session.jobBoard = detection.name;
    session.steps.push(
      `Job board: ${detection.name} (${(detection.confidence * 100).toFixed(
        1
      )}% confidence)`
    );
    monitor.endTimer("detectionTime");
    if (detection.name === "unknown" || detection.confidence < 0.3) {
      session.errors.push("Job board detection failed or confidence too low");
      return {
        status: "error",
        message: `Unable to identify job application form. Please ensure you're on a job application page.`,
        details: {
          detection,
          pageAnalysis
        },
        session
      };
    }
    const formReady = await waitForFormAdvanced(pageAnalysis, session);
    if (!formReady) {
      return {
        status: "error",
        message: "Application form not ready. Please wait for the page to fully load.",
        session
      };
    }
    monitor.startTimer("fillingTime");
    const fillSuccess = await fillFormUltraFast(profile, session);
    monitor.endTimer("fillingTime");
    if (!fillSuccess) {
      return {
        status: "error",
        message: "Unable to fill application form. Some required fields may be missing.",
        session
      };
    }
    if (profile.resume && pageAnalysis.fileInputs > 0) {
      const fileSuccess = await handleFileUploadsAdvanced(profile, session);
      if (!fileSuccess) {
        session.errors.push(
          "File upload failed - you may need to upload files manually"
        );
      }
    }
    monitor.startTimer("clickTime");
    const clickSuccess = await findAndClickApplyButton(detection.name, session);
    monitor.endTimer("clickTime");
    monitor.endTimer("totalTime");
    if (fillSuccess && clickSuccess) {
      monitor.recordSuccess(true);
      session.success = true;
      const verificationSuccess = await verifyApplicationSuccessAdvanced(
        detection.name,
        session
      );
      monitor.logPerformance();
      return {
        status: "success",
        message: verificationSuccess ? `Application submitted successfully on ${detection.name}!` : `Application submitted on ${detection.name} (verification pending)`,
        jobBoard: detection.name,
        session,
        performance: monitor.getReport()
      };
    } else {
      monitor.recordSuccess(false);
      monitor.logPerformance();
      return {
        status: "error",
        message: `Auto-apply failed: ${session.errors[session.errors.length - 1] || "Unknown error"}`,
        jobBoard: detection.name,
        session,
        performance: monitor.getReport()
      };
    }
  } catch (e) {
    monitor.endTimer("totalTime");
    monitor.recordSuccess(false);
    monitor.logPerformance();
    session.errors.push(`Unexpected error: ${e}`);
    console.error("ðŸ’¥ Unexpected error during auto-apply:", e);
    return {
      status: "error",
      message: `Unexpected error: ${e}`,
      session,
      performance: monitor.getReport()
    };
  }
}
async function waitForFormAdvanced(analysis, session) {
  const timeout = analysis.estimatedDifficulty === "hard" ? 2e4 : analysis.estimatedDifficulty === "medium" ? 15e3 : 1e4;
  const startTime = Date.now();
  console.log(
    `â³ Waiting for form (timeout: ${timeout}ms, difficulty: ${analysis.estimatedDifficulty})`
  );
  while (Date.now() - startTime < timeout) {
    const forms = document.querySelectorAll("form");
    const inputs = document.querySelectorAll("input");
    const buttons = document.querySelectorAll('button, input[type="submit"]');
    if (forms.length > 0 && inputs.length >= 3 && buttons.length > 0) {
      const emailInput = document.querySelector('input[type="email"]');
      const textInputs = document.querySelectorAll('input[type="text"]');
      if (emailInput || textInputs.length >= 2) {
        console.log(`âœ… Form ready after ${Date.now() - startTime}ms`);
        return true;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  console.log(`â° Form readiness timeout after ${Date.now() - startTime}ms`);
  return false;
}
async function handleFileUploadsAdvanced(profile, session) {
  try {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    let successCount = 0;
    for (const input of fileInputs) {
      if (profile.resume && input) {
        try {
          const htmlInput = input;
          const result = await attachFileToInput(htmlInput, profile.resume);
          if (result.success) {
            successCount++;
            session.steps.push(`File uploaded successfully`);
          } else {
            session.errors.push(
              `File upload failed: ${result.errors?.join(", ")}`
            );
          }
        } catch (error) {
          session.errors.push(`File upload error: ${error}`);
        }
      }
    }
    return successCount > 0;
  } catch (error) {
    session.errors.push(`File handling failed: ${error}`);
    return false;
  }
}
async function verifyApplicationSuccessAdvanced(jobBoard, session) {
  await new Promise((resolve) => setTimeout(resolve, 3e3));
  const successIndicators = [
    ".application-success",
    ".success-message",
    ".application-submitted",
    ".thank-you",
    ".confirmation",
    ".submitted-message",
    '[data-testid*="success"]',
    '[data-testid*="submitted"]'
  ];
  for (const indicator of successIndicators) {
    const element = document.querySelector(indicator);
    if (element && isElementVisible(element)) {
      session.steps.push(`Success indicator found: ${indicator}`);
      return true;
    }
  }
  const currentUrl = window.location.href;
  if (currentUrl.includes("success") || currentUrl.includes("thank") || currentUrl.includes("confirm") || currentUrl.includes("submitted")) {
    session.steps.push("Success detected via URL change");
    return true;
  }
  const bodyText = document.body?.textContent?.toLowerCase() || "";
  if (bodyText.includes("success") || bodyText.includes("submitted") || bodyText.includes("thank you") || bodyText.includes("confirmed")) {
    session.steps.push("Success detected via page content");
    return true;
  }
  return false;
  function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && window.getComputedStyle(element).visibility !== "hidden";
  }
}
chrome.runtime.onMessage.addListener(
  async (message, sender, sendResponse) => {
    switch (message.action || message.type) {
      case "autoApply":
      case "AUTO_APPLY":
        console.log("ðŸš€ Ultra-Advanced Auto-Apply triggered");
        console.log("ðŸ“‹ Profile data received:", {
          hasFirstName: !!message.profile?.firstName,
          hasLastName: !!message.profile?.lastName,
          hasEmail: !!message.profile?.email,
          hasPhone: !!message.profile?.phone,
          hasResume: !!message.profile?.resume
        });
        try {
          const result = await performAdvancedAutoApply(message.profile);
          console.log("âœ… Auto-apply result:", result);
          sendResponse(result);
        } catch (error) {
          console.error("âŒ Auto-apply error:", error);
          sendResponse({
            status: "error",
            message: error.message || "Auto-apply failed"
          });
        }
        break;
      case "ping":
        console.log("ðŸ“ Ping received from popup");
        sendResponse({ status: "pong" });
        break;
      default:
        console.warn(
          "â“ Unknown message type:",
          message.action || message.type
        );
        sendResponse({ status: "error", message: "Unknown message type" });
        break;
    }
    return true;
  }
);
function testCurrentPage() {
  console.log("ðŸ§ª Testing current page...");
  const detection = detectJobBoard();
  console.log("ðŸŽ¯ Detection result:", detection);
  const pageAnalysis = analyzePageStructure();
  console.log("ðŸ“Š Page analysis:", pageAnalysis);
  return {
    detection,
    pageAnalysis,
    url: window.location.href
  };
}
function healthCheck() {
  console.log("ðŸ¥ USwift Content Script Health Check");
  console.log("âœ… Content script loaded and responding");
  console.log("ðŸŒ Current URL:", window.location.href);
  console.log("ðŸ“„ Document ready state:", document.readyState);
  const jobBoard = detectJobBoard();
  console.log("ðŸŽ¯ Job board detection:", jobBoard);
  return {
    status: "healthy",
    url: window.location.href,
    readyState: document.readyState,
    jobBoard
  };
}
window.testJobBoard = testCurrentPage;
window.checkUSwiftHealth = healthCheck;
function initWithRetry(maxRetries = 3) {
  let attempts = 0;
  function init() {
    try {
      console.log("ðŸš€ USwift Content Script Initializing...");
      if (document.readyState === "loading") {
        console.log("â³ Document still loading, waiting...");
        document.addEventListener("DOMContentLoaded", () => init());
        return;
      }
      const jobBoard = detectJobBoard();
      if (jobBoard.name !== "unknown") {
        console.log(
          `âœ… USwift Content Script Ready on ${jobBoard.name} (${(jobBoard.confidence * 100).toFixed(1)}% confidence)`
        );
        window.uswiftInitialized = true;
      } else {
        console.log(
          "âš ï¸ USwift Content Script loaded but job board not detected"
        );
      }
    } catch (error) {
      attempts++;
      console.error(
        `âŒ USwift initialization attempt ${attempts} failed:`,
        error
      );
      if (attempts < maxRetries) {
        console.log(
          `ðŸ”„ Retrying initialization in 1 second... (${attempts}/${maxRetries})`
        );
        setTimeout(init, 1e3);
      } else {
        console.error(
          `ðŸ’¥ USwift initialization failed after ${maxRetries} attempts`
        );
      }
    }
  }
  init();
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initWithRetry());
} else if (document.readyState === "interactive") {
  setTimeout(() => initWithRetry(), 100);
} else {
  initWithRetry();
}
setTimeout(() => {
  if (!window.uswiftInitialized) {
    console.log("ðŸ”„ Late initialization attempt for USwift Content Script");
    initWithRetry();
  }
}, 3e3);
