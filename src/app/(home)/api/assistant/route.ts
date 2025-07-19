import { createThread, getThreadMessages, runAssistant } from '@/lib/ai/assistants';
import { ChatSDKError } from '@/lib/errors';
import { z } from 'zod';

const requestSchema = z.object({
  message: z.string().min(1, 'Mensagem é obrigatória'),
  threadId: z.string().optional(),
  assistantId: z.string().optional(),
});

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { message, threadId, assistantId } = requestSchema.parse(json);

    // Usar o ID do assistente das variáveis de ambiente se não fornecido
    const healthAssistantId = assistantId || process.env.HEALTH_ASSISTANT_ID;
    
    if (!healthAssistantId) {
      return new ChatSDKError('bad_request:api', 'Assistente ID não fornecido').toResponse();
    }

    // Criar nova thread se não existir
    let currentThreadId = threadId;
    if (!currentThreadId) {
      currentThreadId = await createThread();
    }

    // Executar o assistente
    const response = await runAssistant(healthAssistantId, currentThreadId, message);

    return Response.json({
      success: true,
      response,
      threadId: currentThreadId,
    });

  } catch (error) {
    console.error('Erro na API do assistente:', error);
    
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    if (error instanceof z.ZodError) {
      return Response.json(
        { 
          success: false, 
          error: 'Dados inválidos',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return Response.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      return Response.json(
        { 
          success: false, 
          error: 'threadId é obrigatório' 
        },
        { status: 400 }
      );
    }

    const messages = await getThreadMessages(threadId);

    return Response.json({
      success: true,
      messages,
    });

  } catch (error) {
    console.error('Erro ao obter mensagens:', error);
    
    return Response.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
} 