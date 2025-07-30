import { useCallback, useState } from 'react';

interface HealthAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  whatsAppUrl?: string | null;
}

interface HealthAssistantResponse {
  success: boolean;
  response: string;
  threadId: string;
}

interface UserInfo {
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

interface UseHealthAssistantReturn {
  messages: HealthAssistantMessage[];
  isLoading: boolean;
  error: string | null;
  threadId: string | null;
  userInfo: UserInfo;
  chatStep: string;
  sendMessage: (message: string) => Promise<void>;
  sendMessageWithStreaming: (message: string, onDelta?: (delta: string) => void) => Promise<void>;
  clearMessages: () => void;
  loadThreadHistory: (threadId: string) => Promise<void>;
  updateUserInfo: (info: Partial<UserInfo>) => void;
  updateChatStep: (step: string) => void;
}

export function useHealthAssistant(): UseHealthAssistantReturn {
  const [messages, setMessages] = useState<HealthAssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [chatStep, setChatStep] = useState<string>('GATHERING_INFO');

  const updateUserInfo = useCallback((info: Partial<UserInfo>) => {
    setUserInfo(prev => ({ ...prev, ...info }));
  }, []);

  const updateChatStep = useCallback((step: string) => {
    setChatStep(step);
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    // Adicionar mensagem do usuário
    const userMessage: HealthAssistantMessage = {
      id: `user-${Date.now()}-${Math.random()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Preparar dados para envio
      const requestData = {
        message,
        threadId: threadId || undefined, // Garantir que null seja convertido para undefined
        chatStep,
        // Só enviar userInfo se tiver dados
        ...(Object.keys(userInfo).length > 0 ? { userInfo } : {}),
        streaming: false, // Usar modo não-streaming
      };

      console.log('Enviando request para /api/assistant:', requestData);

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data: HealthAssistantResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.response || 'Erro ao enviar mensagem');
      }

      if (data.success) {
        // Adicionar resposta do assistente
        const assistantMessage: HealthAssistantMessage = {
          id: `assistant-${Date.now()}-${Math.random()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        setThreadId(data.threadId);
      } else {
        throw new Error('Falha na comunicação com o assistente');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setIsLoading(false);
    }
  }, [threadId, userInfo, chatStep]);

  const sendMessageWithStreaming = useCallback(async (message: string, onDelta?: (delta: string) => void) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    const userMessage: HealthAssistantMessage = {
      id: `user-${Date.now()}-${Math.random()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Esta variável precisa acumular os argumentos da ferramenta através de múltiplos pacotes de dados
    let argumentChunks = ''; 

    try {
      const requestData = {
        message,
        threadId: threadId || undefined,
        chatStep,
        ...(Object.keys(userInfo).length > 0 ? { userInfo } : {}),
        streaming: true,
      };

      console.log('Enviando request streaming para /api/assistant:', requestData);

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok || !response.body) {
        throw new Error('Falha na resposta do servidor ao iniciar o streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) throw new Error(data.error);

              // Log para debug apenas quando há tool calls
              if (data.toolCallDelta || data.toolCall) {
                console.log('📦 DADOS RECEBIDOS:', {
                  hasDelta: !!data.delta,
                  hasToolCallDelta: !!data.toolCallDelta,
                  hasToolCall: !!data.toolCall,
                  hasDone: !!data.done,
                });
              }

              // --- CORREÇÃO 1: Manipulador de textDelta seguro ---
              if (data.delta) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  
                  if (lastIndex < 0 || newMessages[lastIndex].role !== 'assistant') {
                    // Cria uma nova mensagem de assistente se não existir uma
                    const assistantMessage: HealthAssistantMessage = {
                      id: `assistant-${Date.now()}-${Math.random()}`,
                      role: 'assistant',
                      content: data.delta,
                      timestamp: new Date(),
                      whatsAppUrl: null,
                    };
                    console.log('ATUALIZAÇÃO DE TEXTO - NOVA MENSAGEM:', assistantMessage);
                    return [...newMessages, assistantMessage];
                  } else {
                    // Atualiza a mensagem existente de forma segura, apenas concatenando o conteúdo
                    newMessages[lastIndex] = {
                      ...newMessages[lastIndex],
                      content: newMessages[lastIndex].content + data.delta,
                    };
                    console.log('ATUALIZAÇÃO DE TEXTO - MENSAGEM EXISTENTE:', newMessages[lastIndex]);
                    return newMessages;
                  }
                });
                
                if (onDelta) onDelta(data.delta);
              }

              // --- CORREÇÃO 2: Manipulador de toolCallDelta robusto ---
              if (data.toolCallDelta?.function?.arguments) {
                argumentChunks += data.toolCallDelta.function.arguments;
                
                try {
                  const args = JSON.parse(argumentChunks);
                  
                  if (args.userInfo) {
                    const patientInfo = args.userInfo;
                    const phoneNumber = '+5511945139833';
                    const greeting = 'Olá, fiz um atendimento inicial com a IA médica e gostaria de agendar uma consulta com o Dr. Bernardo. Segue minhas informações abaixo:';
                    const patientInfoText = [
                      `Nome: ${patientInfo.name || 'Não informado'}`, `Idade: ${patientInfo.age || 'Não informada'}`,
                      `Sexo: ${patientInfo.gender || 'Não informado'}`, `Peso: ${patientInfo.weight || 'Não informado'}kg`,
                      `Altura: ${patientInfo.height || 'Não informada'}m`, `Profissão: ${patientInfo.profession || 'Não informada'}`,
                    ].join('\n');
                    
                    const text = encodeURIComponent(`${greeting}\n\n${patientInfoText}`);
                    const url = `https://wa.me/${phoneNumber}?text=${text}`;
                    
                    const concludingMessage = "\n\nIdentifiquei que um atendimento médico é necessário. Para agendar sua consulta, por favor, clique no botão que apareceu em minha resposta.";

                    setMessages(prev => {
                      const newMessages = [...prev];
                      let lastIndex = newMessages.length - 1;

                      // Verifica se a última mensagem NÃO é do assistente
                      if (lastIndex < 0 || newMessages[lastIndex].role !== 'assistant') {
                        // CRIA uma nova mensagem de assistente se for a primeira resposta
                        const assistantMessage: HealthAssistantMessage = {
                          id: `assistant-${Date.now()}-${Math.random()}`,
                          role: 'assistant',
                          content: concludingMessage.trim(), // Inicia com a mensagem de conclusão
                          timestamp: new Date(),
                          whatsAppUrl: url,
                        };
                        console.log('ATUALIZAÇÃO DE FERRAMENTA - NOVA MENSAGEM:', assistantMessage);
                        return [...newMessages, assistantMessage];
                      } else {
                        // ATUALIZA a mensagem de assistente existente
                        const currentContent = newMessages[lastIndex].content;
                        newMessages[lastIndex] = {
                          ...newMessages[lastIndex],
                          content: currentContent.includes(concludingMessage) ? currentContent : currentContent + concludingMessage,
                          whatsAppUrl: url,
                        };
                        console.log('ATUALIZAÇÃO DE FERRAMENTA - MENSAGEM EXISTENTE:', newMessages[lastIndex]);
                        return newMessages;
                      }
                    });

                    console.log('✅ WhatsApp configurado com sucesso:', url);
                    argumentChunks = ''; // Reseta o acumulador
                  }
                } catch (e) {
                  // O JSON ainda não está completo, continua acumulando...
                }
              }

              if (data.done) {
                console.log('✅ STREAM FINALIZADO');
                setThreadId(data.threadId);
              }

            } catch (parseError) {
              console.error('Erro ao processar dados do stream:', parseError);
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido no streaming';
      setError(errorMessage);
      console.error(errorMessage, err);
    } finally {
      setIsLoading(false);
    }
  }, [threadId, userInfo, chatStep, setMessages, setIsLoading, setError, setThreadId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setThreadId(null);
    setError(null);
    setUserInfo({});
    setChatStep('GATHERING_INFO');
  }, []);

  const loadThreadHistory = useCallback(async (threadId: string) => {
    if (!threadId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assistant?threadId=${threadId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar histórico');
      }

      if (data.success && data.messages) {
        const formattedMessages: HealthAssistantMessage[] = data.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(), // Note: API não retorna timestamp, usando data atual
        }));

        setMessages(formattedMessages);
        setThreadId(threadId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    threadId,
    userInfo,
    chatStep,
    sendMessage,
    sendMessageWithStreaming,
    clearMessages,
    loadThreadHistory,
    updateUserInfo,
    updateChatStep,
  };
} 