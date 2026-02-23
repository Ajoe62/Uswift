// Per-board adapter scaffolding - implement board-specific flows here.
// Each adapter may implement: fillForm(profile), handleFileUpload(profile), clickApply()

export type AdapterResult = {
  success: boolean;
  details?: any;
  errors?: string[];
  warnings?: string[];
};

export interface Profile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  resume?: string;
  coverLetter?: string;
  linkedin?: string;
  portfolio?: string;
}

type DetectedFormFields = {
  firstName?: HTMLInputElement;
  lastName?: HTMLInputElement;
  email?: HTMLInputElement;
  phone?: HTMLInputElement;
  resumeInput?: HTMLInputElement;
  coverLetterInput?: HTMLInputElement;
  linkedin?: HTMLInputElement;
  portfolio?: HTMLInputElement;
};

export interface BoardAdapter {
  fillForm?: (profile: Profile) => Promise<AdapterResult> | AdapterResult;
  handleFileUpload?: (profile: Profile) => Promise<AdapterResult> | AdapterResult;
  clickApply?: () => Promise<AdapterResult> | AdapterResult;
  detectFormReady?: () => Promise<boolean> | boolean;
}

// Helper: fetch a file URL (profile.resume expected to be a public/signed URL)
export async function attachFileToInput(
  input: HTMLInputElement,
  fileUrl: string
): Promise<AdapterResult> {
  try {
    if (!fileUrl) return { success: false, details: 'no file url' };
    const res = await fetch(fileUrl, { mode: 'cors' });
    if (!res.ok) return { success: false, details: `fetch failed ${res.status}` };
    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition') || '';
    let filename = 'file';
    const m = /filename\*=UTF-8''([^;]+)/i.exec(disposition) || /filename="?([^";]+)/i.exec(disposition);
    if (m && m[1]) filename = decodeURIComponent(m[1]);
    const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });

    // Try DataTransfer approach
    try {
      const dt = new DataTransfer();
      dt.items.add(file);
      Object.defineProperty(input, 'files', { value: dt.files, writable: false });
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return { success: true };
    } catch (e) {
      return { success: false, details: e };
    }
  } catch (e) {
    return { success: false, details: e };
  }
}

// Minimal greenhouse adapter as example (fills fields using selectors similar to selectors map)
export const greenhouseAdapter: BoardAdapter = {
  async fillForm(profile) {
    try {
      const first = document.querySelector('#first_name, input[name="first_name"]') as HTMLInputElement | null;
      const last = document.querySelector('#last_name, input[name="last_name"]') as HTMLInputElement | null;
      const email = document.querySelector('#email, input[name="email"]') as HTMLInputElement | null;
      const phone = document.querySelector('#phone, input[name="phone"]') as HTMLInputElement | null;
      if (first && profile.firstName) { first.value = profile.firstName; first.dispatchEvent(new Event('input',{bubbles:true})); }
      if (last && profile.lastName) { last.value = profile.lastName; last.dispatchEvent(new Event('input',{bubbles:true})); }
      if (email && profile.email) { email.value = profile.email; email.dispatchEvent(new Event('input',{bubbles:true})); }
      if (phone && profile.phone) { phone.value = profile.phone; phone.dispatchEvent(new Event('input',{bubbles:true})); }
      return { success: true };
    } catch (e) {
      return { success: false, details: e };
    }
  },
  async handleFileUpload(profile) {
    try {
      if (!profile || !profile.resume) return { success: false, details: 'no resume provided' };
      // Find a file input that looks like a resume field
      const fileInput = document.querySelector('input[type="file"][name*="resume"], input[type="file"][id*="resume"], input[type="file"]') as HTMLInputElement | null;
      if (!fileInput) return { success: false, details: 'no file input found' };

      // Helper: fetch file URL and create a File object
      async function fetchFile(url: string): Promise<File | null> {
        try {
          const res = await fetch(url, { mode: 'cors' });
          if (!res.ok) return null;
          const blob = await res.blob();
          const disposition = res.headers.get('content-disposition') || '';
          let filename = 'resume';
          const m = /filename\*=UTF-8''([^;]+)/i.exec(disposition) || /filename="?([^";]+)/i.exec(disposition);
          if (m && m[1]) filename = decodeURIComponent(m[1]);
          const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
          return file;
        } catch (e) {
          console.warn('fetchFile failed', e);
          return null;
        }
      }

      const file = await fetchFile(profile.resume);
      if (!file) return { success: false, details: 'failed to fetch resume' };

      // Use DataTransfer to populate input.files
      try {
        const dt = new DataTransfer();
        dt.items.add(file);
        // assign files and dispatch change
        Object.defineProperty(fileInput, 'files', { value: dt.files, writable: false });
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true };
      } catch (e) {
        // Some pages may forbid programmatic file assignment; surface the error
        return { success: false, details: e };
      }
    } catch (e) {
      return { success: false, details: e };
    }
  },
  async clickApply() {
    try {
      const btn = document.querySelector('[data-source="apply_button"], .application-header .btn-primary') as HTMLElement | null;
      if (btn) { try { btn.click(); } catch(e){ btn.dispatchEvent(new MouseEvent('click',{bubbles:true})); } return { success: true }; }
      return { success: false };
    } catch (e) { return { success: false, details: e }; }
  }
};

