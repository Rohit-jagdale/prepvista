'use client';

import { useState, useEffect } from 'react';
import { X, Check, CreditCard, Smartphone, Building2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  subscriptionStatus?: {
    hasUsedTrial: boolean;
    isSubscribed: boolean;
    needsPayment: boolean;
  };
}

interface PaymentPlan {
  id: 'monthly' | 'yearly';
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  popular?: boolean;
}

const paymentPlans: PaymentPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 9.99,
    description: 'Perfect for short-term preparation',
    features: [
      'Unlimited practice sessions',
      'All exam categories',
      'AI-powered questions',
      'Progress tracking',
      'Achievement system'
    ]
  },
  {
    id: 'yearly',
    name: 'Yearly Plan',
    price: 99.99,
    originalPrice: 119.88,
    description: 'Best value for serious preparation',
    features: [
      'Everything in Monthly Plan',
      '17% savings',
      'Priority support',
      'Advanced analytics',
      'Early access to new features'
    ],
    popular: true
  }
];

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  onPaymentSuccess,
  subscriptionStatus 
}: PaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Create Razorpay order
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment order');
      }

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          name: 'PrepVista',
          description: paymentPlans.find(p => p.id === selectedPlan)?.description,
          order_id: data.orderId,
          handler: async (response: any) => {
            try {
              // Verify payment
              const verifyResponse = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpayOrderId: data.orderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  plan: selectedPlan,
                }),
              });

              const verifyData = await verifyResponse.json();

              if (verifyResponse.ok) {
                onPaymentSuccess();
                onClose();
              } else {
                throw new Error(verifyData.error || 'Payment verification failed');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              setError('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: 'User',
            email: 'user@example.com',
          },
          theme: {
            color: '#3B82F6',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };

      script.onerror = () => {
        setError('Failed to load payment gateway. Please try again.');
        setIsProcessing(false);
      };

      document.body.appendChild(script);
    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {subscriptionStatus?.hasUsedTrial 
                ? 'Subscribe to Continue' 
                : 'Choose Your Plan'
              }
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {subscriptionStatus?.hasUsedTrial && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                You've used your free trial. Subscribe now to continue practicing and unlock all features.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {paymentPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${plan.popular ? 'ring-2 ring-blue-200' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                <div className="text-center mb-4">
                  <div className="flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                    {plan.originalPrice && (
                      <span className="ml-2 text-lg text-gray-500 line-through">
                        ₹{plan.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {plan.id === 'monthly' ? 'per month' : 'per year'}
                  </p>
                </div>

                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="text-center">
                  <div className={`w-4 h-4 rounded-full border-2 mx-auto ${
                    selectedPlan === plan.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedPlan === plan.id && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay ₹{paymentPlans.find(p => p.id === selectedPlan)?.price}
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Secure payment powered by Razorpay
            </p>
            <div className="flex justify-center items-center mt-2 space-x-4 text-xs text-gray-500">
              <div className="flex items-center">
                <CreditCard className="w-3 h-3 mr-1" />
                Cards
              </div>
              <div className="flex items-center">
                <Smartphone className="w-3 h-3 mr-1" />
                UPI
              </div>
              <div className="flex items-center">
                <Building2 className="w-3 h-3 mr-1" />
                Net Banking
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
