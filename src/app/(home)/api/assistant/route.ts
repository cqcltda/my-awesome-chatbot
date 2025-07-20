import { createThread, getThreadMessages, runUnifiedAssistant } from '@/lib/ai/assistants';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  message: z.string().min(1),
  threadId: z.string().optional(),
  userInfo: z.object({
    name: z.string().optional(),
    age: z.number().optional(),
    gender: z.string().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
    profession: z.string().optional(),
    location: z.string().optional(),
    contact: z.string().optional(),
    mainComplaint: z.string().optional(),
    duration: z.string().optional(),
    intensity: z.number().optional(),
  }).optional().nullable(),
  chatStep: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Request body:', body); // Debug log
    
    const { message, threadId, userInfo, chatStep } = requestSchema.parse(body);

    const assistantId = process.env.HEALTH_ASSISTANT_ID;
    if (!assistantId) {
      return NextResponse.json(
        { success: false, response: 'Assistente não configurado' },
        { status: 500 }
      );
    }

    let currentThreadId = threadId;
    
    // Se não há thread, criar uma nova
    if (!currentThreadId) {
      currentThreadId = await createThread();
    }

    // Executar o assistente unificado
    const response = await runUnifiedAssistant(
      assistantId,
      currentThreadId,
      message,
      userInfo || undefined,
      chatStep
    );

    return NextResponse.json({
      success: true,
      response,
      threadId: currentThreadId,
    });

  } catch (error) {
    console.error('Erro na API do assistente:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Zod validation errors:', error.errors);
      return NextResponse.json(
        { success: false, response: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, response: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      return NextResponse.json(
        { success: false, error: 'Thread ID não fornecido' },
        { status: 400 }
      );
    }

    const messages = await getThreadMessages(threadId);

    return NextResponse.json({
      success: true,
      messages,
      threadId,
    });

  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar histórico' },
      { status: 500 }
    );
  }
} 