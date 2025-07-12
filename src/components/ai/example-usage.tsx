'use client';

import type { UIMessage } from 'ai';
import { useState } from 'react';
import { ConversationWithResponse } from './conversation-with-response';

// Exemplo de uso do componente ConversationWithResponse
export const ExampleUsage = () => {
  const [messages, setMessages] = useState<UIMessage[]>([
    { id: '1', role: 'user', content: 'Olá, como você está?', parts: [{ type: 'text', text: 'Olá, como você está?' }] },
    { id: '2', role: 'assistant', content: 'Olá! Estou muito bem, obrigado por perguntar. Como posso ajudá-lo hoje?', parts: [{ type: 'text', text: 'Olá! Estou muito bem, obrigado por perguntar. Como posso ajudá-lo hoje?' }] },
    { id: '3', role: 'user', content: 'Você pode me explicar sobre inteligência artificial?', parts: [{ type: 'text', text: 'Você pode me explicar sobre inteligência artificial?' }] },
  ]);
  const [status, setStatus] = useState('idle');

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: UIMessage = {
      id: Date.now().toString(),
      role,
      content,
      parts: [{ type: 'text', text: content }],
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateStreaming = () => {
    setStatus('streaming');
    const response = "A inteligência artificial (IA) é um campo da ciência da computação que busca criar sistemas capazes de realizar tarefas que normalmente requerem inteligência humana. Isso inclui aprendizado, raciocínio, percepção e resolução de problemas.";

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < response.length) {
        const partialResponse = response.slice(0, currentIndex + 1);
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = partialResponse;
            lastMessage.parts = [{ type: 'text', text: partialResponse }];
          }
          return newMessages;
        });
        currentIndex++;
      } else {
        setStatus('idle');
        clearInterval(interval);
      }
    }, 50);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Exemplo de Conversação com Resposta</h2>

      <div className="h-96 border rounded-lg">
                <ConversationWithResponse
          messages={messages}
          status={status}
          chatId="example-chat"
        />
      </div>

      <div className="space-y-2">
        <button
          onClick={() => addMessage('user', 'Qual é a sua opinião sobre machine learning?')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Adicionar Mensagem do Usuário
        </button>

        <button
          onClick={() => {
            addMessage('assistant', '');
            simulateStreaming();
          }}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2"
        >
          Simular Resposta do Assistente
        </button>
      </div>
    </div>
  );
};
