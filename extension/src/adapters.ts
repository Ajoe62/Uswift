// Per-board adapter scaffolding - implement board-specific flows here.
// Each adapter may implement: fillForm(profile), handleFileUpload(profile), clickApply()

export type AdapterResult = { success: boolean; details?: any };

export interface Profile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  resume?: string;
  coverLetter?: string;
}

export interface BoardAdapter {
  fillForm?: (profile: Profile) => Promise<AdapterResult> | AdapterResult;
  handleFileUpload?: (profile: Profile) => Promise<AdapterResult> | AdapterResult;
  clickApply?: () => Promise<AdapterResult> | AdapterResult;
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
  async clickApply() {
    try {
      const btn = document.querySelector('[data-source="apply_button"], .application-header .btn-primary') as HTMLElement | null;
      if (btn) { try { btn.click(); } catch(e){ btn.dispatchEvent(new MouseEvent('click',{bubbles:true})); } return { success: true }; }
      return { success: false };
    } catch (e) { return { success: false, details: e }; }
  }
};

// Export adapter map
export const ADAPTERS: Record<string, BoardAdapter> = {
  greenhouse: greenhouseAdapter,
  // Add 'lever', 'workday', etc. here when you implement their adapters
};