// Lever.co Adapter
export const leverAdapter: BoardAdapter = {
  async detectFormReady() {
    const formSelectors = [
      ".application-form",
      ".posting-apply-form",
      '[data-qa="application-form"]',
    ];

    for (const selector of formSelectors) {
      const form = document.querySelector(selector) as HTMLElement;
      if (form && form.offsetParent !== null) {
        return true;
      }
    }

    return false;
  },

  async fillForm(profile) {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const fields = findFormFields();

      // Lever has specific field structures
      const textFields = [
        {
          field: fields.firstName,
          value: profile.firstName,
          name: "firstName",
        },
        { field: fields.lastName, value: profile.lastName, name: "lastName" },
        { field: fields.email, value: profile.email, name: "email" },
        { field: fields.phone, value: profile.phone, name: "phone" },
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
        warnings,
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Form filling failed: ${e}`],
      };
    }
  },

  async handleFileUpload(profile) {
    const errors: string[] = [];

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
        errors,
      };
    } catch (e) {
      return {
        success: false,
        errors: [`File upload failed: ${e}`],
      };
    }
  },

  async clickApply() {
    try {
      const applySelectors = [
        ".apply-button",
        ".postings-btn",
        'button[type="submit"]',
        '[data-qa="apply-button"]',
      ];

      for (const selector of applySelectors) {
        const button = document.querySelector(selector) as HTMLElement;
        if (button && button.offsetParent !== null) {
          button.click();
          return { success: true, details: { selector } };
        }
      }

      return {
        success: false,
        errors: ["Apply button not found"],
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Click apply failed: ${e}`],
      };
    }
  },
};

// Workday Adapter
export const workdayAdapter: BoardAdapter = {
  async detectFormReady() {
    const formSelectors = [
      '[data-automation-id="applicationForm"]',
      ".css-1psuvku",
      ".application-form",
    ];

    for (const selector of formSelectors) {
      const form = document.querySelector(selector) as HTMLElement;
      if (form && form.offsetParent !== null) {
        return true;
      }
    }

    return false;
  },

  async fillForm(profile) {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Workday uses data-automation-id extensively
      const selectors = {
        firstName: 'input[data-automation-id*="firstName"]',
        lastName: 'input[data-automation-id*="lastName"]',
        email: 'input[data-automation-id*="email"]',
        phone: 'input[data-automation-id*="phone"]',
      };

      const textFields = [
        {
          selector: selectors.firstName,
          value: profile.firstName,
          name: "firstName",
        },
        {
          selector: selectors.lastName,
          value: profile.lastName,
          name: "lastName",
        },
        { selector: selectors.email, value: profile.email, name: "email" },
        { selector: selectors.phone, value: profile.phone, name: "phone" },
      ];

      for (const { selector, value, name } of textFields) {
        if (value) {
          const field = document.querySelector(selector) as HTMLInputElement;
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
        warnings,
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Form filling failed: ${e}`],
      };
    }
  },

  async clickApply() {
    try {
      const applySelectors = [
        '[data-automation-id="apply"]',
        'button[type="submit"]',
        ".css-1psuvku",
      ];

      for (const selector of applySelectors) {
        const button = document.querySelector(selector) as HTMLElement;
        if (button && button.offsetParent !== null) {
          button.click();
          return { success: true, details: { selector } };
        }
      }

      return {
        success: false,
        errors: ["Apply button not found"],
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Click apply failed: ${e}`],
      };
    }
  },
};

