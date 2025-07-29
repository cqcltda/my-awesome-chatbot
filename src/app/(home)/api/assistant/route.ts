import { createThread, getThreadMessages, runUnifiedAssistant, runUnifiedAssistantWithStreaming } from '@/lib/ai/assistants';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  message: z.string().min(1),
  threadId: z.string().nullable().optional(),
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
  streaming: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Request body:', body); // Debug log
    
    const { message, threadId, userInfo, chatStep, streaming } = requestSchema.parse(body);
    
    console.log('Parsed data:', { message, threadId, chatStep, userInfoKeys: userInfo ? Object.keys(userInfo) : 'none', streaming });

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
      console.log('Nova thread criada:', currentThreadId);
    } else {
      console.log('Usando thread existente:', currentThreadId);
    }

    // Validar se temos um threadId válido
    if (!currentThreadId) {
      throw new Error('Failed to create or retrieve thread ID');
    }

    // Se streaming está habilitado, usar streaming
    if (streaming) {
      return new Response(
        new ReadableStream({
          async start(controller) {
            // Flag para controlar o estado do stream
            let isClosed = false;

            const closeStream = () => {
              if (!isClosed) {
                isClosed = true;
                controller.close();
              }
            };

            try {
              let fullResponse = '';
              
              await runUnifiedAssistantWithStreaming(
                assistantId,
                currentThreadId || undefined,
                message,
                userInfo || undefined,
                chatStep,
                // onTextDelta callback
                (delta) => {
                  if (isClosed) return; // Não faz nada se o stream já foi fechado
                  fullResponse += delta;
                  const chunk = `data: ${JSON.stringify({ delta, fullResponse })}\n\n`;
                  controller.enqueue(new TextEncoder().encode(chunk));
                },
                // onToolCallCreated callback
                (toolCall) => {
                  if (isClosed) return;
                  const chunk = `data: ${JSON.stringify({ toolCall })}\n\n`;
                  controller.enqueue(new TextEncoder().encode(chunk));
                },
                // onToolCallDelta callback
                (toolCallDelta) => {
                  if (isClosed) return;
                  const chunk = `data: ${JSON.stringify({ toolCallDelta })}\n\n`;
                  controller.enqueue(new TextEncoder().encode(chunk));
                },
                // onError callback
                (error) => {
                  if (isClosed) return;
                  const chunk = `data: ${JSON.stringify({ error: error.message })}\n\n`;
                  controller.enqueue(new TextEncoder().encode(chunk));
                  closeStream(); // Fecha o stream de forma segura
                }
              );

              // Enviar dados finais somente se não houve erro
              if (!isClosed) {
                const finalChunk = `data: ${JSON.stringify({ 
                  done: true, 
                  fullResponse, 
                  threadId: currentThreadId 
                })}\n\n`;
                controller.enqueue(new TextEncoder().encode(finalChunk));
              }

            } catch (error) {
              if (!isClosed) {
                const errorChunk = `data: ${JSON.stringify({ 
                  error: error instanceof Error ? error.message : 'Erro desconhecido no stream' 
                })}\n\n`;
                controller.enqueue(new TextEncoder().encode(errorChunk));
              }
            } finally {
              closeStream(); // Garante que o stream seja fechado ao final de tudo
            }
          }
        }),
        {
          headers: {
            'Content-Type': 'text/event-stream', // Mude para 'text/event-stream' para SSE
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    } else {
      // Executar o assistente unificado sem streaming (comportamento original)
      console.log('Executando sem streaming...');
      try {
        const response = await runUnifiedAssistant(
          assistantId,
          currentThreadId,
          message,
          userInfo || undefined,
          chatStep
        );

        console.log('Resposta recebida:', response);

        return NextResponse.json({
          success: true,
          response,
          threadId: currentThreadId,
        });
      } catch (error) {
        console.error('Erro ao executar assistente:', error);
        throw error;
      }
    }

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