import { useCallback, useState } from 'react';

interface HealthAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
        threadId: threadId || undefined,
        chatStep,
        ...(Object.keys(userInfo).length > 0 ? { userInfo } : {}),
        streaming: true, // Usar modo streaming
      };

      console.log('Enviando request streaming para /api/assistant:', requestData);

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Erro ao iniciar streaming');
      }

      if (!response.body) {
        throw new Error('Resposta sem corpo');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                throw new Error(data.error);
              }

              if (data.delta) {
                fullResponse += data.delta;
                
                // Criar ou atualizar a mensagem do assistente
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  
                  // Se não há mensagem do assistente ou se é a primeira vez que recebemos um delta
                  if (lastIndex < 0 || newMessages[lastIndex].role !== 'assistant') {
                    // Criar nova mensagem do assistente
                    const assistantMessage: HealthAssistantMessage = {
                      id: `assistant-${Date.now()}-${Math.random()}`,
                      role: 'assistant',
                      content: fullResponse,
                      timestamp: new Date(),
                    };
                    return [...newMessages, assistantMessage];
                  } else {
                    // Atualizar mensagem existente do assistente
                    newMessages[lastIndex] = {
                      ...newMessages[lastIndex],
                      content: fullResponse,
                      timestamp: new Date(),
                    };
                    return newMessages;
                  }
                });
                
                // Chamar callback se fornecido
                if (onDelta) {
                  onDelta(data.delta);
                }
              }

              if (data.done) {
                setThreadId(data.threadId);
                break;
              }
            } catch (parseError) {
              console.error('Erro ao parsear chunk:', parseError);
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao enviar mensagem com streaming:', err);
      
      // Em caso de erro, não precisamos remover nada pois não criamos mensagem vazia
    } finally {
      setIsLoading(false);
    }
  }, [threadId, userInfo, chatStep]);

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