// LinkedIn Adapter
export const linkedinAdapter: BoardAdapter = {
  async detectFormReady() {
    const formSelectors = [
      ".jobs-easy-apply-content",
      '[data-test-modal-id="easy-apply-modal"]',
      ".artdeco-modal",
    ];

    for (const selector of formSelectors) {
      const form = document.querySelector(selector) as HTMLElement;
      if (form && form.offsetParent !== null) {
        return true;
      }
    }

    return false;
  },

  async fillForm(profile) {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const fields = findFormFields();

      // LinkedIn Easy Apply specific selectors
      const linkedinFields = [
        {
          field: fields.firstName,
          value: profile.firstName,
          name: "firstName",
        },
        { field: fields.lastName, value: profile.lastName, name: "lastName" },
        { field: fields.email, value: profile.email, name: "email" },
        { field: fields.phone, value: profile.phone, name: "phone" },
      ];

      for (const { field, value, name } of linkedinFields) {
        if (field && value) {
          try {
            field.value = value;
            field.dispatchEvent(new Event("input", { bubbles: true }));
            field.dispatchEvent(new Event("change", { bubbles: true }));
            field.dispatchEvent(new Event("blur", { bubbles: true }));

            await new Promise((resolve) => setTimeout(resolve, 150));

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
        warnings,
        details: { platform: "LinkedIn Easy Apply" },
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Form filling failed: ${e}`],
      };
    }
  },

  async handleFileUpload(profile) {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const fields = findFormFields();

      if (profile.resume && fields.resumeInput) {
        const result = await attachFileToInput(
          fields.resumeInput,
          profile.resume
        );
        if (!result.success) {
          errors.push(`Resume upload failed: ${result.errors?.join(", ")}`);
        } else {
          warnings.push(...(result.warnings || []));
        }
      }

      return {
        success: errors.length === 0,
        errors,
        warnings,
      };
    } catch (e) {
      return {
        success: false,
        errors: [`File upload failed: ${e}`],
      };
    }
  },

  async clickApply() {
    try {
      const applySelectors = [
        ".jobs-apply-button",
        '[data-control-name="jobdetails_topcard_inapply"]',
        ".artdeco-button--primary",
        'button[aria-label*="Easy Apply" i]',
      ];

      for (const selector of applySelectors) {
        const button = document.querySelector(selector) as HTMLElement;
        if (button && button.offsetParent !== null) {
          if (
            button.hasAttribute("disabled") ||
            button.getAttribute("aria-disabled") === "true"
          ) {
            return {
              success: false,
              errors: ["Apply button is disabled"],
            };
          }

          button.click();
          return { success: true, details: { selector, platform: "LinkedIn" } };
        }
      }

      return {
        success: false,
        errors: ["Apply button not found"],
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Click apply failed: ${e}`],
      };
    }
  },
};

