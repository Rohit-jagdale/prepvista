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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const agentData = JSON.parse(formData.get('agentData') as string);

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

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

    // Create Document record
    const document = await prisma.document.create({
      data: {
        agentId: agent.id,
        fileName: `agent_${agent.id}_${Date.now()}.pdf`,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: `/uploads/agents/${agent.id}/${file.name}`, // This would be the actual file path after upload
        status: 'PROCESSING'
      }
    });

    // TODO: Here you would actually upload the file to storage (S3, local filesystem, etc.)
    // For now, we'll simulate the upload process

    // Update document status to processed
    await prisma.document.update({
      where: { id: document.id },
      data: { 
        status: 'PROCESSED',
        processedAt: new Date()
      }
    });

    // Update agent status to active
    await prisma.aIAgent.update({
      where: { id: agent.id },
      data: { status: 'ACTIVE' }
    });

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        subject: agent.subject,
        description: agent.description,
        documentName: file.name,
        questionTypes: agentData.questionTypes,
        questionCount: agentData.questionCount,
        difficulty: agentData.difficulty,
        createdAt: agent.createdAt,
        lastUsed: agent.lastUsed,
        status: agent.status
      },
      message: 'Agent created successfully'
    });

  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch user's AI agents with documents and questions count
    const agents = await prisma.aIAgent.findMany({
      where: { userId: user.id },
      include: {
        documents: {
          select: {
            id: true,
            originalName: true,
            status: true
          }
        },
        _count: {
          select: {
            questions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedAgents = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      subject: agent.subject,
      documentName: agent.documents[0]?.originalName || 'No document',
      questionTypes: ['mcq', 'objective'], // This will come from agent configuration
      createdAt: agent.createdAt.toISOString(),
      questionCount: agent._count.questions,
      lastUsed: agent.lastUsed.toISOString(),
      status: agent.status
    }));

    return NextResponse.json({
      success: true,
      agents: formattedAgents
    });

  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
