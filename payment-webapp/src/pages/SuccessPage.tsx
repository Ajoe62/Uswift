import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [entitlement, setEntitlement] = useState<any>(null);

  const sessionId = searchParams.get('session_id');
  const userId = searchParams.get('userId');

  useEffect(() => {
    if (!userId) {
      setStatus('error');
      return;
    }

    // Poll entitlements API until active
    let attempts = 0;
    const maxAttempts = 20; // 20 seconds max

    const pollEntitlements = async () => {
      try {
        const token = searchParams.get('token'); // Extension should pass JWT token

        const response = await axios.get(`${API_URL}/api/entitlements`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;

        if (data.status === 'active') {
          setEntitlement(data);
          setStatus('success');

          // Notify extension (if opened from extension)
          if (window.opener) {
            window.opener.postMessage(
              { type: 'PAYMENT_SUCCESS', entitlement: data },
              '*'
            );
          }
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(pollEntitlements, 1000); // Poll every second
        } else {
          setStatus('error');
        }
      } catch (error) {
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(pollEntitlements, 1000);
        } else {
          setStatus('error');
        }
      }
    };

    // Start polling after a brief delay to allow webhook processing
    setTimeout(pollEntitlements, 2000);
  }, [userId, sessionId, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Activating Your Subscription
            </h1>
            <p className="text-center text-gray-600 mb-4">
              Please wait while we process your payment and activate your Pro features...
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                This usually takes less than 10 seconds. Do not close this window.
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-4">
                <svg
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Welcome to Uswift Pro! 🎉
            </h1>
            <p className="text-center text-gray-600 mb-6">
              Your payment was successful and your Pro features are now active.
            </p>

            {entitlement && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Active Features:</h3>
                <ul className="space-y-2">
                  {entitlement.features.map((feature: string) => (
                    <li key={feature} className="flex items-center text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-green-500 mr-2"
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
                    </li>
                  ))}
                </ul>
                {entitlement.currentPeriodEnd && (
                  <p className="text-xs text-gray-500 mt-4">
                    Next billing date:{' '}
                    {new Date(entitlement.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => window.close()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Close Window
            </button>
            <p className="text-xs text-center text-gray-500 mt-4">
              You can now return to your extension
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-yellow-100 p-4">
                <svg
                  className="w-12 h-12 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Activation Delayed
            </h1>
            <p className="text-center text-gray-600 mb-6">
              Your payment was received, but activation is taking longer than expected.
              Your Pro features will be activated shortly.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                If your features don't activate within 5 minutes, please contact support
                with session ID: <code className="font-mono text-xs">{sessionId}</code>
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
