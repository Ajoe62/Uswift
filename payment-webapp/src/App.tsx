import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import SuccessPage from './pages/SuccessPage';
import CancelPage from './pages/CancelPage';
import CheckoutPage from './pages/CheckoutPage';
import BillingPage from './pages/BillingPage';
import './App.css';

// Initialize Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
);

function App() {
  return (
    <BrowserRouter>
      <Elements stripe={stripePromise}>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/cancel" element={<CancelPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/" element={<HomePage />} />
          </Routes>
        </div>
      </Elements>
    </BrowserRouter>
  );
}

// Simple homepage
function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Uswift Payment Portal
        </h1>
        <p className="text-gray-600">
          This page is used for payment processing.
        </p>
      </div>
    </div>
  );
}

export default App;
