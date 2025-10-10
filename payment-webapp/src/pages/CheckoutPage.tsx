import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

/**
 * CheckoutPage - Optional custom payment page using Payment Element
 * This is behind a feature flag. Default flow uses Stripe Checkout (hosted)
 */
export default function CheckoutPage() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Upgrade to Uswift Pro
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Unlock automated job applications and AI-powered features
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || processing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {processing ? 'Processing...' : 'Pay Now'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            Secure payment powered by Stripe. Your card details are never stored on our
            servers.
          </p>
        </div>
      </div>
    </div>
  );
}
