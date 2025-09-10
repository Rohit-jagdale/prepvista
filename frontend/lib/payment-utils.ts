import { prisma } from './prisma';

export interface UserSubscriptionStatus {
  canPractice: boolean;
  hasUsedTrial: boolean;
  isSubscribed: boolean;
  subscriptionEnds?: Date;
  trialUsed: boolean;
  needsPayment: boolean;
}

// Check if user can start a practice session
export async function checkUserSubscriptionStatus(userId: string): Promise<UserSubscriptionStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      hasUsedTrial: true,
      isSubscribed: true,
      subscriptionEnds: true,
      subscriptionPlan: true
    }
  });

  if (!user) {
    return {
      canPractice: false,
      hasUsedTrial: false,
      isSubscribed: false,
      trialUsed: false,
      needsPayment: true
    };
  }

  const now = new Date();
  const isSubscriptionActive = user.isSubscribed && 
    user.subscriptionEnds && 
    user.subscriptionEnds > now;

  const canPractice = isSubscriptionActive || !user.hasUsedTrial;
  const needsPayment = !isSubscriptionActive && user.hasUsedTrial;

  return {
    canPractice,
    hasUsedTrial: user.hasUsedTrial,
    isSubscribed: Boolean(isSubscriptionActive),
    subscriptionEnds: user.subscriptionEnds || undefined,
    trialUsed: user.hasUsedTrial,
    needsPayment
  };
}

// Mark trial as used
export async function markTrialAsUsed(userId: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: { hasUsedTrial: true }
  });
}

// Update user subscription after successful payment
export async function updateUserSubscription(
  userId: string,
  paymentId: string,
  plan: 'monthly' | 'yearly'
) {
  const now = new Date();
  const subscriptionEnds = new Date();
  
  if (plan === 'monthly') {
    subscriptionEnds.setMonth(subscriptionEnds.getMonth() + 1);
  } else {
    subscriptionEnds.setFullYear(subscriptionEnds.getFullYear() + 1);
  }

  return await prisma.user.update({
    where: { id: userId },
    data: {
      isSubscribed: true,
      subscriptionId: paymentId,
      subscriptionPlan: plan,
      subscriptionEnds,
      paymentId,
      lastPaymentDate: now
    }
  });
}

// Get subscription details for a user
export async function getUserSubscriptionDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      hasUsedTrial: true,
      isSubscribed: true,
      subscriptionPlan: true,
      subscriptionEnds: true,
      lastPaymentDate: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          plan: true,
          createdAt: true
        }
      }
    }
  });

  if (!user) return null;

  const now = new Date();
  const isActive = Boolean(user.isSubscribed && user.subscriptionEnds && user.subscriptionEnds > now);

  return {
    ...user,
    isActive,
    daysRemaining: user.subscriptionEnds 
      ? Math.ceil((user.subscriptionEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0
  };
}
