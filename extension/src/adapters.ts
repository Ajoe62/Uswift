// Advanced Job Board Adapters with High Precision
// Each adapter implements intelligent form detection, validation, and error recovery

export type AdapterResult = {
  success: boolean;
  details?: any;
  warnings?: string[];
  errors?: string[];
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
  location?: string;
}

export interface BoardAdapter {
  fillForm?: (profile: Profile) => Promise<AdapterResult> | AdapterResult;
  handleFileUpload?: (
    profile: Profile
  ) => Promise<AdapterResult> | AdapterResult;
  clickApply?: () => Promise<AdapterResult> | AdapterResult;
  validateForm?: () => Promise<AdapterResult> | AdapterResult;
  detectFormReady?: () => Promise<boolean>;
}

// Advanced File Upload with Multiple Strategies
export async function attachFileToInput(
  input: HTMLInputElement,
  fileUrl: string
): Promise<AdapterResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    if (!fileUrl) {
      return { success: false, errors: ["No file URL provided"] };
    }

    // Validate input element
    if (!input || input.type !== "file") {
      return { success: false, errors: ["Invalid file input element"] };
    }

    const res = await fetch(fileUrl, {
      mode: "cors",
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    if (!res.ok) {
      return {
        success: false,
        errors: [`Failed to fetch file: ${res.status} ${res.statusText}`],
      };
    }

    const blob = await res.blob();
    const disposition = res.headers.get("content-disposition") || "";
    let filename = "document.pdf";

    // Extract filename from headers
    const filenameMatch =
      /filename\*=UTF-8''([^;]+)/i.exec(disposition) ||
      /filename="?([^";]+)/i.exec(disposition);
    if (filenameMatch && filenameMatch[1]) {
      filename = decodeURIComponent(filenameMatch[1]);
    }

    const file = new File([blob], filename, {
      type: blob.type || "application/pdf",
    });

    // Strategy 1: DataTransfer (Modern browsers)
    try {
      const dt = new DataTransfer();
      dt.items.add(file);
      Object.defineProperty(input, "files", {
        value: dt.files,
        writable: false,
      });
      input.dispatchEvent(new Event("change", { bubbles: true }));

      // Verify the file was attached
      if (input.files && input.files.length > 0) {
        return {
          success: true,
          details: { strategy: "DataTransfer", filename },
        };
      }
    } catch (e) {
      errors.push(`DataTransfer failed: ${e}`);
    }

    // Strategy 2: Direct assignment (Fallback)
    try {
      input.files = [file] as any;
      input.dispatchEvent(new Event("change", { bubbles: true }));

      if (input.files && input.files.length > 0) {
        warnings.push("Used fallback file assignment method");
        return {
          success: true,
          warnings,
          details: { strategy: "DirectAssignment", filename },
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
        attemptedStrategies: ["DataTransfer", "DirectAssignment"],
      },
    };
  } catch (e) {
    return {
      success: false,
      errors: [`File attachment failed: ${e}`],
      details: { fileUrl },
    };
  }
}

// Intelligent Form Field Detection
export function findFormFields(): {
  firstName?: HTMLInputElement;
  lastName?: HTMLInputElement;
  email?: HTMLInputElement;
  phone?: HTMLInputElement;
  resumeInput?: HTMLInputElement;
  coverLetterInput?: HTMLInputElement;
  linkedin?: HTMLInputElement;
  portfolio?: HTMLInputElement;
} {
  const fields: any = {};

  // Common selectors for different job boards
  const fieldSelectors = {
    firstName: [
      'input[name="firstName"]',
      'input[name="first_name"]',
      'input[id="first_name"]',
      'input[placeholder*="first name" i]',
      'input[placeholder*="given name" i]',
      'input[data-automation-id*="firstName"]',
      'input[aria-label*="first name" i]',
    ],
    lastName: [
      'input[name="lastName"]',
      'input[name="last_name"]',
      'input[id="last_name"]',
      'input[placeholder*="last name" i]',
      'input[placeholder*="family name" i]',
      'input[data-automation-id*="lastName"]',
      'input[aria-label*="last name" i]',
    ],
    email: [
      'input[type="email"]',
      'input[name="email"]',
      'input[id="email"]',
      'input[placeholder*="email" i]',
      'input[data-automation-id*="email"]',
      'input[aria-label*="email" i]',
    ],
    phone: [
      'input[type="tel"]',
      'input[name="phone"]',
      'input[id="phone"]',
      'input[placeholder*="phone" i]',
      'input[data-automation-id*="phone"]',
      'input[aria-label*="phone" i]',
    ],
    linkedin: [
      'input[name*="linkedin" i]',
      'input[placeholder*="linkedin" i]',
      'input[aria-label*="linkedin" i]',
    ],
    portfolio: [
      'input[name*="portfolio" i]',
      'input[placeholder*="portfolio" i]',
      'input[aria-label*="portfolio" i]',
    ],
  };

  // Find fields using multiple strategies
  Object.entries(fieldSelectors).forEach(([fieldName, selectors]) => {
    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLInputElement;
      if (
        element &&
        element.type !== "hidden" &&
        element.offsetParent !== null
      ) {
        fields[fieldName] = element;
        break;
      }
    }
  });

  // Find file inputs with intelligent detection
  const fileInputs = document.querySelectorAll(
    'input[type="file"]'
  ) as NodeListOf<HTMLInputElement>;
  fileInputs.forEach((input) => {
    if (input.offsetParent === null) return; // Skip hidden inputs

    const label = input.labels?.[0]?.textContent?.toLowerCase() || "";
    const name = input.name?.toLowerCase() || "";
    const id = input.id?.toLowerCase() || "";
    const ariaLabel = input.getAttribute("aria-label")?.toLowerCase() || "";

    if (
      name.includes("resume") ||
      label.includes("resume") ||
      id.includes("resume") ||
      ariaLabel.includes("resume")
    ) {
      fields.resumeInput = input;
    } else if (
      name.includes("cover") ||
      label.includes("cover") ||
      id.includes("cover") ||
      ariaLabel.includes("cover")
    ) {
      fields.coverLetterInput = input;
    } else if (!fields.resumeInput) {
      // First file input is likely resume
      fields.resumeInput = input;
    }
  });

  return fields;
}

