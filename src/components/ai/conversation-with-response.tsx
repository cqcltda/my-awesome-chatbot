'use client';

import { ButtonSendToWhatsapp } from '@/components/button-send-to-whatsapp/button-send-to-whatsapp';
import {
    AIConversation,
    AIConversationContent,
    AIConversationScrollButton,
} from '@/components/ui/kibo-ui/ai/conversation';
import { AIMessage, AIMessageContent } from '@/components/ui/kibo-ui/ai/message';
import { AIResponse } from '@/components/ui/kibo-ui/ai/response';
import type { UIMessage } from 'ai';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { memo } from 'react';

interface ConversationWithResponseProps {
  messages: Array<UIMessage>;
  status: string;
  chatId?: string;
}

const ConversationWithResponse = memo(({ messages, status, chatId }: ConversationWithResponseProps) => {

  // Se não há mensagens, mostrar uma mensagem de boas-vindas
  if (messages.length === 0) {
    return (
      <div className="flex flex-col min-w-0 max-w-full gap-6 flex-1 overflow-y-auto pt-4 relative">
        <AIConversation className="relative size-full rounded-lg">
          <AIConversationContent>
            <motion.div
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full mx-auto max-w-3xl px-4 group/message"
            >
              <AIMessage from="assistant">
                <AIResponse>Olá! Sou sua assistente médica virtual do consultório do Dr. Bernardo. Como posso ajudá-lo hoje?</AIResponse>
              </AIMessage>
            </motion.div>
          </AIConversationContent>
          <AIConversationScrollButton />
        </AIConversation>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-w-0 max-w-full gap-6 flex-1 overflow-y-auto pt-4 relative">
      <AIConversation className="relative size-full rounded-lg">
        <AIConversationContent>
          <AnimatePresence>
            {messages.map((message, index) => {
              if (message.role === 'user') {
                return (
                  <motion.div
                    key={message.id || index}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    data-role={message.role}
                    className="w-full mx-auto max-w-3xl px-4 group/message"
                  >
                    <AIMessage from="user">
                      <AIMessageContent>{message.content}</AIMessageContent>
                    </AIMessage>
                  </motion.div>
                );
              } else if (message.role === 'assistant') {
                // Verificar se há ferramentas na mensagem
                const hasWhatsAppTool = message.parts?.some(part => 
                  part.type === 'tool-invocation' && 
                  (part as any).toolInvocation.toolName === 'sendToWhatsapp' &&
                  (part as any).toolInvocation.state === 'result'
                );

                const whatsAppResult = message.parts?.find(part => 
                  part.type === 'tool-invocation' && 
                  (part as any).toolInvocation.toolName === 'sendToWhatsapp' &&
                  (part as any).toolInvocation.state === 'result'
                );

                return (
                  <motion.div
                    key={message.id || index}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    data-role={message.role}
                    className="w-full mx-auto max-w-3xl px-4 group/message"
                  >
                    <AIMessage from="assistant">
                      <div className="flex flex-col gap-4">
                        <AIResponse>{message.content}</AIResponse>
                        {hasWhatsAppTool && whatsAppResult && (
                          <div className="mt-4">
                            <ButtonSendToWhatsapp
                              text="Converse com um especialista"
                              url={(whatsAppResult as any).toolInvocation.result?.url as string}
                            />
                          </div>
                        )}
                      </div>
                    </AIMessage>
                  </motion.div>
                );
              }
              return null;
            })}
            {/* Loader de "Pensando..." */}
            {(status === 'submitted' || (status === 'streaming' && messages[messages.length - 1]?.role === 'user')) && (
              <motion.div
                key="thinking"
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full mx-auto max-w-3xl px-4 group/message"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="animate-spin" size={18} />
                  <span>Pensando...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </AIConversationContent>
        <AIConversationScrollButton />
      </AIConversation>
    </div>
  );
});

ConversationWithResponse.displayName = 'ConversationWithResponse';

export { ConversationWithResponse };

