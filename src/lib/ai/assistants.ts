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

// Configurações para polling e timeout
const POLLING_INTERVAL = 1000; // 1 segundo
const MAX_POLLING_TIME = 60000; // 60 segundos
const MAX_RETRIES = 3;

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

  // @ts-ignore - OpenAI API v5.10.2
  const assistant = await openai.beta.assistants.create({
    name: validatedConfig.name,
    instructions: validatedConfig.instructions,
    tools: [
      { type: 'file_search' },
      {
        type: 'function',
        function: {
          name: 'sendToWhatsapp',
          description: 'Encaminha o paciente para o WhatsApp para agendar uma consulta quando o encaminhamento para um médico for necessário.',
          parameters: {
            type: 'object',
            properties: {
              userInfo: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Nome completo do paciente.' },
                  age: { type: 'number', description: 'Idade do paciente.' },
                  gender: { type: 'string', description: 'Sexo do paciente.' },
                  weight: { type: 'number', description: 'Peso do paciente em kg.' },
                  height: { type: 'number', description: 'Altura do paciente em metros.' },
                  profession: { type: 'string', description: 'Profissão do paciente.' },
                },
                required: ['name', 'age', 'gender', 'weight', 'height', 'profession']
              }
            },
            required: ['userInfo']
          }
        }
      }
    ],
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
  try {
    // @ts-ignore - OpenAI API v5.10.2
    const thread = await openai.beta.threads.create();
    console.log(`Thread criada: ${thread.id}`);
    
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
    
    console.log(`Adicionando mensagem à thread ${threadId}:`, { role, message: message.substring(0, 50) + '...' });
    
    // @ts-ignore - OpenAI API v5.10.2
    await openai.beta.threads.messages.create(threadId, {
      role,
      content: message,
    });
    
    console.log('Mensagem adicionada com sucesso');
  } catch (error) {
    console.error('Erro ao adicionar mensagem à thread:', error);
    throw new Error(`Failed to add message to thread: ${error}`);
  }
}

/**
 * Aguardar com timeout
 */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verificar se o run foi concluído ou precisa de ação
 */
async function checkRunStatus(threadId: string, runId: string): Promise<any> {
  try {
    // Validar se os parâmetros são válidos
    if (!threadId || !runId) {
      throw new Error(`Invalid parameters: threadId=${threadId}, runId=${runId}`);
    }
    
    console.log(`Verificando status do run: threadId=${threadId}, runId=${runId}`);
    
    // @ts-ignore - OpenAI API pode ter mudado os tipos
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);
    return run;
  } catch (error) {
    console.error('Erro ao verificar status do run:', error);
    throw new Error(`Failed to retrieve run status: ${error}`);
  }
}

/**
 * Polling do status do run seguindo as melhores práticas da OpenAI
 */
async function pollRunStatus(threadId: string, runId: string): Promise<any> {
  const startTime = Date.now();
  
  console.log(`Iniciando polling para threadId=${threadId}, runId=${runId}`);
  
  let run = await checkRunStatus(threadId, runId);
  
  console.log(`Run ${runId} iniciado com status: ${run.status}`);

  while (run.status === 'in_progress' || run.status === 'queued') {
    // Verificar timeout
    if (Date.now() - startTime > MAX_POLLING_TIME) {
      throw new Error(`Run timeout after ${MAX_POLLING_TIME}ms`);
    }

    // Aguardar antes do próximo poll
    await wait(POLLING_INTERVAL);
    
    // Verificar status novamente
    run = await checkRunStatus(threadId, runId);
    console.log(`Status do run ${runId}: ${run.status}`);
  }

  return run;
}

/**
 * Executar o assistente com streaming de mensagens
 * Implementação seguindo as melhores práticas da OpenAI para streaming
 */
