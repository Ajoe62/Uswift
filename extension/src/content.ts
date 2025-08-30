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
  url?: string;
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

// Detection result interface
interface JobBoardDetection {
  name: string;
  confidence: number;
  url: string;
  notes?: string;
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

  // New supported platforms
  linkedin: {
    applyButton: '.jobs-apply-button, [data-control-name="job_application"]',
    nameField:
      '#firstName, input[name*="first"], input[placeholder*="first name" i]',
    lastNameField:
      '#lastName, input[name*="last"], input[placeholder*="last name" i]',
    emailField: '#email, input[type="email"], input[name="email"]',
    phoneField: '#phone, input[name="phone"], input[type="tel"]',
    resumeField: 'input[type="file"]',
    coverLetterField: 'input[type="file"]',
  },

  indeed: {
    applyButton: ".jobsearch-IndeedApplyButton, .indeed-apply-button",
    nameField: 'input[name*="first"], input[id*="first"]',
    lastNameField: 'input[name*="last"], input[id*="last"]',
    emailField: 'input[type="email"], input[name="email"]',
    phoneField: 'input[name="phone"], input[type="tel"]',
    resumeField: 'input[type="file"]',
    coverLetterField: 'input[type="file"]',
  },

  glassdoor: {
    applyButton: ".apply-button, .gd-btn-apply",
    nameField: 'input[name="firstName"], input[id="firstName"]',
    lastNameField: 'input[name="lastName"], input[id="lastName"]',
    emailField: 'input[type="email"], input[name="email"]',
    phoneField: 'input[name="phone"], input[type="tel"]',
    resumeField: 'input[type="file"]',
    coverLetterField: 'input[type="file"]',
  },

  ziprecruiter: {
    applyButton: ".apply-button, .job-apply-btn",
    nameField: 'input[name*="first"], input[placeholder*="first name" i]',
    lastNameField: 'input[name*="last"], input[placeholder*="last name" i]',
    emailField: 'input[type="email"], input[name="email"]',
    phoneField: 'input[name="phone"], input[type="tel"]',
    resumeField: 'input[type="file"]',
    coverLetterField: 'input[type="file"]',
  },

  // Generic selectors for unknown platforms
  generic: {
    applyButton:
      'button[type="submit"], .apply-button, .submit, .apply, input[type="submit"]',
    nameField:
      'input[name*="first"], input[name*="given"], input[placeholder*="first name" i], input[id*="first"]',
    lastNameField:
      'input[name*="last"], input[name*="family"], input[placeholder*="last name" i], input[id*="last"]',
    emailField:
      'input[type="email"], input[name="email"], input[placeholder*="email" i]',
    phoneField:
      'input[type="tel"], input[name="phone"], input[placeholder*="phone" i]',
    resumeField: 'input[type="file"]',
    coverLetterField: 'input[type="file"]',
  },
};

