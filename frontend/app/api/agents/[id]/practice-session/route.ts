import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: agentId } = params;
    const body = await request.json();
    const { 
      sessionName, 
      totalQuestions, 
      correctAnswers, 
      score, 
      timeSpent, 
      questions 
    } = body;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify the agent belongs to the user
    const agent = await prisma.aIAgent.findFirst({
      where: {
        id: agentId,
        userId: user.id
      }
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Create practice session
    const practiceSession = await prisma.aIPracticeSession.create({
      data: {
        userId: user.id,
        agentId: agentId,
        sessionName: sessionName || `Practice Session ${new Date().toLocaleDateString()}`,
        totalQuestions,
        correctAnswers,
        score,
        timeSpent,
        completedAt: new Date()
      }
    });

    // Create practice session questions
    if (questions && Array.isArray(questions)) {
      await Promise.all(
        questions.map(async (q: any) => {
          return await prisma.aIPracticeSessionQuestion.create({
            data: {
              practiceSessionId: practiceSession.id,
              questionId: q.questionId,
              userAnswer: q.userAnswer,
              isCorrect: q.isCorrect,
              timeSpent: q.timeSpent || 0
            }
          });
        })
      );
    }

    // Update agent's last used timestamp
    await prisma.aIAgent.update({
      where: { id: agentId },
      data: { lastUsed: new Date() }
    });

    return NextResponse.json({
      success: true,
      practiceSession: {
        id: practiceSession.id,
        sessionName: practiceSession.sessionName,
        totalQuestions: practiceSession.totalQuestions,
        correctAnswers: practiceSession.correctAnswers,
        score: practiceSession.score,
        timeSpent: practiceSession.timeSpent,
        completedAt: practiceSession.completedAt
      },
      message: 'Practice session saved successfully'
    });

  } catch (error) {
    console.error('Error saving practice session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: agentId } = params;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch practice sessions for this agent
    const practiceSessions = await prisma.aIPracticeSession.findMany({
      where: {
        agentId: agentId,
        userId: user.id
      },
      orderBy: { completedAt: 'desc' },
      take: 10 // Limit to last 10 sessions
    });

    return NextResponse.json({
      success: true,
      practiceSessions: practiceSessions.map(session => ({
        id: session.id,
        sessionName: session.sessionName,
        totalQuestions: session.totalQuestions,
        correctAnswers: session.correctAnswers,
        score: session.score,
        timeSpent: session.timeSpent,
        completedAt: session.completedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching practice sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