export async function runUnifiedAssistantWithStreaming(
  assistantId: string,
  threadId: string | undefined,
  userMessage: string,
  userInfo?: UserInfo,
  chatStep: string = 'GATHERING_INFO',
  onTextDelta?: (delta: string) => void,
  onToolCallCreated?: (toolCall: any) => void,
  onToolCallDelta?: (toolCallDelta: any) => void,
  onError?: (error: Error) => void
): Promise<string> {
  let retryCount = 0;
  
  // Validar se temos um threadId válido
  if (!threadId) {
    throw new Error('ThreadId is required but was not provided');
  }
  
  while (retryCount < MAX_RETRIES) {
    try {
      // Adiciona a mensagem do usuário à thread
      // Se temos dados do usuário e é uma situação que pode precisar de WhatsApp, incluir os dados
      let messageToSend = userMessage;
      if (userInfo && Object.keys(userInfo).length > 0) {
        const userInfoText = `
Dados do paciente:
- Nome: ${userInfo.name || 'Não informado'}
- Idade: ${userInfo.age || 'Não informado'}
- Sexo: ${userInfo.gender || 'Não informado'}
- Peso: ${userInfo.weight || 'Não informado'} kg
- Altura: ${userInfo.height || 'Não informado'} m
- Profissão: ${userInfo.profession || 'Não informado'}
- Localização: ${userInfo.location || 'Não informado'}
- Contato: ${userInfo.contact || 'Não informado'}
- Queixa Principal: ${userInfo.mainComplaint || 'Não informada'}
- Duração: ${userInfo.duration || 'Não informada'}
- Intensidade: ${userInfo.intensity || 'Não informada'}

Mensagem do paciente: ${userMessage}`;
        messageToSend = userInfoText;
      }
      
      await addMessageToThread(threadId as string, messageToSend, 'user');

      // Executa o assistente com streaming
      // @ts-ignore - OpenAI API v5.10.2
      const stream = openai.beta.threads.runs.stream(threadId as string, {
        assistant_id: assistantId,
      });

      let fullResponse = '';

      // Configurar event listeners para streaming
      stream
        .on('textCreated', (text) => {
          console.log('Text created:', text);
        })
        .on('textDelta', (textDelta, snapshot) => {
          console.log('Text delta:', textDelta.value);
          if (textDelta.value) {
            fullResponse += textDelta.value;
            if (onTextDelta) {
              onTextDelta(textDelta.value);
            }
          }
        })
        .on('toolCallCreated', (toolCall) => {
          console.log('Tool call created:', toolCall);
          if (onToolCallCreated) {
            onToolCallCreated(toolCall);
          }
        })
        .on('toolCallDelta', (toolCallDelta, snapshot) => {
          console.log('Tool call delta:', toolCallDelta);
          if (onToolCallDelta) {
            onToolCallDelta(toolCallDelta);
          }
        })
        .on('error', (error) => {
          console.error('Streaming error:', error);
          if (onError) {
            onError(error);
          }
        });

      // Aguardar até que o streaming seja concluído
      // Usar uma Promise que resolve quando o stream terminar
      await new Promise<void>((resolve, reject) => {
        stream
          .on('end', () => {
            console.log('Stream terminou');
            resolve();
          })
          .on('error', (error) => {
            console.error('Erro no stream:', error);
            reject(error);
          });
      });

      return fullResponse;

    } catch (error) {
      retryCount++;
      console.error(`Tentativa ${retryCount} falhou:`, error);

      if (retryCount >= MAX_RETRIES) {
        console.error('Máximo de tentativas atingido');
        throw error;
      }

      // Aguardar antes da próxima tentativa (backoff exponencial)
      const backoffTime = Math.pow(2, retryCount) * 1000;
      console.log(`Aguardando ${backoffTime}ms antes da próxima tentativa...`);
      await wait(backoffTime);
    }
  }

  throw new Error('Máximo de tentativas atingido');
}

/**
 * Executar o assistente unificado em uma thread
 * Implementação seguindo as melhores práticas da OpenAI
 */