// Advanced Job Board Detection with Machine Learning-like Approach
function detectJobBoard(): JobBoardDetection {
  const startTime = Date.now();
  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();

  console.log(`🔍 Analyzing page: ${hostname}${pathname}`);

  // Ultra High-confidence detections (Direct platform detection)
  if (
    hostname.includes("greenhouse.io") ||
    hostname.includes("boards.greenhouse.io")
  ) {
    return {
      name: "greenhouse",
      confidence: 0.98,
      url: window.location.hostname,
    };
  }
  if (hostname.includes("lever.co")) {
    return { name: "lever", confidence: 0.98, url: window.location.hostname };
  }
  if (hostname.includes("myworkday.com") || hostname.includes("workday.com")) {
    return { name: "workday", confidence: 0.98, url: window.location.hostname };
  }

  // High-confidence detections (Major platforms)
  if (hostname.includes("smartrecruiters.com")) {
    return {
      name: "smartrecruiters",
      confidence: 0.95,
      url: window.location.hostname,
    };
  }
  if (hostname.includes("linkedin.com")) {
    return {
      name: "linkedin",
      confidence: 0.95,
      url: window.location.hostname,
      notes: "LinkedIn Easy Apply",
    };
  }
  if (hostname.includes("indeed.com")) {
    return { name: "indeed", confidence: 0.95, url: window.location.hostname };
  }
  if (hostname.includes("glassdoor.com")) {
    return {
      name: "glassdoor",
      confidence: 0.95,
      url: window.location.hostname,
    };
  }
  if (hostname.includes("ziprecruiter.com")) {
    return {
      name: "ziprecruiter",
      confidence: 0.95,
      url: window.location.hostname,
    };
  }

  // Medium-confidence detections (Popular ATS platforms)
  if (hostname.includes("icims.com")) {
    return { name: "icims", confidence: 0.85, url: window.location.hostname };
  }
  if (hostname.includes("bamboohr.com")) {
    return {
      name: "bamboohr",
      confidence: 0.85,
      url: window.location.hostname,
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
  if (
    hostname.includes("successfactors.com") ||
    hostname.includes("sapsf.com")
  ) {
    return {
      name: "successfactors",
      confidence: 0.85,
      url: window.location.hostname,
    };
  }
  if (hostname.includes("oracle.com") && pathname.includes("/recruitment")) {
    return {
      name: "oracle-hcm",
      confidence: 0.85,
      url: window.location.hostname,
    };
  }

  // Enhanced generic detection with better patterns
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
    /\/hiring/i,
  ];

  const hasJobPattern = jobApplicationPatterns.some(
    (pattern) => pattern.test(pathname) || pattern.test(url)
  );
  const hasApplyKeyword =
    /\b(apply|application|submit|join|now)\b/i.test(url) ||
    /\b(apply|application|submit)\b/i.test(document.title);

  // Check for form elements that indicate a job application
  const hasApplicationForm =
    document.querySelectorAll(
      'form input[type="email"], form input[placeholder*="email" i], .application-form, .job-application'
    ).length > 0;

  if (hasJobPattern && (hasApplyKeyword || hasApplicationForm)) {
    return {
      name: "generic",
      confidence: 0.75,
      url: window.location.hostname,
      notes: "Generic job application form detected",
    };
  }

  if (hasJobPattern) {
    return {
      name: "generic",
      confidence: 0.65,
      url: window.location.hostname,
      notes: "Job page detected",
    };
  }

  // Very low confidence - might still be a job application
  if (hasApplicationForm) {
    return {
      name: "generic",
      confidence: 0.55,
      url: window.location.hostname,
      notes: "Potential application form detected",
    };
  }

  const analysisTime = Date.now() - startTime;
  console.log(`⚡ Job board detection completed in ${analysisTime}ms`);

  return {
    name: "unknown",
    confidence: 0.0,
    url: window.location.hostname,
    notes: "No job application patterns detected",
  };
}

// Advanced Form Analysis and Intelligence
function analyzePageStructure(): {
  hasApplicationForm: boolean;
  formCount: number;
  inputFields: number;
  fileInputs: number;
  submitButtons: number;
  applicationKeywords: string[];
  estimatedDifficulty: 'easy' | 'medium' | 'hard';
} {
  const forms = document.querySelectorAll('form');
  const inputs = document.querySelectorAll('input');
  const fileInputs = document.querySelectorAll('input[type="file"]');
  const buttons = document.querySelectorAll('button, input[type="submit"]');

  const applicationKeywords = [
    'apply', 'application', 'submit', 'job', 'career', 'resume', 'cv',
    'position', 'opening', 'hiring', 'recruit', 'employment'
  ];

  const foundKeywords = applicationKeywords.filter(keyword =>
    document.body?.textContent?.toLowerCase().includes(keyword) ||
    document.title.toLowerCase().includes(keyword)
  );

  // Estimate difficulty based on form complexity
  let estimatedDifficulty: 'easy' | 'medium' | 'hard' = 'easy';
  if (forms.length > 3 || inputs.length > 15) {
    estimatedDifficulty = 'hard';
  } else if (forms.length > 1 || inputs.length > 8) {
    estimatedDifficulty = 'medium';
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

// Intelligent Waiting Strategy
async function smartWaitForElement(selector: string, timeout = 10000): Promise<Element | null> {
  const startTime = Date.now();

  // Immediate check
  let element = document.querySelector(selector);
  if (element) return element;

  // Progressive waiting with different strategies
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      element = document.querySelector(selector);

      if (element) {
        clearInterval(checkInterval);
        resolve(element);
        return;
      }

      // Timeout check
      if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(null);
      }
    }, 100); // Check every 100ms

    // Also listen for DOM changes
    const observer = new MutationObserver(() => {
      element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        clearInterval(checkInterval);
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup after timeout
    setTimeout(() => {
      observer.disconnect();
    }, timeout);
  });
}

