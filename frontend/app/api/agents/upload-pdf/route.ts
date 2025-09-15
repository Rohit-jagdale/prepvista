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
    const agentId = formData.get('agentId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!agentId) {
      return NextResponse.json(
        { error: 'No agent ID provided' },
        { status: 400 }
      );
    }

    console.log('Uploading PDF for agent:', agentId);

    // Verify agent exists and belongs to user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

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

    // Upload PDF to RAG system
    const ragFormData = new FormData();
    ragFormData.append('file', file);
    ragFormData.append('agent_id', agentId);

    const ragResponse = await fetch(buildAiUrl('/api/rag/upload-pdf'), {
      method: 'POST',
      body: ragFormData,
    });

    if (!ragResponse.ok) {
      throw new Error('Failed to upload PDF to RAG system');
    }

    const ragResult = await ragResponse.json();
    console.log('RAG upload result:', ragResult);

    // Create Document record
    const document = await prisma.document.create({
      data: {
        id: ragResult.document_id,
        agentId: agentId,
        fileName: `agent_${agentId}_${Date.now()}.pdf`,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: `/uploads/agents/${agentId}/${file.name}`,
        status: 'PROCESSED',
        processedAt: new Date()
      }
    });

    console.log('Document created successfully:', document.id);

    // Create DocumentChunk records if chunks data is available
    if (ragResult.chunks && Array.isArray(ragResult.chunks)) {
      try {
        const chunkData = ragResult.chunks.map((chunk: any, index: number) => ({
          id: `chunk_${ragResult.document_id}_${index}`,
          documentId: ragResult.document_id,
          content: chunk.content || chunk.text || '',
          chunkIndex: chunk.chunk_index || index,
          metadata: chunk.metadata || {}
        }));

        await prisma.documentChunk.createMany({
          data: chunkData
        });

        console.log(`Created ${chunkData.length} document chunks`);

        // Generate and store embeddings for the chunks in batches
        try {
          const batchSize = 5; // Process 5 chunks at a time
          const embeddings = [];
          
          for (let i = 0; i < chunkData.length; i += batchSize) {
            const batch = chunkData.slice(i, i + batchSize);
            console.log(`Processing embedding batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunkData.length/batchSize)}`);
            
            const batchPromises = batch.map(async (chunk) => {
              try {
                const embeddingResponse = await fetch(buildAiUrl('/api/rag/generate-embedding'), {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    text: chunk.content,
                    chunk_id: chunk.id
                  }),
                });

                if (embeddingResponse.ok) {
                  const embeddingData = await embeddingResponse.json();
                  return {
                    chunk_id: chunk.id,
                    embedding: embeddingData.embedding,
                    model: 'text-embedding-004'
                  };
                }
                return null;
              } catch (error) {
                console.error(`Error generating embedding for chunk ${chunk.id}:`, error);
                return null;
              }
            });

            const batchEmbeddings = (await Promise.all(batchPromises)).filter(Boolean);
            embeddings.push(...batchEmbeddings);
            
            // Small delay between batches to avoid overwhelming the system
            if (i + batchSize < chunkData.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          if (embeddings.length > 0) {
            console.log(`Generated ${embeddings.length} embeddings, storing in vector database...`);
            console.log('Sample embedding data:', embeddings[0]);
            
            // Store embeddings in vector database
            const vectorResponse = await fetch(buildAiUrl('/api/rag/store-embeddings'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                embeddings: embeddings
              }),
            });

            if (vectorResponse.ok) {
              const vectorResult = await vectorResponse.json();
              console.log(`Successfully stored ${vectorResult.stored_count} embeddings`);
            } else {
              const errorText = await vectorResponse.text();
              console.error('Failed to store embeddings:', errorText);
            }
          }
        } catch (embeddingError) {
          console.error('Error generating/storing embeddings:', embeddingError);
          // Don't fail the entire operation if embeddings fail
        }
      } catch (chunkError) {
        console.error('Error creating document chunks:', chunkError);
        // Don't fail the entire operation if chunks fail
      }
    }

    // Update agent status to active
    await prisma.aIAgent.update({
      where: { id: agentId },
      data: { status: 'ACTIVE' }
    });

    console.log('Agent status updated to ACTIVE');

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        originalName: document.originalName,
        fileSize: document.fileSize,
        status: document.status
      },
      message: 'PDF uploaded and processed successfully'
    });

  } catch (error) {
    console.error('Error uploading PDF:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