// Indeed Adapter
export const indeedAdapter: BoardAdapter = {
  async detectFormReady() {
    const formSelectors = [
      "#ia-container",
      ".ia-BasePage-content",
      '[data-testid="IndeedApplyForm"]',
    ];

    for (const selector of formSelectors) {
      const form = document.querySelector(selector) as HTMLElement;
      if (form && form.offsetParent !== null) {
        return true;
      }
    }

    return false;
  },

  async fillForm(profile) {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const fields = findFormFields();

      const textFields = [
        {
          field: fields.firstName,
          value: profile.firstName,
          name: "firstName",
        },
        { field: fields.lastName, value: profile.lastName, name: "lastName" },
        { field: fields.email, value: profile.email, name: "email" },
        { field: fields.phone, value: profile.phone, name: "phone" },
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
        }
      }

      return {
        success: errors.length === 0,
        errors,
        warnings,
        details: { platform: "Indeed" },
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Form filling failed: ${e}`],
      };
    }
  },

  async handleFileUpload(profile) {
    const errors: string[] = [];

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

      return {
        success: errors.length === 0,
        errors,
      };
    } catch (e) {
      return {
        success: false,
        errors: [`File upload failed: ${e}`],
      };
    }
  },

  async clickApply() {
    try {
      const applySelectors = [
        ".ia-continueButton",
        '[data-testid="ApplyButton"]',
        'button[type="submit"]',
        ".indeed-apply-button",
      ];

      for (const selector of applySelectors) {
        const button = document.querySelector(selector) as HTMLElement;
        if (button && button.offsetParent !== null) {
          button.click();
          return { success: true, details: { selector, platform: "Indeed" } };
        }
      }

      return {
        success: false,
        errors: ["Apply button not found"],
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Click apply failed: ${e}`],
      };
    }
  },
};

// SmartRecruiters Adapter
export const smartrecruitersAdapter: BoardAdapter = {
  async detectFormReady() {
    const formSelectors = [
      ".application-form",
      "#st-apply",
      '[data-test="application-form"]',
    ];

    for (const selector of formSelectors) {
      const form = document.querySelector(selector) as HTMLElement;
      if (form && form.offsetParent !== null) {
        return true;
      }
    }

    return false;
  },

  async fillForm(profile) {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const fields = findFormFields();

      const textFields = [
        {
          field: fields.firstName,
          value: profile.firstName,
          name: "firstName",
        },
        { field: fields.lastName, value: profile.lastName, name: "lastName" },
        { field: fields.email, value: profile.email, name: "email" },
        { field: fields.phone, value: profile.phone, name: "phone" },
        { field: fields.linkedin, value: profile.linkedin, name: "linkedin" },
      ];

      for (const { field, value, name } of textFields) {
        if (field && value) {
          try {
            field.value = value;
            field.dispatchEvent(new Event("input", { bubbles: true }));
            field.dispatchEvent(new Event("change", { bubbles: true }));

            await new Promise((resolve) => setTimeout(resolve, 150));

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
        warnings,
        details: { platform: "SmartRecruiters" },
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Form filling failed: ${e}`],
      };
    }
  },

  async handleFileUpload(profile) {
    const errors: string[] = [];

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
        errors,
      };
    } catch (e) {
      return {
        success: false,
        errors: [`File upload failed: ${e}`],
      };
    }
  },

  async clickApply() {
    try {
      const applySelectors = [
        ".button-apply",
        'button[type="submit"]',
        '[data-test="submit-application"]',
        ".apply-button",
      ];

      for (const selector of applySelectors) {
        const button = document.querySelector(selector) as HTMLElement;
        if (button && button.offsetParent !== null) {
          button.click();
          return {
            success: true,
            details: { selector, platform: "SmartRecruiters" },
          };
        }
      }

      return {
        success: false,
        errors: ["Apply button not found"],
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Click apply failed: ${e}`],
      };
    }
  },
};