// Advanced Form Field Detection with AI-like Intelligence
function findFormFieldsAdvanced(): {
  firstName?: HTMLInputElement;
  lastName?: HTMLInputElement;
  email?: HTMLInputElement;
  phone?: HTMLInputElement;
  resumeInput?: HTMLInputElement;
  coverLetterInput?: HTMLInputElement;
  linkedin?: HTMLInputElement;
  portfolio?: HTMLInputElement;
  confidence: number;
  detectedFields: string[];
} {
  const fields: any = {};
  const detectedFields: string[] = [];

  // Multi-layered detection strategy
  const detectionStrategies = [
    // Strategy 1: Standard HTML attributes
    () => findByAttributes(['name', 'id', 'placeholder']),
    // Strategy 2: Label association
    () => findByLabels(),
    // Strategy 3: Data attributes (ATS specific)
    () => findByDataAttributes(),
    // Strategy 4: Proximity and context
    () => findByContext(),
    // Strategy 5: Pattern matching
    () => findByPatterns()
  ];

  function findByAttributes(attrs: string[]) {
    const fieldMappings = {
      firstName: ['first', 'firstname', 'given', 'fname'],
      lastName: ['last', 'lastname', 'family', 'lname', 'surname'],
      email: ['email', 'e-mail', 'mail'],
      phone: ['phone', 'telephone', 'tel', 'mobile', 'cell'],
      linkedin: ['linkedin', 'linked-in'],
      portfolio: ['portfolio', 'website', 'site', 'url']
    };

    for (const [fieldName, keywords] of Object.entries(fieldMappings)) {
      for (const attr of attrs) {
        for (const keyword of keywords) {
          const selectors = [
            `input[${attr}*="${keyword}" i]`,
            `input[${attr}*="${keyword.replace('-', '')}" i]`
          ];

          for (const selector of selectors) {
            const element = document.querySelector(selector) as HTMLInputElement;
            if (element && isVisible(element)) {
              fields[fieldName] = element;
              detectedFields.push(`${fieldName} (${attr}: ${keyword})`);
              break;
            }
          }
          if (fields[fieldName]) break;
        }
        if (fields[fieldName]) break;
      }
    }
  }

  function findByLabels() {
    const labels = document.querySelectorAll('label');
    labels.forEach(label => {
      const text = label.textContent?.toLowerCase() || '';
      const input = label.querySelector('input') || document.querySelector(`#${label.getAttribute('for')}`);

      if (input && isVisible(input)) {
        if (text.includes('first') && text.includes('name')) {
          fields.firstName = input;
          detectedFields.push('firstName (label)');
        } else if (text.includes('last') && text.includes('name')) {
          fields.lastName = input;
          detectedFields.push('lastName (label)');
        } else if (text.includes('email')) {
          fields.email = input;
          detectedFields.push('email (label)');
        } else if (text.includes('phone') || text.includes('tel')) {
          fields.phone = input;
          detectedFields.push('phone (label)');
        }
      }
    });
  }

  function findByDataAttributes() {
    const dataAttrs = ['data-automation-id', 'data-testid', 'data-cy', 'data-qa'];
    const fieldPatterns = {
      firstName: /first.?name|given.?name/i,
      lastName: /last.?name|family.?name|surname/i,
      email: /email/i,
      phone: /phone|tel|mobile/i
    };

    for (const attr of dataAttrs) {
      for (const [fieldName, pattern] of Object.entries(fieldPatterns)) {
        const element = document.querySelector(`input[${attr}*="${fieldName}" i]`) as HTMLInputElement;
        if (element && isVisible(element)) {
          fields[fieldName] = element;
          detectedFields.push(`${fieldName} (${attr})`);
        }
      }
    }
  }

  function findByContext() {
    // Look for patterns in form structure
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input');
      inputs.forEach((input, index) => {
        if (input.type === 'email' && !fields.email) {
          fields.email = input;
          detectedFields.push('email (type)');
        } else if (input.type === 'tel' && !fields.phone) {
          fields.phone = input;
          detectedFields.push('phone (type)');
        } else if (input.type === 'text' && !fields.firstName && index === 0) {
          // Assume first text input might be first name
          fields.firstName = input;
          detectedFields.push('firstName (position)');
        } else if (input.type === 'text' && !fields.lastName && fields.firstName && index === 1) {
          // Assume second text input might be last name
          fields.lastName = input;
          detectedFields.push('lastName (position)');
        }
      });
    });
  }

  function findByPatterns() {
    // Advanced pattern matching for edge cases
    const allInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');

    allInputs.forEach(input => {
      if (!isVisible(input)) return;

      const htmlInput = input as HTMLInputElement;
      const placeholder = htmlInput.placeholder?.toLowerCase() || '';
      const name = htmlInput.name?.toLowerCase() || '';
      const id = input.id?.toLowerCase() || '';

      if (!fields.firstName && (placeholder.includes('first') || name.includes('first') || id.includes('first'))) {
        fields.firstName = input;
        detectedFields.push('firstName (pattern)');
      } else if (!fields.lastName && (placeholder.includes('last') || name.includes('last') || id.includes('last'))) {
        fields.lastName = input;
        detectedFields.push('lastName (pattern)');
      }
    });
  }

  function isVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 &&
           window.getComputedStyle(element).visibility !== 'hidden' &&
           window.getComputedStyle(element).display !== 'none';
  }

  // Execute all detection strategies
  detectionStrategies.forEach(strategy => strategy());

  // Handle file inputs with advanced detection
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => {
    if (!isVisible(input)) return;

    const htmlInput = input as HTMLInputElement;
    const label = htmlInput.labels?.[0]?.textContent?.toLowerCase() || '';
    const name = htmlInput.name?.toLowerCase() || '';
    const id = input.id?.toLowerCase() || '';

    if (name.includes('resume') || label.includes('resume') || id.includes('resume')) {
      fields.resumeInput = input;
      detectedFields.push('resume (file)');
    } else if (name.includes('cover') || label.includes('cover') || id.includes('cover')) {
      fields.coverLetterInput = input;
      detectedFields.push('coverLetter (file)');
    } else if (!fields.resumeInput) {
      // Assume first file input is resume if not specified
      fields.resumeInput = input;
      detectedFields.push('resume (default file)');
    }
  });

  // Calculate confidence based on detected fields
  const requiredFields = ['firstName', 'lastName', 'email'];
  const optionalFields = ['phone', 'resumeInput'];
  const detectedRequired = requiredFields.filter(field => fields[field]).length;
  const detectedOptional = optionalFields.filter(field => fields[field]).length;

  const confidence = Math.min(1.0, (detectedRequired * 0.4 + detectedOptional * 0.2 + detectedFields.length * 0.1));

  console.log(`🎯 Advanced field detection: ${detectedFields.length} fields found, ${confidence.toFixed(2)} confidence`);

  return {
    ...fields,
    confidence,
    detectedFields
  };
}

