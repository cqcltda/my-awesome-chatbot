import * as dotenv from 'dotenv';
import * as fs from 'fs';
import OpenAI from 'openai';
import { z } from 'zod';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

// Configuração do cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Schemas para validação
const AssistantConfigSchema = z.object({
  name: z.string(),
  instructions: z.string(),
  model: z.string().default('gpt-4o'),
  fileIds: z.array(z.string()).optional(),
});

const ThreadMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export type AssistantConfig = z.infer<typeof AssistantConfigSchema>;
export type ThreadMessage = z.infer<typeof ThreadMessageSchema>;

// Interface para o assistente de saúde
export interface HealthAssistant {
  id: string;
  name: string;
  instructions: string;
  model: string;
  fileIds: string[];
}

// Interface para thread de conversa
export interface ConversationThread {
  id: string;
  messages: ThreadMessage[];
}

// Interface para informações do usuário (compatível com o chat principal)
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
 * Upload de arquivos para a OpenAI
 */
export async function uploadFiles(filePaths: string[]): Promise<string[]> {
  const fileIds: string[] = [];

  for (const filePath of filePaths) {
    try {
      const file = await openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: 'assistants',
      });
      fileIds.push(file.id);
      console.log(`Arquivo ${filePath} enviado com ID: ${file.id}`);
    } catch (error) {
      console.error(`Erro ao enviar arquivo ${filePath}:`, error);
      throw error;
    }
  }

  return fileIds;
}

/**
 * Criar um assistente de saúde unificado usando a API de Assistentes real
 */
export async function createHealthAssistant(
  config: AssistantConfig
): Promise<HealthAssistant> {
  const validatedConfig = AssistantConfigSchema.parse(config);

  const assistant = await openai.beta.assistants.create({
    name: validatedConfig.name,
    instructions: validatedConfig.instructions,
    tools: [{ type: 'file_search' }],
    model: validatedConfig.model,
  });

  console.log(`Assistente criado com ID: ${assistant.id}`);

  return {
    id: assistant.id,
    name: assistant.name || validatedConfig.name,
    instructions: assistant.instructions || validatedConfig.instructions,
    model: assistant.model,
    fileIds: validatedConfig.fileIds || [],
  };
}

/**
 * Criar uma nova thread de conversa
 */
export async function createThread(): Promise<string> {
  const thread = await openai.beta.threads.create();
  console.log(`Thread criada com ID: ${thread.id}`);
  return thread.id;
}

/**
 * Adicionar mensagem à thread
 */
export async function addMessageToThread(
  threadId: string,
  message: string,
  role: 'user' | 'assistant' = 'user'
): Promise<void> {
  await openai.beta.threads.messages.create(threadId, {
    role,
    content: message,
  });
}

/**
 * Executar o assistente unificado em uma thread
 * Este assistente combina triagem médica + base de conhecimento especializada
 */
export async function runUnifiedAssistant(
  assistantId: string,
  threadId: string,
  userMessage: string,
  userInfo?: UserInfo,
  chatStep: string = 'GATHERING_INFO'
): Promise<string> {
  try {
    // Adiciona a mensagem do usuário à thread
    await addMessageToThread(threadId, userMessage, 'user');

    // Executa o assistente
    let run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    console.log(`Run iniciado com ID: ${run.id}, status: ${run.status}`);

    // Aguarda o 'run' ser concluído
    while (run.status === 'in_progress' || run.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Busca o status atual do run usando uma abordagem mais simples
      try {
        // @ts-ignore - Ignorando erro de tipo temporariamente
        const runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        run = runStatus;
      } catch (error) {
        console.error('Erro ao buscar status do run:', error);
        throw new Error('Failed to retrieve run status');
      }
      
      console.log(`Status do run ${run.id}: ${run.status}`);
      
      // Verifica se houve erro
      if (run.status === 'failed') {
        const errorMessage = run.last_error?.message || 'Unknown error';
        console.error(`Run failed: ${errorMessage}`);
        throw new Error(`Run failed: ${errorMessage}`);
      }
      
      // Verifica se foi cancelado
      if (run.status === 'cancelled') {
        throw new Error('Run was cancelled');
      }

      // Verifica se requer ação (function calling)
      if (run.status === 'requires_action') {
        console.log('Run requires action, handling...');
        // Para simplificar, vamos cancelar se precisar de ação
        try {
          // @ts-ignore - Ignorando erro de tipo temporariamente
          await openai.beta.threads.runs.cancel(threadId, run.id);
        } catch (error) {
          console.error('Erro ao cancelar run:', error);
        }
        throw new Error('Run requires action which is not implemented yet');
      }
    }

    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(threadId);
      
      // A resposta do assistente estará no primeiro item da lista de mensagens
      if (messages.data.length > 0) {
        const assistantResponse = messages.data[0].content[0];
        
        if (assistantResponse.type === 'text') {
          return assistantResponse.text.value;
        } else {
          throw new Error('Unexpected response type from assistant');
        }
      } else {
        throw new Error('No messages found in thread');
      }
    } else {
      throw new Error(`Unexpected run status: ${run.status}`);
    }
  } catch (error) {
    console.error('Erro ao executar assistente:', error);
    throw error;
  }
}

/**
 * Executar o assistente em uma thread usando a API real (mantido para compatibilidade)
 */
export async function runAssistant(
  assistantId: string,
  threadId: string,
  userMessage: string
): Promise<string> {
  return runUnifiedAssistant(assistantId, threadId, userMessage);
}

/**
 * Obter histórico de mensagens de uma thread
 */
export async function getThreadMessages(threadId: string): Promise<ThreadMessage[]> {
  const messages = await openai.beta.threads.messages.list(threadId);
  
  return messages.data.map(msg => ({
    role: msg.role,
    content: msg.content[0].type === 'text' ? msg.content[0].text.value : '',
  }));
}

/**
 * Listar todos os assistentes
 */
export async function listAssistants(): Promise<HealthAssistant[]> {
  const assistants = await openai.beta.assistants.list();
  
  return assistants.data.map(assistant => ({
    id: assistant.id,
    name: assistant.name || 'Unnamed Assistant',
    instructions: assistant.instructions || '',
    model: assistant.model,
    fileIds: [],
  }));
}

/**
 * Obter um assistente específico
 */
export async function getAssistant(assistantId: string): Promise<HealthAssistant> {
  const assistant = await openai.beta.assistants.retrieve(assistantId);
  
  return {
    id: assistant.id,
    name: assistant.name || 'Unnamed Assistant',
    instructions: assistant.instructions || '',
    model: assistant.model,
    fileIds: [],
  };
} 