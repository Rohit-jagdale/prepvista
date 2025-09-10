import Razorpay from 'razorpay';

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'test_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_key_secret',
});

// Payment plans configuration
export const PAYMENT_PLANS = {
  monthly: {
    name: 'Monthly Plan',
    amount: 999, // ₹9.99 in paise
    currency: 'INR',
    interval: 'monthly',
    description: 'Access to all practice sessions for 1 month'
  },
  yearly: {
    name: 'Yearly Plan',
    amount: 9999, // ₹99.99 in paise
    currency: 'INR',
    interval: 'yearly',
    description: 'Access to all practice sessions for 1 year (Save 17%)'
  }
} as const;

export type PaymentPlan = keyof typeof PAYMENT_PLANS;

// Create Razorpay order
export async function createRazorpayOrder(plan: PaymentPlan, userId: string) {
  const planConfig = PAYMENT_PLANS[plan];
  
  // Create a shorter receipt ID (max 40 characters)
  const receiptId = `pv_${plan}_${userId.slice(-8)}_${Date.now().toString().slice(-8)}`;
  
  const order = await razorpay.orders.create({
    amount: planConfig.amount,
    currency: planConfig.currency,
    receipt: receiptId,
    notes: {
      userId,
      plan,
      description: planConfig.description
    }
  });

  return order;
}

// Verify payment signature
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return expectedSignature === razorpaySignature;
}

// Get payment details
export async function getPaymentDetails(paymentId: string) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
}

// Refund payment
export async function refundPayment(paymentId: string, amount?: number) {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount ? amount * 100 : undefined, // Convert to paise if amount provided
      notes: {
        reason: 'User requested refund'
      }
    });
    return refund;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
}