// Ultra-Fast Form Filling with Validation
async function fillFormUltraFast(profile: Profile, session: AutoApplySession): Promise<boolean> {
  const startTime = Date.now();

  try {
    const fields = findFormFieldsAdvanced();
    session.steps.push(`Advanced field detection: ${fields.detectedFields.join(', ')}`);

    if (fields.confidence < 0.3) {
      session.errors.push(`Low confidence field detection (${fields.confidence.toFixed(2)})`);
      return false;
    }

    const fillOperations = [];

    // Prepare fill operations
    const fieldMappings = [
      { field: fields.firstName, value: profile.firstName, name: 'firstName' },
      { field: fields.lastName, value: profile.lastName, name: 'lastName' },
      { field: fields.email, value: profile.email, name: 'email' },
      { field: fields.phone, value: profile.phone, name: 'phone' },
      { field: fields.linkedin, value: profile.linkedin, name: 'linkedin' },
      { field: fields.portfolio, value: profile.portfolio, name: 'portfolio' }
    ];

    // Execute fills in parallel with smart delays
    for (const mapping of fieldMappings) {
      if (mapping.field && mapping.value) {
        fillOperations.push(fillFieldSmart(mapping.field, mapping.value, mapping.name));
      }
    }

    const results = await Promise.allSettled(fillOperations);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;

    session.steps.push(`Ultra-fast filling: ${successful}/${fillOperations.length} fields successful`);
    console.log(`⚡ Ultra-fast form filling completed in ${Date.now() - startTime}ms`);

    return successful >= 3; // At least 3 fields should be filled successfully
  } catch (error) {
    session.errors.push(`Ultra-fast filling failed: ${error}`);
    return false;
  }
}

async function fillFieldSmart(field: HTMLInputElement, value: string, name: string): Promise<boolean> {
  try {
    // Clear field first
    field.value = '';
    field.dispatchEvent(new Event('input', { bubbles: true }));

    // Fill with value
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));

    // Smart validation wait
    if (field.form) {
      // Trigger form validation if available
      field.form.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Wait for validation feedback
    await new Promise(resolve => setTimeout(resolve, 50));

    // Check for validation errors
    if (field.validationMessage) {
      console.warn(`⚠️ ${name} validation: ${field.validationMessage}`);
      return false;
    }

    console.log(`✅ ${name} filled successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${name} filling failed:`, error);
    return false;
  }
}

