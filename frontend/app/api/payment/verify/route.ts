import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyPaymentSignature, getPaymentDetails } from '@/lib/razorpay';
import { updateUserSubscription } from '@/lib/payment-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { 
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature,
      plan 
    } = await request.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !plan) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValidSignature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Get payment details from Razorpay
    const paymentDetails = await getPaymentDetails(razorpayPaymentId);
    
    if (paymentDetails.status !== 'captured') {
      return NextResponse.json({ error: 'Payment not captured' }, { status: 400 });
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { razorpayId: razorpayPaymentId }
    });

    if (existingPayment) {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 400 });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        razorpayId: razorpayPaymentId,
        amount: Number(paymentDetails.amount),
        currency: paymentDetails.currency,
        status: 'CAPTURED',
        plan: plan,
        paymentMethod: paymentDetails.method,
        subscriptionId: razorpayPaymentId
      }
    });

    // Update user subscription
    await updateUserSubscription(user.id, razorpayPaymentId, plan);

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      message: 'Payment verified and subscription activated successfully'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
