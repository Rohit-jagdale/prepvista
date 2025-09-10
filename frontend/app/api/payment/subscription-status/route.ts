import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkUserSubscriptionStatus, getUserSubscriptionDetails } from '@/lib/payment-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    if (detailed) {
      // Get detailed subscription information
      const subscriptionDetails = await getUserSubscriptionDetails(session.user.id!);
      return NextResponse.json(subscriptionDetails);
    } else {
      // Get basic subscription status
      const subscriptionStatus = await checkUserSubscriptionStatus(session.user.id!);
      return NextResponse.json(subscriptionStatus);
    }

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