// Intelligent Apply Button Detection and Clicking
async function findAndClickApplyButton(jobBoard: string, session: AutoApplySession): Promise<boolean> {
  const startTime = Date.now();

  // Multi-strategy button detection
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
        console.log(`🎯 Apply button clicked in ${Date.now() - startTime}ms`);
        return true;
      }
    }
  }

  session.errors.push('No clickable apply button found');
  return false;

  async function findByStandardSelectors(board: string): Promise<HTMLButtonElement | null> {
    const selectors = JOB_BOARD_SELECTORS[board]?.applyButton;
    if (selectors) {
      return document.querySelector(selectors) as HTMLButtonElement;
    }
    return null;
  }

  async function findByAdvancedSelectors(): Promise<HTMLButtonElement | null> {
    const advancedSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      '.apply-button',
      '.submit-button',
      '.job-apply-btn',
      '[data-automation-id*="apply"]',
      '[data-testid*="apply"]',
      'button:contains("Apply")',
      'button:contains("Submit")'
    ];

    for (const selector of advancedSelectors) {
      const element = document.querySelector(selector);
      if (element && isButtonVisible(element)) {
        return element as HTMLButtonElement;
      }
    }
    return null;
  }

  async function findByContextAndBehavior(): Promise<HTMLButtonElement | null> {
    // Look for buttons near forms or with application context
    const forms = document.querySelectorAll('form');
    for (const form of forms) {
      const buttons = form.querySelectorAll('button, input[type="submit"]');
      for (const button of buttons) {
        if (isButtonVisible(button) && isLikelyApplyButton(button)) {
          return button as HTMLButtonElement;
        }
      }
    }
    return null;
  }

  async function findByTextContent(): Promise<HTMLButtonElement | null> {
    const applyKeywords = ['apply', 'submit', 'send', 'join', 'start'];
    const buttons = document.querySelectorAll('button, input[type="submit"]');

    for (const button of buttons) {
      const text = button.textContent?.toLowerCase() || '';
      if (applyKeywords.some(keyword => text.includes(keyword)) && isButtonVisible(button)) {
        return button as HTMLButtonElement;
      }
    }
    return null;
  }

  function isButtonVisible(button: Element): boolean {
    const rect = button.getBoundingClientRect();
    const style = window.getComputedStyle(button);
    return rect.width > 0 && rect.height > 0 &&
           style.visibility !== 'hidden' &&
           style.display !== 'none' &&
           !button.hasAttribute('disabled');
  }

  function isLikelyApplyButton(button: Element): boolean {
    const text = button.textContent?.toLowerCase() || '';
    const className = button.className?.toLowerCase() || '';
    const id = button.id?.toLowerCase() || '';

    return text.includes('apply') || text.includes('submit') ||
           className.includes('apply') || className.includes('submit') ||
           id.includes('apply') || id.includes('submit');
  }
}

async function clickButtonSmart(button: HTMLButtonElement, session: AutoApplySession): Promise<boolean> {
  try {
    // Ensure button is ready
    if (button.hasAttribute('disabled')) {
      session.errors.push('Apply button is disabled');
      return false;
    }

    // Scroll into view smoothly
    button.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 300));

    // Try multiple click methods
    const clickMethods = [
      () => { button.click(); },
      () => { button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); },
      () => {
        // Simulate full mouse interaction
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    ];

    for (const method of clickMethods) {
      try {
        method();
        await new Promise(resolve => setTimeout(resolve, 200));

        // Check if page changed or success indicators appeared
        if (didPageChange() || hasSuccessIndicators()) {
          session.steps.push('Apply button clicked successfully');
          return true;
        }
      } catch (error) {
        console.warn('Click method failed:', error);
      }
    }

    return false;
  } catch (error) {
    session.errors.push(`Button click failed: ${error}`);
    return false;
  }

  function didPageChange(): boolean {
    // Check for URL changes, new elements, or navigation
    return window.location.href !== session.url ||
           document.querySelectorAll('.success, .submitted, .confirmation').length > 0;
  }

  function hasSuccessIndicators(): boolean {
    const indicators = [
      '.application-success',
      '.success-message',
      '.application-submitted',
      '.thank-you',
      '.confirmation'
    ];

    return indicators.some(selector => document.querySelector(selector));
  }
}

// Performance Monitoring and Optimization
class AutoApplyPerformanceMonitor {
  private metrics: {
    detectionTime: number;
    fillingTime: number;
    clickTime: number;
    totalTime: number;
    successRate: number;
    retryCount: number;
  } = {
    detectionTime: 0,
    fillingTime: 0,
    clickTime: 0,
    totalTime: 0,
    successRate: 0,
    retryCount: 0
  };

  startTimer(metric: keyof typeof this.metrics): void {
    (this.metrics as any)[`${metric}Start`] = Date.now();
  }

  endTimer(metric: keyof typeof this.metrics): void {
    const startKey = `${metric}Start` as keyof typeof this.metrics;
    const startTime = this.metrics[startKey] as number;
    if (startTime) {
      this.metrics[metric] = Date.now() - startTime;
    }
  }

  recordSuccess(success: boolean): void {
    this.metrics.successRate = success ? 1 : 0;
  }

