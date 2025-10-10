/**
 * PaymentService - MV3-compliant payment integration
 * Handles communication with payment backend without loading remote JS
 */

const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';
const PAY_APP_URL = 'https://pay.uswift.app'; // Payment web app domain

export interface CheckoutOptions {
  priceId: string;
  mode: 'subscription' | 'payment';
  trialPeriodDays?: number;
}

export interface Entitlement {
  plan: 'free' | 'pro';
  status: 'active' | 'past_due' | 'canceled' | 'none';
  currentPeriodEnd?: string;
  features: string[];
}

export interface LicenseValidation {
  valid: boolean;
  plan: 'free' | 'pro';
  expiresAt?: string;
}

class PaymentService {
  private static instance: PaymentService;
  private cachedEntitlement: Entitlement | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  private constructor() {
    this.loadCachedEntitlement();
  }

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Get authentication token for API calls
   */
  private async getAuthToken(): Promise<string> {
    // Get user session from chrome.storage
    const result = await chrome.storage.local.get(['userSession']);
    if (!result.userSession || !result.userSession.token) {
      throw new Error('User not authenticated');
    }
    return result.userSession.token;
  }

  /**
   * Get current user ID
   */
  private async getUserId(): Promise<string> {
    const result = await chrome.storage.local.get(['userSession']);
    if (!result.userSession || !result.userSession.userId) {
      throw new Error('User not authenticated');
    }
    return result.userSession.userId;
  }

  /**
   * Open checkout flow in new tab
   * MV3-compliant: Opens hosted Stripe Checkout page via our backend
   */
  async openCheckout(options: CheckoutOptions): Promise<void> {
    try {
      const token = await this.getAuthToken();
      const userId = await this.getUserId();

      // Create checkout session via backend
      const response = await fetch(`${API_URL}/api/checkout/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          priceId: options.priceId,
          mode: options.mode,
          successUrl: `${PAY_APP_URL}/success?userId=${userId}&token=${token}`,
          cancelUrl: `${PAY_APP_URL}/cancel`,
          trialPeriodDays: options.trialPeriodDays,
          metadata: {
            source: 'extension',
            extensionVersion: chrome.runtime.getManifest().version,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Open checkout in new tab
      await chrome.tabs.create({ url });

      // Listen for payment completion
      this.listenForPaymentCompletion();
    } catch (error: any) {
      console.error('Checkout failed:', error);
      throw error;
    }
  }

  /**
   * Open billing portal (Stripe Customer Portal)
   */
  async openBillingPortal(): Promise<void> {
    try {
      const token = await this.getAuthToken();
      const userId = await this.getUserId();

      // Open billing page in our payment app
      const billingUrl = `${PAY_APP_URL}/billing?userId=${userId}&token=${token}`;
      await chrome.tabs.create({ url: billingUrl });
    } catch (error: any) {
      console.error('Failed to open billing portal:', error);
      throw error;
    }
  }

  /**
   * Get current entitlements (with caching)
   */
  async getEntitlements(forceRefresh: boolean = false): Promise<Entitlement> {
    // Return cached entitlement if still valid
    if (!forceRefresh && this.cachedEntitlement && Date.now() < this.cacheExpiry) {
      return this.cachedEntitlement;
    }

    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_URL}/api/entitlements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch entitlements');
      }

      const entitlement: Entitlement = await response.json();

      // Cache entitlement
      this.cachedEntitlement = entitlement;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;
      await this.saveCachedEntitlement(entitlement);

      return entitlement;
    } catch (error: any) {
      console.error('Failed to get entitlements:', error);

      // Return cached entitlement if available
      if (this.cachedEntitlement) {
        return this.cachedEntitlement;
      }

      // Return default free plan
      return {
        plan: 'free',
        status: 'none',
        features: ['basic_apply', 'profile_storage'],
      };
    }
  }

  /**
   * Validate license (called on extension startup)
   */
  async validateLicense(): Promise<LicenseValidation> {
    try {
      const token = await this.getAuthToken();
      const userId = await this.getUserId();

      const response = await fetch(`${API_URL}/api/licenses/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('License validation failed');
      }

      const validation: LicenseValidation = await response.json();
      return validation;
    } catch (error: any) {
      console.error('License validation failed:', error);

      // Return free plan on error
      return {
        valid: false,
        plan: 'free',
      };
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  async hasFeature(feature: string): Promise<boolean> {
    const entitlement = await this.getEntitlements();
    return entitlement.features.includes(feature);
  }

  /**
   * Listen for payment completion from success page
   */
  private listenForPaymentCompletion(): void {
    // Listen for messages from payment success page
    const messageListener = (
      message: any,
      sender: chrome.runtime.MessageSender
    ) => {
      if (message.type === 'PAYMENT_SUCCESS') {
        // Refresh entitlements immediately
        this.getEntitlements(true);

        // Notify extension
        chrome.runtime.sendMessage({
          type: 'ENTITLEMENT_UPDATED',
          entitlement: message.entitlement,
        });

        // Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '/icon-128.png',
          title: 'Welcome to Uswift Pro! 🎉',
          message: 'Your Pro features are now active.',
        });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
  }

  /**
   * Save entitlement to chrome.storage for offline access
   */
  private async saveCachedEntitlement(entitlement: Entitlement): Promise<void> {
    await chrome.storage.local.set({
      cachedEntitlement: entitlement,
      cachedEntitlementExpiry: this.cacheExpiry,
    });
  }

  /**
   * Load cached entitlement from chrome.storage
   */
  private async loadCachedEntitlement(): Promise<void> {
    const result = await chrome.storage.local.get([
      'cachedEntitlement',
      'cachedEntitlementExpiry',
    ]);

    if (result.cachedEntitlement && result.cachedEntitlementExpiry) {
      this.cachedEntitlement = result.cachedEntitlement;
      this.cacheExpiry = result.cachedEntitlementExpiry;
    }
  }

  /**
   * Clear cached entitlement
   */
  async clearCache(): Promise<void> {
    this.cachedEntitlement = null;
    this.cacheExpiry = 0;
    await chrome.storage.local.remove([
      'cachedEntitlement',
      'cachedEntitlementExpiry',
    ]);
  }

  /**
   * Schedule periodic license validation
   */
  scheduleLicenseValidation(): void {
    // Validate immediately
    this.validateLicense();

    // Set up alarm to validate every 6 hours
    chrome.alarms.create('validateLicense', {
      periodInMinutes: 360, // 6 hours
    });

    // Listen for alarm
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'validateLicense') {
        this.validateLicense().then((validation) => {
          if (!validation.valid) {
            // Downgrade to free plan
            this.clearCache();
            this.getEntitlements(true);
          }
        });
      }
    });
  }
}

export const paymentService = PaymentService.getInstance();
