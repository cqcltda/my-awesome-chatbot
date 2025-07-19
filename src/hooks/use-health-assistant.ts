import { useCallback, useState } from 'react';

interface HealthAssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface HealthAssistantResponse {
  success: boolean;
  response: string;
  threadId: string;
}

interface UseHealthAssistantReturn {
  messages: HealthAssistantMessage[];
  isLoading: boolean;
  error: string | null;
  threadId: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  loadThreadHistory: (threadId: string) => Promise<void>;
}

export function useHealthAssistant(): UseHealthAssistantReturn {
  const [messages, setMessages] = useState<HealthAssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    // Adicionar mensagem do usuário
    const userMessage: HealthAssistantMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          threadId,
        }),
      });

      const data: HealthAssistantResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.response || 'Erro ao enviar mensagem');
      }

      if (data.success) {
        // Adicionar resposta do assistente
        const assistantMessage: HealthAssistantMessage = {
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
  }, [threadId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setThreadId(null);
    setError(null);
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
    sendMessage,
    clearMessages,
    loadThreadHistory,
  };
} 