export async function runUnifiedAssistant(
  assistantId: string,
  threadId: string | undefined,
  userMessage: string,
  userInfo?: UserInfo,
  chatStep: string = 'GATHERING_INFO'
): Promise<string> {
  let retryCount = 0;
  
  // Validar se temos um threadId válido
  if (!threadId) {
    throw new Error('ThreadId is required but was not provided');
  }
  
  while (retryCount < MAX_RETRIES) {
    try {
      // Adiciona a mensagem do usuário à thread
      await addMessageToThread(threadId as string, userMessage, 'user');

      // Executa o assistente
      // @ts-ignore - OpenAI API v5.10.2
      const run = await openai.beta.threads.runs.create(threadId as string, {
        assistant_id: assistantId,
      });

      console.log(`Run iniciado com ID: ${run.id} na thread ${threadId}`);

      // Polling do status seguindo as melhores práticas
      const finalRun = await pollRunStatus(threadId as string, run.id);

      // Verificar status final
      switch (finalRun.status) {
        case 'completed':
          // Buscar mensagens da thread
          // @ts-ignore - OpenAI API v5.10.2
          const messages = await openai.beta.threads.messages.list(threadId as string);
          
          if (messages.data.length === 0) {
            throw new Error('No messages found in thread');
          }

          // A resposta do assistente estará no primeiro item da lista
          const assistantResponse = messages.data[0].content[0];
          
          if (assistantResponse.type === 'text') {
            return assistantResponse.text.value;
          } else {
            throw new Error(`Unexpected response type: ${assistantResponse.type}`);
          }

        case 'requires_action':
          console.log('Run requires action - function calling não implementado, continuando...');
          // Por enquanto, vamos continuar sem implementar function calling
          // Em uma implementação completa, você implementaria o handling de function calls aqui
          // @ts-ignore - OpenAI API pode ter mudado os tipos
          await openai.beta.threads.runs.cancel(threadId as string, run.id);
          return "Desculpe, estou enfrentando dificuldades técnicas no momento. Por favor, tente novamente.";

        case 'failed':
          const errorMessage = finalRun.last_error?.message || 'Unknown error';
          console.error(`Run failed: ${errorMessage}`);
          throw new Error(`Run failed: ${errorMessage}`);

        case 'cancelled':
          throw new Error('Run was cancelled');

        case 'expired':
          throw new Error('Run expired - timeout exceeded');

        default:
          throw new Error(`Unexpected run status: ${finalRun.status}`);
      }

    } catch (error) {
      retryCount++;
      console.error(`Tentativa ${retryCount} falhou:`, error);

      if (retryCount >= MAX_RETRIES) {
        console.error('Máximo de tentativas atingido');
        throw error;
      }

      // Aguardar antes da próxima tentativa (backoff exponencial)
      const backoffTime = Math.pow(2, retryCount) * 1000;
      console.log(`Aguardando ${backoffTime}ms antes da próxima tentativa...`);
      await wait(backoffTime);
    }
  }

  throw new Error('Máximo de tentativas atingido');
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
  // @ts-ignore - OpenAI API v5.10.2
  const messages = await openai.beta.threads.messages.list(threadId);
  
  return messages.data.map((msg: any) => ({
    role: msg.role,
    content: msg.content[0].type === 'text' ? msg.content[0].text.value : '',
  }));
}

/**
 * Listar todos os assistentes
 */
export async function listAssistants(): Promise<HealthAssistant[]> {
  // @ts-ignore - OpenAI API v5.10.2
  const assistants = await openai.beta.assistants.list();
  
  return assistants.data.map((assistant: any) => ({
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
  // @ts-ignore - OpenAI API v5.10.2
  const assistant = await openai.beta.assistants.retrieve(assistantId);
  
  return {
    id: assistant.id,
    name: assistant.name || 'Unnamed Assistant',
    instructions: assistant.instructions || '',
    model: assistant.model,
    fileIds: [],
  };
} 