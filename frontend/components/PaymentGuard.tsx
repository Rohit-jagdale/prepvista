'use client';

import { useState, useEffect, ReactNode } from 'react';
import PaymentModal from './PaymentModal';
import SubscriptionStatus from './SubscriptionStatus';

interface PaymentGuardProps {
  children: ReactNode;
  onPaymentRequired?: () => void;
  showSubscriptionStatus?: boolean;
  className?: string;
}

interface SubscriptionStatus {
  canPractice: boolean;
  hasUsedTrial: boolean;
  isSubscribed: boolean;
  needsPayment: boolean;
}

export default function PaymentGuard({ 
  children, 
  onPaymentRequired,
  showSubscriptionStatus = true,
  className = ''
}: PaymentGuardProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/payment/subscription-status');
      const data = await response.json();
      
      if (response.ok) {
        setSubscriptionStatus(data);
        
        if (!data.canPractice && data.needsPayment) {
          onPaymentRequired?.();
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Refresh subscription status after successful payment
    checkSubscriptionStatus();
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!subscriptionStatus) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <p className="text-red-600">Unable to verify subscription status. Please try again.</p>
      </div>
    );
  }

  if (!subscriptionStatus.canPractice) {
    return (
      <div className={className}>
        {showSubscriptionStatus && (
          <SubscriptionStatus 
            onUpgrade={() => setShowPaymentModal(true)}
            className="mb-6"
          />
        )}
        
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {subscriptionStatus.needsPayment ? 'Subscription Required' : 'Access Restricted'}
            </h3>
            <p className="text-gray-600 mb-6">
              {subscriptionStatus.needsPayment 
                ? 'You have used your free trial. Subscribe now to continue practicing and unlock all features.'
                : 'Please contact support if you believe this is an error.'
              }
            </p>
            {subscriptionStatus.needsPayment && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Subscribe Now
              </button>
            )}
          </div>
        </div>

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
          subscriptionStatus={subscriptionStatus}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {showSubscriptionStatus && (
        <SubscriptionStatus 
          onUpgrade={() => setShowPaymentModal(true)}
          className="mb-6"
        />
      )}
      {children}
      
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        subscriptionStatus={subscriptionStatus}
      />
    </div>
  );
}
