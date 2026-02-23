import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function BillingPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [entitlement, setEntitlement] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const state = searchParams.get('state');

  useEffect(() => {
    const initialize = async () => {
      if (!state) {
        setError('Missing secure session state');
        setLoading(false);
        return;
      }

      try {
        const bridgeResponse = await axios.post(`${API_URL}/api/checkout/bridge/exchange`, {
          state,
        });
        const nextToken = bridgeResponse.data.token;
        const nextUserId = bridgeResponse.data.userId;

        setToken(nextToken);
        setUserId(nextUserId);
        await loadEntitlements(nextToken);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to initialize billing session');
        setLoading(false);
      }
    };

    initialize();
  }, [state]);

  const loadEntitlements = async (authToken: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/entitlements`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setEntitlement(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load billing information');
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    try {
      if (!token || !userId) {
        throw new Error('Missing billing session');
      }

      const bridgeResponse = await axios.post(
        `${API_URL}/api/checkout/bridge/session`,
        { userId, purpose: 'billing_return' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const returnUrl = `${window.location.origin}${window.location.pathname}?state=${encodeURIComponent(bridgeResponse.data.state)}`;

      const response = await axios.post(
        `${API_URL}/api/portal/session`,
        {
          userId,
          returnUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Redirect to Stripe Customer Portal
      window.location.href = response.data.url;
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to open billing portal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-red-100 p-4">
              <svg
                className="w-12 h-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Error
          </h1>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.close()}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
            <p className="text-blue-100">Manage your Uswift Pro subscription</p>
          </div>

          {/* Current Plan */}
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 capitalize">
                      {entitlement?.plan || 'Free'} Plan
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">
                      Status: {entitlement?.status || 'none'}
                    </p>
                  </div>
                  {entitlement?.plan === 'pro' && (
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Active
                    </div>
                  )}
                </div>

                {entitlement?.currentPeriodEnd && (
                  <p className="text-sm text-gray-600 mb-4">
                    Next billing date:{' '}
                    <span className="font-semibold">
                      {new Date(entitlement.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </p>
                )}

                {entitlement?.features && entitlement.features.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Active Features:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {entitlement.features.map((feature: string) => (
                        <div key={feature} className="flex items-center text-sm text-gray-700">
                          <svg
                            className="w-4 h-4 text-green-500 mr-2 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {feature.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Manage Subscription */}
            {entitlement?.plan === 'pro' && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Manage Subscription
                </h2>
                <p className="text-gray-600 mb-4">
                  Update your payment method, change your plan, or cancel your subscription.
                </p>
                <button
                  onClick={openCustomerPortal}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Open Billing Portal
                </button>
              </div>
            )}

            {/* Free Plan - Upgrade CTA */}
            {entitlement?.plan === 'free' && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
                <p className="mb-4 text-blue-100">
                  Unlock automated job applications, AI features, and unlimited applies
                </p>
                <button
                  onClick={() => window.close()}
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            )}

            {/* Footer Actions */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={() => window.close()}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            🔒 All payments are securely processed by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
