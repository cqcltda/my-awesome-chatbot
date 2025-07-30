import * as dotenv from 'dotenv';
import OpenAI from 'openai';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

// Configuração do cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface UserInfo {
  name?: string;
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  profession?: string;
  location?: string;
  contact?: string;
  mainComplaint?: string;
  duration?: string;
  intensity?: number;
}

/**
 * Criar uma nova thread de conversa
 */
export async function createThread(): Promise<string> {
  try {
    const thread = await openai.beta.threads.create();
    
    if (!thread.id) {
      throw new Error('Thread created but no ID returned');
    }
    
    return thread.id;
  } catch (error) {
    console.error('Erro ao criar thread:', error);
    throw new Error(`Failed to create thread: ${error}`);
  }
}

/**
 * Adicionar mensagem à thread
 */
export async function addMessageToThread(
  threadId: string,
  message: string,
  role: 'user' | 'assistant' = 'user'
): Promise<void> {
  try {
    if (!threadId) {
      throw new Error('ThreadId is required for adding message');
    }
    
    
    await openai.beta.threads.messages.create(threadId, {
      role,
      content: message,
    });
    
  } catch (error) {
    console.error('Erro ao adicionar mensagem à thread:', error);
    throw new Error(`Failed to add message to thread: ${error}`);
  }
}

/**
 * Executar o assistente de forma simplificada
 */
export async function runAssistantSimple(
  assistantId: string,
  threadId: string,
  userMessage: string,
  userInfo?: UserInfo,
  chatStep: string = 'GATHERING_INFO'
): Promise<string> {
  try {
    // Validar se temos um threadId válido
    if (!threadId) {
      throw new Error('ThreadId is required but was not provided');
    }


    // Adiciona a mensagem do usuário à thread
    await addMessageToThread(threadId, userMessage, 'user');

    // Executa o assistente
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });


    // Aguarda o run ser concluído com polling otimizado
    let runStatus = run;
    let attempts = 0;
    const maxAttempts = 15; // Reduzir tentativas para resposta mais rápida
    
    
    while ((runStatus.status === 'in_progress' || runStatus.status === 'queued') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
      attempts++;
      
      try {
        // @ts-ignore - OpenAI API v5.10.2
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        
        // Verificar se houve erro
        if (runStatus.status === 'failed') {
          throw new Error(`Run failed: ${runStatus.last_error?.message || 'Unknown error'}`);
        }
        
        if (runStatus.status === 'cancelled') {
          throw new Error('Run was cancelled');
        }
        
        if (runStatus.status === 'expired') {
          throw new Error('Run expired');
        }
        
      } catch (error) {
        // Continuar tentando mesmo com erro
      }
    }
    
    
    if (runStatus.status !== 'completed') {
      // Mesmo assim, tentar buscar mensagens
    }

    // Busca as mensagens da thread
    const messages = await openai.beta.threads.messages.list(threadId);
    
    if (messages.data.length === 0) {
      throw new Error('No messages found in thread');
    }

    // A resposta do assistente estará no primeiro item da lista (mais recente)
    // Precisamos encontrar a mensagem do assistente, não do usuário
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
    
    if (!assistantMessage) {
      messages.data.forEach((msg, index) => {
      });
      
      // Retornar uma mensagem de fallback em vez de erro
      return "Desculpe, estou enfrentando dificuldades técnicas no momento. Por favor, tente novamente em alguns segundos.";
    }
    
    const assistantResponse = assistantMessage.content[0];
    
    if (assistantResponse.type === 'text') {
      return assistantResponse.text.value;
    } else {
      throw new Error(`Unexpected response type: ${assistantResponse.type}`);
    }

  } catch (error) {
    console.error('Erro ao executar assistente simples:', error);
    throw error;
  }
}

/**
 * Obter histórico de mensagens de uma thread
 */
export async function getThreadMessages(threadId: string): Promise<Array<{role: string, content: string}>> {
  const messages = await openai.beta.threads.messages.list(threadId);
  
  return messages.data.map(msg => ({
    role: msg.role,
    content: msg.content[0].type === 'text' ? msg.content[0].text.value : '',
  }));
} 