// Generic Adapter (Fallback for unknown platforms)
export const genericAdapter: BoardAdapter = {
  async detectFormReady() {
    // Look for common form elements
    const forms = document.querySelectorAll("form");
    for (const form of Array.from(forms)) {
      const hasEmailInput = form.querySelector('input[type="email"]');
      const hasFileInput = form.querySelector('input[type="file"]');
      if (hasEmailInput && form.offsetParent !== null) {
        return true;
      }
    }
    return false;
  },

  async fillForm(profile) {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const fields = findFormFields();

      const textFields = [
        {
          field: fields.firstName,
          value: profile.firstName,
          name: "firstName",
        },
        { field: fields.lastName, value: profile.lastName, name: "lastName" },
        { field: fields.email, value: profile.email, name: "email" },
        { field: fields.phone, value: profile.phone, name: "phone" },
        { field: fields.linkedin, value: profile.linkedin, name: "linkedin" },
        {
          field: fields.portfolio,
          value: profile.portfolio,
          name: "portfolio",
        },
      ];

      for (const { field, value, name } of textFields) {
        if (field && value) {
          try {
            field.value = value;
            field.dispatchEvent(new Event("input", { bubbles: true }));
            field.dispatchEvent(new Event("change", { bubbles: true }));
            field.dispatchEvent(new Event("blur", { bubbles: true }));

            await new Promise((resolve) => setTimeout(resolve, 100));

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
        warnings,
        details: {
          platform: "Generic",
          fieldsFound: Object.keys(fields).length,
        },
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Form filling failed: ${e}`],
      };
    }
  },

  async handleFileUpload(profile) {
    const errors: string[] = [];

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
        errors,
      };
    } catch (e) {
      return {
        success: false,
        errors: [`File upload failed: ${e}`],
      };
    }
  },

  async clickApply() {
    try {
      // Generic button detection
      const applySelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:contains("Apply")',
        'button:contains("Submit")',
        ".apply-button",
        ".submit-button",
        '[role="button"][aria-label*="apply" i]',
      ];

      for (const selector of applySelectors) {
        const button = document.querySelector(selector) as HTMLElement;
        if (button && button.offsetParent !== null) {
          const buttonText = button.textContent?.toLowerCase() || "";
          if (buttonText.includes("apply") || buttonText.includes("submit")) {
            button.click();
            return {
              success: true,
              details: { selector, platform: "Generic" },
            };
          }
        }
      }

      // Fallback: Find any submit button
      const submitButtons = document.querySelectorAll(
        'button[type="submit"], input[type="submit"]'
      );
      for (const button of Array.from(submitButtons)) {
        if ((button as HTMLElement).offsetParent !== null) {
          (button as HTMLElement).click();
          return {
            success: true,
            details: { selector: "submit button", platform: "Generic" },
          };
        }
      }

      return {
        success: false,
        errors: ["Apply button not found"],
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Click apply failed: ${e}`],
      };
    }
  },
};

// Export comprehensive adapter map
export const ADAPTERS: Record<string, BoardAdapter> = {
  greenhouse: greenhouseAdapter,
  // Add 'lever', 'workday', etc. here when you implement their adapters
};
function findFormFields(): DetectedFormFields {
  const pick = (selector: string) =>
    document.querySelector(selector) as HTMLInputElement | null;

  return {
    firstName: pick(
      'input[name*="first" i], input[id*="first" i], input[placeholder*="first" i]'
    ) || undefined,
    lastName: pick(
      'input[name*="last" i], input[id*="last" i], input[placeholder*="last" i]'
    ) || undefined,
    email:
      pick('input[type="email"], input[name="email"], input[name*="email" i]') ||
      undefined,
    phone:
      pick('input[type="tel"], input[name="phone"], input[name*="phone" i]') ||
      undefined,
    resumeInput:
      pick(
        'input[type="file"][name*="resume" i], input[type="file"][id*="resume" i], input[type="file"]'
      ) || undefined,
    coverLetterInput:
      pick(
        'input[type="file"][name*="cover" i], input[type="file"][id*="cover" i]'
      ) || undefined,
    linkedin:
      pick(
        'input[name*="linkedin" i], input[id*="linkedin" i], input[placeholder*="linkedin" i]'
      ) || undefined,
    portfolio:
      pick(
        'input[name*="portfolio" i], input[id*="portfolio" i], input[name*="website" i], input[type="url"]'
      ) || undefined,
  };
}

