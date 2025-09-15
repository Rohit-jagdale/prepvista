import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildAiUrl } from '@/config/api';

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
    
    console.log('Creating agent with data:', {
      agentId: agentData.agentId,
      name: agentData.name,
      documentId: agentData.documentId
    });

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

    // Create AI Agent (let Prisma generate the ID)
    let agent;
    try {
      agent = await prisma.aIAgent.create({
        data: {
          userId: user.id,
          name: agentData.name,
          subject: agentData.subject,
          description: agentData.description,
          status: 'PROCESSING'
        }
      });
      console.log('AIAgent created successfully:', agent.id);
    } catch (error) {
      console.error('Error creating AIAgent:', error);
      throw new Error(`Failed to create AIAgent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Only upload to RAG system if we don't already have a documentId
    let ragResult = null;
    if (!agentData.documentId) {
      // Upload PDF to RAG system
      const ragFormData = new FormData();
      ragFormData.append('file', file);
      ragFormData.append('agent_id', agent.id);

      const ragResponse = await fetch(buildAiUrl('/api/rag/upload-pdf'), {
        method: 'POST',
        body: ragFormData,
      });

      if (!ragResponse.ok) {
        throw new Error('Failed to upload PDF to RAG system');
      }

      ragResult = await ragResponse.json();
    } else {
      // Use existing documentId from previous upload
      console.log('Reusing existing document chunks for agent:', agent.id, 'documentId:', agentData.documentId);
      ragResult = {
        success: true,
        document_id: agentData.documentId,
        message: 'Using existing document chunks',
        chunks_created: 0
      };
    }

    // Create Document record
    let document;
    try {
      const documentData: any = {
        agentId: agent.id,
        fileName: `agent_${agent.id}_${Date.now()}.pdf`,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: `/uploads/agents/${agent.id}/${file.name}`,
        status: 'PROCESSED' as const,
        processedAt: new Date()
      };

      // Use document_id from RAG result if available, otherwise let Prisma generate it
      if (ragResult && ragResult.document_id) {
        documentData.id = ragResult.document_id;
      }

      document = await prisma.document.create({
        data: documentData
      });
      console.log('Document created successfully:', document.id);
    } catch (error) {
      console.error('Error creating Document:', error);
      throw new Error(`Failed to create Document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Update agent status to active
    try {
      await prisma.aIAgent.update({
        where: { id: agent.id },
        data: { status: 'ACTIVE' }
      });
      console.log('Agent status updated to ACTIVE');
    } catch (error) {
      console.error('Error updating agent status:', error);
      // Don't throw here, agent is already created
    }

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
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
