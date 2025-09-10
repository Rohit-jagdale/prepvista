import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createRazorpayOrder, PAYMENT_PLANS } from '@/lib/razorpay';
import { checkUserSubscriptionStatus } from '@/lib/payment-utils';

export async function POST(request: NextRequest) {
  try {
    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ 
        error: 'Payment system not configured',
        message: 'Razorpay credentials are not set up. Please contact administrator.'
      }, { status: 503 });
    }

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

    const { plan } = await request.json();
    
    if (!plan || !(plan in PAYMENT_PLANS)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Check if user already has an active subscription
    const subscriptionStatus = await checkUserSubscriptionStatus(user.id);
    if (subscriptionStatus.isSubscribed) {
      return NextResponse.json({ 
        error: 'You already have an active subscription',
        subscriptionStatus 
      }, { status: 400 });
    }

    // Create Razorpay order
    const order = await createRazorpayOrder(plan as keyof typeof PAYMENT_PLANS, user.id);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
