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

// Export adapter map
export const ADAPTERS: Record<string, BoardAdapter> = {
  greenhouse: greenhouseAdapter,
  // Add 'lever', 'workday', etc. here when you implement their adapters
};