  incrementRetry(): void {
    this.metrics.retryCount++;
  }

  getReport(): typeof this.metrics {
    return { ...this.metrics };
  }

  logPerformance(): void {
    console.log('📊 Auto-Apply Performance Report:');
    console.log(`   Detection: ${this.metrics.detectionTime}ms`);
    console.log(`   Filling: ${this.metrics.fillingTime}ms`);
    console.log(`   Clicking: ${this.metrics.clickTime}ms`);
    console.log(`   Total: ${this.metrics.totalTime}ms`);
    console.log(`   Success: ${this.metrics.successRate ? '✅' : '❌'}`);
    console.log(`   Retries: ${this.metrics.retryCount}`);
  }
}

// Enhanced Auto-Apply with Performance Monitoring
async function performAdvancedAutoApply(profile: Profile): Promise<any> {
  const monitor = new AutoApplyPerformanceMonitor();
  const session: AutoApplySession = {
    jobBoard: '',
    startTime: Date.now(),
    steps: [],
    errors: [],
    success: false,
    url: window.location.href
  };

  monitor.startTimer('totalTime');

  try {
    console.log('🚀 Starting Ultra-Advanced Auto-Apply...');

    // Step 1: Analyze page structure
    monitor.startTimer('detectionTime');
    const pageAnalysis = analyzePageStructure();
    session.steps.push(`Page analysis: ${pageAnalysis.formCount} forms, ${pageAnalysis.inputFields} inputs, difficulty: ${pageAnalysis.estimatedDifficulty}`);

    // Step 2: Detect job board
    const detection = detectJobBoard();
    session.jobBoard = detection.name;
    session.steps.push(`Job board: ${detection.name} (${(detection.confidence * 100).toFixed(1)}% confidence)`);

    monitor.endTimer('detectionTime');

    if (detection.name === "unknown" || detection.confidence < 0.3) {
      session.errors.push("Job board detection failed or confidence too low");
      return {
        status: "error",
        message: `Unable to identify job application form. Please ensure you're on a job application page.`,
        details: {
          detection: detection,
          pageAnalysis: pageAnalysis
        },
        session,
      };
    }

    // Step 3: Wait for form readiness with intelligent timing
    const formReady = await waitForFormAdvanced(pageAnalysis, session);
    if (!formReady) {
      return {
        status: "error",
        message: "Application form not ready. Please wait for the page to fully load.",
        session,
      };
    }

    // Step 4: Ultra-fast form filling
    monitor.startTimer('fillingTime');
    const fillSuccess = await fillFormUltraFast(profile, session);
    monitor.endTimer('fillingTime');

    if (!fillSuccess) {
      return {
        status: "error",
        message: "Unable to fill application form. Some required fields may be missing.",
        session,
      };
    }

    // Step 5: Handle file uploads if needed
    if (profile.resume && pageAnalysis.fileInputs > 0) {
      const fileSuccess = await handleFileUploadsAdvanced(profile, session);
      if (!fileSuccess) {
        session.errors.push("File upload failed - you may need to upload files manually");
      }
    }

    // Step 6: Smart apply button detection and clicking
    monitor.startTimer('clickTime');
    const clickSuccess = await findAndClickApplyButton(detection.name, session);
    monitor.endTimer('clickTime');

    monitor.endTimer('totalTime');

    if (fillSuccess && clickSuccess) {
      monitor.recordSuccess(true);
      session.success = true;

      // Verify success
      const verificationSuccess = await verifyApplicationSuccessAdvanced(detection.name, session);

      monitor.logPerformance();

      return {
        status: "success",
        message: verificationSuccess
          ? `Application submitted successfully on ${detection.name}!`
          : `Application submitted on ${detection.name} (verification pending)`,
        jobBoard: detection.name,
        session,
        performance: monitor.getReport(),
      };
    } else {
      monitor.recordSuccess(false);
      monitor.logPerformance();

      return {
        status: "error",
        message: `Auto-apply failed: ${session.errors[session.errors.length - 1] || 'Unknown error'}`,
        jobBoard: detection.name,
        session,
        performance: monitor.getReport(),
      };
    }

  } catch (e) {
    monitor.endTimer('totalTime');
    monitor.recordSuccess(false);
    monitor.logPerformance();

    session.errors.push(`Unexpected error: ${e}`);
    console.error("💥 Unexpected error during auto-apply:", e);

    return {
      status: "error",
      message: `Unexpected error: ${e}`,
      session,
      performance: monitor.getReport(),
    };
  }
}

