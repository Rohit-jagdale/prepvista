'use client';

import { useState, useEffect } from 'react';
import { Crown, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface SubscriptionStatusProps {
  onUpgrade?: () => void;
  className?: string;
}

interface SubscriptionData {
  hasUsedTrial: boolean;
  isSubscribed: boolean;
  isActive: boolean;
  subscriptionPlan?: string;
  subscriptionEnds?: string;
  daysRemaining: number;
  lastPaymentDate?: string;
  payments?: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    plan: string;
    createdAt: string;
  }>;
}

export default function SubscriptionStatus({ onUpgrade, className = '' }: SubscriptionStatusProps) {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/payment/subscription-status?detailed=true');
      const data = await response.json();
      
      if (response.ok) {
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-800">Unable to load subscription status</span>
        </div>
      </div>
    );
  }

  const { hasUsedTrial, isActive, subscriptionPlan, daysRemaining, lastPaymentDate } = subscriptionData;

  if (isActive) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Crown className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <h3 className="font-semibold text-green-800">
                {subscriptionPlan === 'yearly' ? 'Yearly' : 'Monthly'} Plan Active
              </h3>
              <p className="text-sm text-green-600">
                {daysRemaining > 0 
                  ? `${daysRemaining} days remaining`
                  : 'Subscription expires today'
                }
              </p>
            </div>
          </div>
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
      </div>
    );
  }

  if (hasUsedTrial) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <h3 className="font-semibold text-yellow-800">Trial Used</h3>
              <p className="text-sm text-yellow-600">
                Subscribe to continue practicing
              </p>
            </div>
          </div>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              Subscribe Now
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-blue-600 mr-2" />
          <div>
            <h3 className="font-semibold text-blue-800">Free Trial Available</h3>
            <p className="text-sm text-blue-600">
              Start your first practice session for free
            </p>
          </div>
        </div>
        <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          New User
        </div>
      </div>
    </div>
  );
}