// Advanced Greenhouse Adapter
export const greenhouseAdapter: BoardAdapter = {
  async detectFormReady() {
    // Check if application form is loaded and visible
    const formSelectors = [
      ".application-form",
      '[data-test="application-form"]',
      ".job-application-form",
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

      // Fill text fields with intelligent validation
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

            // Wait a bit for validation
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
        details: { fieldsFound: Object.keys(fields).length },
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

      // Handle resume upload
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
          warnings.push(...(resumeResult.warnings || []));
        }
      } else if (profile.resume && !fields.resumeInput) {
        errors.push("Resume input field not found");
      }

      // Handle cover letter upload
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
          warnings.push(...(coverResult.warnings || []));
        }
      }

      return {
        success: errors.length === 0,
        errors,
        warnings,
        details: {
          resumeUploaded: !!(profile.resume && fields.resumeInput),
          coverLetterUploaded: !!(
            profile.coverLetter && fields.coverLetterInput
          ),
        },
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
        '[data-source="apply_button"]',
        ".application-header .btn-primary",
        'button[type="submit"]',
        ".apply-button",
        '[data-test="submit-application"]',
      ];

      for (const selector of applySelectors) {
        const button = document.querySelector(selector) as HTMLElement;
        if (button && button.offsetParent !== null) {
          // Check if button is disabled
          if (
            button.hasAttribute("disabled") ||
            button.getAttribute("aria-disabled") === "true"
          ) {
            return {
              success: false,
              errors: [
                "Apply button is disabled - form may have validation errors",
              ],
            };
          }

          try {
            button.click();
            return { success: true, details: { selector, method: "click" } };
          } catch (e) {
            // Fallback to dispatchEvent
            button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            return {
              success: true,
              details: { selector, method: "dispatchEvent" },
            };
          }
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

  async validateForm() {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const fields = findFormFields();
      const requiredFields = ["firstName", "lastName", "email"];

      // Check required fields
      for (const fieldName of requiredFields) {
        const field = (fields as any)[fieldName];
        if (!field) {
          errors.push(`${fieldName} field is missing`);
        } else if (!field.value.trim()) {
          errors.push(`${fieldName} field is empty`);
        } else if (field.validationMessage) {
          errors.push(`${fieldName}: ${field.validationMessage}`);
        }
      }

      // Check file uploads if required
      if (fields.resumeInput) {
        const resumeLabel = fields.resumeInput.labels?.[0]?.textContent || "";
        if (
          resumeLabel.toLowerCase().includes("required") &&
          fields.resumeInput.files?.length === 0
        ) {
          errors.push("Resume is required but not uploaded");
        }
      }

      return {
        success: errors.length === 0,
        errors,
        warnings,
        details: {
          requiredFieldsChecked: requiredFields.length,
          fileFieldsChecked: !!(fields.resumeInput || fields.coverLetterInput),
        },
      };
    } catch (e) {
      return {
        success: false,
        errors: [`Form validation failed: ${e}`],
      };
    }
  },
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

// Export comprehensive adapter map
export const ADAPTERS: Record<string, BoardAdapter> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
  workday: workdayAdapter,
  // Ready for expansion
  // smartrecruiters: smartrecruitersAdapter,
  // icims: icimsAdapter,
  // bamboohr: bamboohrAdapter,
  // jobvite: jobviteAdapter,
  // taleo: taleoAdapter,
};
