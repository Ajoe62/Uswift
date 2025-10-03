import React, { useState, useEffect } from 'react';
import { paymentService, Entitlement } from './services/PaymentService';

/**
 * PaymentSettings Component
 * Shows current plan, features, and upgrade/manage buttons
 * MV3-compliant - all payment processing happens on external domain
 */
export default function PaymentSettings() {
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEntitlements();

    // Listen for entitlement updates
    const messageListener = (message: any) => {
      if (message.type === 'ENTITLEMENT_UPDATED') {
        setEntitlement(message.entitlement);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const loadEntitlements = async () => {
    try {
      setLoading(true);
      const ent = await paymentService.getEntitlements();
      setEntitlement(ent);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to load entitlements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: 'monthly' | 'annual') => {
    try {
      setLoading(true);
      const priceId =
        plan === 'monthly'
          ? import.meta.env.VITE_PRICE_PRO_MONTHLY
          : import.meta.env.VITE_PRICE_PRO_ANNUAL;

      if (!priceId) {
        throw new Error('Price ID not configured. Please check your environment variables.');
      }

      await paymentService.openCheckout({
        priceId,
        mode: 'subscription',
        trialPeriodDays: import.meta.env.VITE_FEATURE_FREE_TRIAL === 'true' ? 14 : undefined,
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Upgrade failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setLoading(true);
      await paymentService.openBillingPortal();
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to open billing portal:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !entitlement) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !entitlement) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={loadEntitlements}
          className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isPro = entitlement?.plan === 'pro';
  const isActive = entitlement?.status === 'active';

  return (
    <div className="space-y-4">
      {/* Current Plan Card */}
      <div
        className={`rounded-xl p-6 ${
          isPro
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold capitalize">{entitlement?.plan || 'Free'} Plan</h3>
            <p className={`text-sm ${isPro ? 'text-blue-100' : 'text-gray-600'} capitalize`}>
              Status: {entitlement?.status || 'none'}
            </p>
          </div>
          {isPro && isActive && (
            <div className="bg-white bg-opacity-20 backdrop-blur px-3 py-1 rounded-full">
              <span className="text-xs font-semibold">✓ Active</span>
            </div>
          )}
        </div>

        {entitlement?.currentPeriodEnd && (
          <p className={`text-xs ${isPro ? 'text-blue-100' : 'text-gray-600'} mb-4`}>
            Next billing: {new Date(entitlement.currentPeriodEnd).toLocaleDateString()}
          </p>
        )}

        {/* Features List */}
        {entitlement?.features && entitlement.features.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <div className="grid grid-cols-2 gap-2">
              {entitlement.features.slice(0, 6).map((feature) => (
                <div key={feature} className="flex items-center text-xs">
                  <svg
                    className={`w-3 h-3 mr-1 flex-shrink-0 ${
                      isPro ? 'text-white' : 'text-green-500'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="truncate">
                    {feature.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {isPro ? (
        <button
          onClick={handleManageBilling}
          disabled={loading}
          className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Opening...' : 'Manage Billing'}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white">
            <h4 className="font-bold mb-1">Unlock Pro Features</h4>
            <ul className="text-xs space-y-1 mb-3 text-blue-100">
              <li>✓ Automated job applications</li>
              <li>✓ AI-powered resume optimization</li>
              <li>✓ Unlimited applications</li>
              <li>✓ Priority support</li>
            </ul>
            <div className="flex gap-2">
              <button
                onClick={() => handleUpgrade('monthly')}
                disabled={loading}
                className="flex-1 bg-white text-blue-600 hover:bg-gray-100 disabled:bg-gray-300 font-semibold py-2 px-3 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Loading...' : 'Monthly $9.99'}
              </button>
              <button
                onClick={() => handleUpgrade('annual')}
                disabled={loading}
                className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-colors backdrop-blur"
              >
                {loading ? 'Loading...' : 'Annual $99'}
              </button>
            </div>
            {import.meta.env.VITE_FEATURE_FREE_TRIAL === 'true' && (
              <p className="text-xs text-center text-blue-100 mt-2">
                14-day free trial • Cancel anytime
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      {/* Security Notice */}
      <p className="text-xs text-center text-gray-500">
        🔒 Secure payment by Stripe • No card details stored
      </p>
    </div>
  );
}
