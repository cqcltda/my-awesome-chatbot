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
      let argumentChunks = ''; // Variável para acumular os fragmentos dos argumentos

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
                      whatsAppUrl: null, // Será atualizado se necessário
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

              // Log para debug de todos os dados recebidos
              if (data.toolCall || data.toolCallDelta) {
                console.log('🟢 Dados de tool call recebidos:', JSON.stringify(data, null, 2));
              }

              // Processar tool calls (ferramentas)
              if (data.toolCall) {
                console.log('🔧 Tool call recebido:', data.toolCall);
                
                // Verificar se é a ferramenta sendToWhatsapp
                if (data.toolCall.function?.name === 'sendToWhatsapp') {
                  console.log('🔧 Função sendToWhatsapp detectada');
                  
                  // Se temos argumentos, processar
                  if (data.toolCall.function?.arguments) {
                    try {
                      const args = JSON.parse(data.toolCall.function.arguments);
                      console.log('🔧 Argumentos da função:', args);
                      
                      // Gerar URL do WhatsApp com os dados do usuário
                      const { userInfo: patientInfo } = args;
                      if (patientInfo) {
                        const phoneNumber = '+5511945139833';
                        const greeting = 'Olá, fiz um atendimento inicial com a IA médica e gostaria de agendar uma consulta com o Dr. Bernardo. Segue minhas informações abaixo:';
                        const patientInfoText = [
                          `Nome: ${patientInfo.name}`,
                          `Idade: ${patientInfo.age}`,
                          `Sexo: ${patientInfo.gender}`,
                          `Peso: ${patientInfo.weight}kg`,
                          `Altura: ${patientInfo.height}m`,
                          `Profissão: ${patientInfo.profession}`,
                        ].join('\n');
                        
                        const text = encodeURIComponent(`${greeting}\n\n${patientInfoText}`);
                        const url = `https://wa.me/${phoneNumber}?text=${text}`;
                        
                        // Atualizar a mensagem do assistente com o WhatsApp URL
                        setMessages(prev => {
                          const newMessages = [...prev];
                          const lastIndex = newMessages.length - 1;
                          
                          if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                            newMessages[lastIndex] = {
                              ...newMessages[lastIndex],
                              whatsAppUrl: url,
                            };
                          }
                          
                          return newMessages;
                        });
                        
                        console.log('🔧 URL do WhatsApp definida:', url);
                      }
                    } catch (error) {
                      console.error('🔧 Erro ao processar argumentos da função:', error);
                    }
                  }
                }
              }

              // Processar tool call deltas (argumentos sendo construídos)
              if (data.toolCallDelta) {
                console.log('🔧 Tool call delta recebido:', data.toolCallDelta);
                
                // Se é um delta de função e temos argumentos sendo construídos
                if (data.toolCallDelta.function?.arguments) {
                  try {
                    // Tentar parsear os argumentos completos
                    const args = JSON.parse(data.toolCallDelta.function.arguments);
                    console.log('🔧 Argumentos completos da função:', args);
                    
                    // Se é a função sendToWhatsapp e temos dados do usuário
                    if (args.userInfo) {
                      const patientInfo = args.userInfo;
                      const phoneNumber = '+5511945139833';
                      const greeting = 'Olá, fiz um atendimento inicial com a IA médica e gostaria de agendar uma consulta com o Dr. Bernardo. Segue minhas informações abaixo:';
                      const patientInfoText = [
                        `Nome: ${patientInfo.name}`,
                        `Idade: ${patientInfo.age}`,
                        `Sexo: ${patientInfo.gender}`,
                        `Peso: ${patientInfo.weight}kg`,
                        `Altura: ${patientInfo.height}m`,
                        `Profissão: ${patientInfo.profession}`,
                      ].join('\n');
                      
                      const text = encodeURIComponent(`${greeting}\n\n${patientInfoText}`);
                      const url = `https://wa.me/${phoneNumber}?text=${text}`;
                      
                      // Atualizar a mensagem do assistente com o WhatsApp URL
                      setMessages(prev => {
                        const newMessages = [...prev];
                        const lastIndex = newMessages.length - 1;
                        
                        if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                          newMessages[lastIndex] = {
                            ...newMessages[lastIndex],
                            whatsAppUrl: url,
                          };
                        }
                        
                        return newMessages;
                      });
                      
                      console.log('🔧 URL do WhatsApp definida via delta:', url);
                    }
                  } catch (error) {
                    // Se não conseguiu parsear, pode ser que os argumentos ainda estejam sendo construídos
                    console.log('🔧 Argumentos ainda sendo construídos:', data.toolCallDelta.function.arguments);
                  }
                }
              }

              // Processar tool call completos (quando a função é executada)
              if (data.toolCall && data.toolCall.function?.name === 'sendToWhatsapp') {
                console.log('🔧 Tool call completo da função sendToWhatsapp:', data.toolCall);
                
                // Se temos argumentos completos, processar
                if (data.toolCall.function?.arguments) {
                  try {
                    const args = JSON.parse(data.toolCall.function.arguments);
                    console.log('🔧 Argumentos completos da função:', args);
                    
                    if (args.userInfo) {
                      const patientInfo = args.userInfo;
                      const phoneNumber = '+5511945139833';
                      const greeting = 'Olá, fiz um atendimento inicial com a IA médica e gostaria de agendar uma consulta com o Dr. Bernardo. Segue minhas informações abaixo:';
                      const patientInfoText = [
                        `Nome: ${patientInfo.name}`,
                        `Idade: ${patientInfo.age}`,
                        `Sexo: ${patientInfo.gender}`,
                        `Peso: ${patientInfo.weight}kg`,
                        `Altura: ${patientInfo.height}m`,
                        `Profissão: ${patientInfo.profession}`,
                      ].join('\n');
                      
                      const text = encodeURIComponent(`${greeting}\n\n${patientInfoText}`);
                      const url = `https://wa.me/${phoneNumber}?text=${text}`;
                      
                      // Atualizar a mensagem do assistente com o WhatsApp URL
                      setMessages(prev => {
                        const newMessages = [...prev];
                        const lastIndex = newMessages.length - 1;
                        
                        if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                          newMessages[lastIndex] = {
                            ...newMessages[lastIndex],
                            whatsAppUrl: url,
                          };
                        }
                        
                        return newMessages;
                      });
                      
                      console.log('🔧 URL do WhatsApp definida via tool call completo:', url);
                      
                      // Limpar os argumentos acumulados após processar com sucesso
                      argumentChunks = '';
                    }
                  } catch (error) {
                    console.error('🔧 Erro ao processar argumentos do tool call completo:', error);
                  }
                }
              }

              // Processar tool call deltas (argumentos sendo construídos) - versão com acumulação
              if (data.toolCallDelta && data.toolCallDelta.function?.arguments) {
                console.log('🔧 Tool call delta com argumentos:', data.toolCallDelta.function.arguments);
                
                // Acumular os fragmentos dos argumentos
                argumentChunks += data.toolCallDelta.function.arguments;
                console.log('🔧 Argumentos acumulados:', argumentChunks);
                
                // Tentar fazer o parse dos argumentos acumulados
                try {
                  const args = JSON.parse(argumentChunks);
                  console.log('🔧 Argumentos completos detectados no delta:', args);
                  
                  if (args.userInfo && args.userInfo.name) {
                    const patientInfo = args.userInfo;
                    const phoneNumber = '+5511945139833';
                    const greeting = 'Olá, fiz um atendimento inicial com a IA médica e gostaria de agendar uma consulta com o Dr. Bernardo. Segue minhas informações abaixo:';
                    const patientInfoText = [
                      `Nome: ${patientInfo.name}`,
                      `Idade: ${patientInfo.age}`,
                      `Sexo: ${patientInfo.gender}`,
                      `Peso: ${patientInfo.weight}kg`,
                      `Altura: ${patientInfo.height}m`,
                      `Profissão: ${patientInfo.profession}`,
                    ].join('\n');
                    
                    const text = encodeURIComponent(`${greeting}\n\n${patientInfoText}`);
                    const url = `https://wa.me/${phoneNumber}?text=${text}`;
                    
                    // Atualizar a mensagem do assistente com o WhatsApp URL
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const lastIndex = newMessages.length - 1;
                      
                      if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                        newMessages[lastIndex] = {
                          ...newMessages[lastIndex],
                          whatsAppUrl: url,
                        };
                      }
                      
                      return newMessages;
                    });
                    
                    console.log('🔧 URL do WhatsApp definida via delta acumulado:', url);
                    
                    // Limpar os argumentos acumulados após processar com sucesso
                    argumentChunks = '';
                  }
                } catch (error) {
                  console.log('🔧 Argumentos ainda sendo construídos:', argumentChunks);
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