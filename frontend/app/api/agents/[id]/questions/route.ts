import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { API_CONFIG } from '@/config/api';

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
    const { questionCount = 10, questionTypes = ['MCQ'] } = body;

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
      },
      include: {
        documents: true
      }
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get the document content (for now, we'll use a placeholder)
    // TODO: Implement actual PDF text extraction
    const documentContent = "This is a sample document content. In a real implementation, this would be the extracted text from the uploaded PDF.";
    
    try {
      // Call the AI backend to generate questions
      const aiResponse = await fetch(`${API_CONFIG.AI_BACKEND_URL}${API_CONFIG.ENDPOINTS.AI_AGENT_QUESTIONS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          subject: agent.subject,
          question_types: questionTypes,
          question_count: questionCount,
          difficulty: 'medium', // TODO: Make this configurable
          document_content: documentContent
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`AI backend responded with status: ${aiResponse.status}`);
      }

      const aiQuestions = await aiResponse.json();
      
      // Store questions in database
      const storedQuestions = await Promise.all(
        aiQuestions.map(async (question: any) => {
          return await prisma.aIQuestion.create({
            data: {
              agentId: agentId,
              questionText: question.question,
              questionType: question.type.toUpperCase() as any,
              difficulty: question.difficulty.toUpperCase() as any,
              options: question.options || [],
              correctAnswer: question.correct_answer || question.expected_answer || '',
              explanation: question.explanation,
              expectedAnswer: question.expected_answer,
              keyPoints: question.key_points || [],
              evaluationCriteria: question.evaluation_criteria || [],
              centralConcept: question.central_concept,
              expectedBranches: question.expected_branches || []
            }
          });
        })
      );

      // Update agent's last used timestamp
      await prisma.aIAgent.update({
        where: { id: agentId },
        data: { lastUsed: new Date() }
      });

      return NextResponse.json({
        success: true,
        questions: storedQuestions.map(q => ({
          id: q.id,
          type: q.questionType.toLowerCase(),
          question: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          expectedAnswer: q.expectedAnswer,
          keyPoints: q.keyPoints,
          evaluationCriteria: q.evaluationCriteria,
          centralConcept: q.centralConcept,
          expectedBranches: q.expectedBranches,
          difficulty: q.difficulty.toLowerCase()
        })),
        agentId,
        generatedAt: new Date().toISOString()
      });

    } catch (aiError) {
      console.error('AI backend error:', aiError);
      
      // Fallback to mock questions if AI backend fails
      const mockQuestions = generateMockQuestions(questionCount, questionTypes);
      
      // Store mock questions in database
      const storedQuestions = await Promise.all(
        mockQuestions.map(async (question) => {
          return await prisma.aIQuestion.create({
            data: {
              agentId: agentId,
              questionText: question.question,
              questionType: question.type.toUpperCase() as any,
              difficulty: question.difficulty.toUpperCase() as any,
              options: question.options || [],
              correctAnswer: String(question.correctAnswer || question.expectedAnswer || ''),
              explanation: question.explanation,
              expectedAnswer: question.expectedAnswer,
              keyPoints: question.keyPoints || [],
              evaluationCriteria: question.evaluationCriteria || [],
              centralConcept: question.centralConcept,
              expectedBranches: question.expectedBranches || []
            }
          });
        })
      );

      // Update agent's last used timestamp
      await prisma.aIAgent.update({
        where: { id: agentId },
        data: { lastUsed: new Date() }
      });

      return NextResponse.json({
        success: true,
        questions: storedQuestions.map(q => ({
          id: q.id,
          type: q.questionType.toLowerCase(),
          question: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          expectedAnswer: q.expectedAnswer,
          keyPoints: q.keyPoints,
          evaluationCriteria: q.evaluationCriteria,
          centralConcept: q.centralConcept,
          expectedBranches: q.expectedBranches,
          difficulty: q.difficulty.toLowerCase()
        })),
        agentId,
        generatedAt: new Date().toISOString(),
        note: 'Generated using fallback questions due to AI backend unavailability'
      });
    }

  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateMockQuestions(count: number, types: string[]) {
  const questions = [];
  
  for (let i = 0; i < count; i++) {
    const questionType = types[Math.floor(Math.random() * types.length)];
    
    switch (questionType) {
      case 'MCQ':
        questions.push({
          id: `q_${i + 1}`,
          type: 'mcq',
          question: `Sample MCQ question ${i + 1} about the uploaded document content. This would be generated by AI based on the PDF.`,
          options: [
            'Option A - This would be AI-generated based on the document',
            'Option B - Another AI-generated option',
            'Option C - Third AI-generated option',
            'Option D - Fourth AI-generated option'
          ],
          correctAnswer: Math.floor(Math.random() * 4),
          explanation: 'This explanation would be generated by AI based on the document content and correct answer.',
          difficulty: 'medium'
        });
        break;
        
      case 'OBJECTIVE':
        questions.push({
          id: `q_${i + 1}`,
          type: 'objective',
          question: `Sample objective question ${i + 1} about the uploaded document content. This would be generated by AI.`,
          correctAnswer: 'This would be the AI-generated correct answer based on the document.',
          explanation: 'AI-generated explanation of why this answer is correct.',
          difficulty: 'medium'
        });
        break;
        
      case 'SHORT_ANSWER':
        questions.push({
          id: `q_${i + 1}`,
          type: 'short-answer',
          question: `Sample short answer question ${i + 1} about the uploaded document content. This would be generated by AI.`,
          expectedAnswer: 'This would be the AI-generated expected answer based on the document content.',
          keyPoints: [
            'Key point 1 - AI-generated from document',
            'Key point 2 - AI-generated from document',
            'Key point 3 - AI-generated from document'
          ],
          difficulty: 'medium'
        });
        break;
        
      case 'ESSAY':
        questions.push({
          id: `q_${i + 1}`,
          type: 'essay',
          question: `Sample essay question ${i + 1} about the uploaded document content. This would be generated by AI.`,
          expectedAnswer: 'This would be a detailed AI-generated expected answer based on the document content.',
          evaluationCriteria: [
            'Understanding of concepts - AI-generated criteria',
            'Analysis depth - AI-generated criteria',
            'Argument structure - AI-generated criteria',
            'Evidence usage - AI-generated criteria'
          ],
          difficulty: 'hard'
        });
        break;
        
      case 'MINDMAP':
        questions.push({
          id: `q_${i + 1}`,
          type: 'mindmap',
          question: `Create a mind map for the concept: ${['Ancient Civilizations', 'Geographic Features', 'Economic Systems', 'Political Structures'][i % 4]}`,
          centralConcept: 'This would be the AI-generated central concept based on the document.',
          expectedBranches: [
            'Branch 1 - AI-generated from document',
            'Branch 2 - AI-generated from document',
            'Branch 3 - AI-generated from document',
            'Branch 4 - AI-generated from document'
          ],
          difficulty: 'medium'
        });
        break;
        
      default:
        questions.push({
          id: `q_${i + 1}`,
          type: 'mcq',
          question: `Default question ${i + 1} about the uploaded document content.`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
          explanation: 'Default explanation.',
          difficulty: 'medium'
        });
    }
  }
  
  return questions;
}
