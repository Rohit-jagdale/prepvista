import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const agentData = await request.json();
    
    console.log('Creating agent with data:', {
      name: agentData.name,
      subject: agentData.subject
    });

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create AI Agent
    const agent = await prisma.aIAgent.create({
      data: {
        userId: user.id,
        name: agentData.name,
        subject: agentData.subject,
        description: agentData.description,
        status: 'PROCESSING'
      }
    });

    console.log('AIAgent created successfully:', agent.id);

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        subject: agent.subject,
        description: agent.description,
        status: agent.status,
        createdAt: agent.createdAt
      },
      message: 'Agent created successfully'
    });

  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