// Advanced form readiness detection
async function waitForFormAdvanced(analysis: ReturnType<typeof analyzePageStructure>, session: AutoApplySession): Promise<boolean> {
  const timeout = analysis.estimatedDifficulty === 'hard' ? 20000 : analysis.estimatedDifficulty === 'medium' ? 15000 : 10000;
  const startTime = Date.now();

  console.log(`⏳ Waiting for form (timeout: ${timeout}ms, difficulty: ${analysis.estimatedDifficulty})`);

  while (Date.now() - startTime < timeout) {
    // Check for form readiness
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input');
    const buttons = document.querySelectorAll('button, input[type="submit"]');

    if (forms.length > 0 && inputs.length >= 3 && buttons.length > 0) {
      // Additional checks for dynamic content
      const emailInput = document.querySelector('input[type="email"]');
      const textInputs = document.querySelectorAll('input[type="text"]');

      if (emailInput || textInputs.length >= 2) {
        console.log(`✅ Form ready after ${Date.now() - startTime}ms`);
        return true;
      }
    }

    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`⏰ Form readiness timeout after ${Date.now() - startTime}ms`);
  return false;
}

// Advanced file upload handling
async function handleFileUploadsAdvanced(profile: Profile, session: AutoApplySession): Promise<boolean> {
  try {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    let successCount = 0;

    for (const input of fileInputs) {
      if (profile.resume && input) {
        try {
          const htmlInput = input as HTMLInputElement;
          const result = await attachFileToInput(htmlInput, profile.resume);
          if (result.success) {
            successCount++;
            session.steps.push(`File uploaded successfully`);
          } else {
            session.errors.push(`File upload failed: ${result.errors?.join(', ')}`);
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

// Enhanced success verification
async function verifyApplicationSuccessAdvanced(jobBoard: string, session: AutoApplySession): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for page changes

  const successIndicators = [
    '.application-success',
    '.success-message',
    '.application-submitted',
    '.thank-you',
    '.confirmation',
    '.submitted-message',
    '[data-testid*="success"]',
    '[data-testid*="submitted"]'
  ];

  // Check for success elements
  for (const indicator of successIndicators) {
    const element = document.querySelector(indicator);
    if (element && isElementVisible(element)) {
      session.steps.push(`Success indicator found: ${indicator}`);
      return true;
    }
  }

  // Check URL changes
  const currentUrl = window.location.href;
  if (currentUrl.includes('success') || currentUrl.includes('thank') ||
      currentUrl.includes('confirm') || currentUrl.includes('submitted')) {
    session.steps.push('Success detected via URL change');
    return true;
  }

  // Check for new page content
  const bodyText = document.body?.textContent?.toLowerCase() || '';
  if (bodyText.includes('success') || bodyText.includes('submitted') ||
      bodyText.includes('thank you') || bodyText.includes('confirmed')) {
    session.steps.push('Success detected via page content');
    return true;
  }

  return false;

  function isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 &&
           window.getComputedStyle(element).visibility !== 'hidden';
  }
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

// This function has been removed due to duplication - keeping only the comment
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

    if (detection.name === "unknown" || detection.confidence < 0.4) {
      session.errors.push("Job board detection failed or confidence too low");

      // Provide helpful guidance based on detection results
      let guidanceMessage = "This job board is not fully supported yet.";
      if (detection.confidence >= 0.4) {
        guidanceMessage =
          "This appears to be a job application page, but the system needs more information to proceed safely.";
      }

      const detailedMessage =
        detection.confidence > 0
          ? `${guidanceMessage}\n\nDetected: ${detection.url}\nConfidence: ${(
              detection.confidence * 100
            ).toFixed(1)}%\n${
              detection.notes || ""
            }\n\nTry using manual application or contact support for this platform.`
          : `Unable to detect job application form on this page.\n\nPlease ensure you're on a job application page with a visible application form.\n\nCurrent URL: ${detection.url}`;

      return {
        status: "error",
        message: detailedMessage,
        details: {
          detectedBoard: detection.name,
          confidence: detection.confidence,
          url: detection.url,
          notes: detection.notes,
        },
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
    // Handle different message types
    switch (message.action || message.type) {
          case "autoApply":
    case "AUTO_APPLY":
        console.log("🚀 Ultra-Advanced Auto-Apply triggered");
        console.log("📋 Profile data received:", {
          hasFirstName: !!message.profile?.firstName,
          hasLastName: !!message.profile?.lastName,
          hasEmail: !!message.profile?.email,
          hasPhone: !!message.profile?.phone,
          hasResume: !!message.profile?.resume,
          resumeLength: message.profile?.resume?.length || 0
        });

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
              url: window.location.href
            },
            performance: {
              detectionTime: 0,
              fillingTime: 0,
              clickTime: 0,
              totalTime: Date.now() - Date.now(),
              successRate: 0,
              retryCount: 0
            }
          });
        }
        break;

      case "ping":
        // Respond to ping to verify content script is loaded
        sendResponse({ status: "pong", timestamp: Date.now() });
        break;

      default:
        sendResponse({ status: "error", message: "Unknown action" });
        break;
    }

    // Return true to indicate we'll respond asynchronously
    return true;
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

// Test function for users to check current page support
function testCurrentPage(): void {
  const detection = detectJobBoard();
  console.log("🔍 USwift Job Board Detection Test");
  console.log("=====================================");
  console.log(`📍 Current URL: ${detection.url}`);
  console.log(`🎯 Detected Platform: ${detection.name}`);
  console.log(`📊 Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
  console.log(`📝 Notes: ${detection.notes || "None"}`);

  if (detection.name === "unknown") {
    console.log("❌ This page is not recognized as a job application page.");
    console.log(
      "💡 Make sure you're on a job application page with a visible form."
    );
  } else if (detection.confidence >= 0.8) {
    console.log("✅ This platform is well supported!");
    console.log("🚀 Auto-apply should work reliably here.");
  } else if (detection.confidence >= 0.5) {
    console.log("⚠️ This platform has basic support.");
    console.log("🔄 Auto-apply may work but could need improvements.");
  } else {
    console.log(
      "❓ This page might be a job application but needs verification."
    );
    console.log("🧪 Test auto-apply to see if it works.");
  }

  console.log("=====================================");
  console.log(
    "💡 Tip: Run this function on different job pages to see support levels."
  );
}

// Make test function globally available for console use
(window as any).testJobBoard = testCurrentPage;

// Initialize content script
function init(): void {
  const detection = detectJobBoard();
  if (detection.name !== "unknown") {
    console.log(
      `Uswift loaded on ${detection.name} (${detection.url}) - ${(
        detection.confidence * 100
      ).toFixed(1)}% confidence`
    );
    injectIndicator();
  }
}

// Content script health check
function healthCheck(): void {
  console.log("🔍 USwift Content Script Health Check");
  console.log("=====================================");
  console.log(`📍 Current URL: ${window.location.href}`);
  console.log(`🏷️  Hostname: ${window.location.hostname}`);
  console.log(`📄 Page Title: ${document.title}`);
  console.log(`🔧 Content Script Status: ✅ LOADED`);

  // Check for job application indicators
  const emailInputs = document.querySelectorAll('input[type="email"]');
  const fileInputs = document.querySelectorAll('input[type="file"]');
  const applyButtons = document.querySelectorAll(
    'button, input[type="submit"]'
  );

  console.log(`📧 Email inputs found: ${emailInputs.length}`);
  console.log(`📎 File inputs found: ${fileInputs.length}`);
  console.log(`🔘 Submit buttons found: ${applyButtons.length}`);

  // Check for common job application patterns
  const hasJobKeywords =
    /\b(job|career|apply|application|hiring|recruit)\b/i.test(document.title) ||
    /\b(job|career|apply|application|hiring|recruit)\b/i.test(
      document.body?.textContent || ""
    );

  console.log(
    `🎯 Job-related content detected: ${hasJobKeywords ? "✅ YES" : "❌ NO"}`
  );

  console.log("=====================================");
  console.log("💡 If you see this message, the content script is working!");
  console.log(
    "🚀 Try auto-apply now or run testJobBoard() for platform detection."
  );
}

// Make health check globally available
(window as any).checkUSwiftHealth = healthCheck;

// Initialize content script with better error handling
function initWithRetry(): void {
  try {
    console.log("🚀 USwift Content Script initializing...");
    init();
    console.log("✅ USwift Content Script initialized successfully");
  } catch (error) {
    console.error("❌ USwift Content Script initialization failed:", error);
    // Retry after a short delay
    setTimeout(() => {
      try {
        console.log("🔄 Retrying USwift Content Script initialization...");
        init();
        console.log("✅ USwift Content Script initialized on retry");
      } catch (retryError) {
        console.error("❌ USwift Content Script retry failed:", retryError);
      }
    }, 1000);
  }
}

// Wait for DOM to be ready with multiple fallback strategies
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWithRetry);
} else if (document.readyState === "interactive") {
  // DOM is loaded but resources might still be loading
  setTimeout(initWithRetry, 100);
} else {
  // DOM is already loaded
  initWithRetry();
}

// Additional fallback for pages that load content dynamically
setTimeout(() => {
  if (!(window as any).uswiftInitialized) {
    console.log("🔄 Late initialization attempt for USwift Content Script");
    initWithRetry();
  }
}, 3000);

// Mark as initialized
(window as any).uswiftInitialized = true;
