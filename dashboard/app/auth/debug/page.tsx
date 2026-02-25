'use client';

import { useEffect, useState } from 'react';

type Diagnostics = {
  timestamp: string;
  request: {
    origin: string;
    host: string;
    path: string;
    inferredCallbackUrl: string;
  };
  env: Record<string, boolean>;
  supabase: {
    projectUrlHost: string | null;
    derivedProviderCallbackUrl: string | null;
  };
  oauthRequiredAllowlist: {
    googleJavaScriptOrigins: string[];
    googleRedirectUris: string[];
    supabaseRedirectUrls: string[];
  };
  warnings: string[];
};

export default function AuthDebugPage() {
  const [data, setData] = useState<Diagnostics | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/auth/diagnostics', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Diagnostics request failed (${res.status})`);
        }
        return res.json();
      })
      .then((json) => {
        if (mounted) setData(json);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">OAuth Diagnostics</h1>
        <p className="text-sm text-gray-600 mb-6">
          Use this page on localhost and on Vercel to confirm callback routing and env wiring.
        </p>

        {loading && <p className="text-gray-600">Loading diagnostics...</p>}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {data.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h2 className="font-semibold text-amber-900 mb-2">Warnings</h2>
                <ul className="list-disc pl-5 text-sm text-amber-800 space-y-1">
                  {data.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <section>
              <h2 className="font-semibold text-gray-900 mb-2">Current Deployment Request</h2>
              <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
{JSON.stringify(data.request, null, 2)}
              </pre>
            </section>

            <section>
              <h2 className="font-semibold text-gray-900 mb-2">Environment Presence (sanitized)</h2>
              <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
{JSON.stringify(data.env, null, 2)}
              </pre>
            </section>

            <section>
              <h2 className="font-semibold text-gray-900 mb-2">Supabase Derived Values</h2>
              <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
{JSON.stringify(data.supabase, null, 2)}
              </pre>
            </section>

            <section>
              <h2 className="font-semibold text-gray-900 mb-2">Required OAuth Allowlists</h2>
              <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
{JSON.stringify(data.oauthRequiredAllowlist, null, 2)}
              </pre>
            </section>

            <section className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h2 className="font-semibold text-blue-900 mb-2">How to Use This Page</h2>
              <ol className="list-decimal pl-5 text-sm text-blue-900 space-y-1">
                <li>Open this page locally at <code>/auth/debug</code> and confirm local callback URL is `http://localhost:3000/auth/callback`.</li>
                <li>Open this page on Vercel and confirm request origin is `https://uswift-dashboard.vercel.app`.</li>
                <li>Open <code>/auth/callback</code> directly on Vercel; if it still shows Vercel 404, the issue is deployment/domain routing, not app code.</li>
                <li>Copy the derived Supabase callback URL into Google Cloud redirect URIs if missing.</li>
              </ol>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

