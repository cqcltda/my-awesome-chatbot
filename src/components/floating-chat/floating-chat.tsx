"use client"

import { ArrowDown, MessageSquare, Stethoscope, X } from "lucide-react"
import * as React from "react"

import { useAutoResume, useChatStep, useConditionalScroll, useMediaQuery, useUserInfo, useVirtualKeyboard } from "@/hooks"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from "@/components/ui/card"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatSDKError } from '@/lib/errors'
import { fetchWithErrorHandlers, generateUUID } from '@/lib/utils'
import { useChat } from '@ai-sdk/react'
import type { UIMessage } from 'ai'
import { AnimatePresence, motion } from "framer-motion"
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Suggestions } from "../ai"
import { toast } from '../toast'

// Importando o hook do assistente unificado
import { useHealthAssistant } from '@/hooks/use-health-assistant'

interface Props {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  autoResume: boolean;
}

const FloatingChat = ({ id,
  initialMessages,
  initialChatModel,
  autoResume, }: Props) => {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const { isKeyboardOpen } = useVirtualKeyboard()
  
  // Hook para gerenciar informações do usuário
  const { userInfo, saveUserInfo } = useUserInfo();
  
  // Hook para gerenciar o estado da etapa da conversa
  const { chatStep, updateChatStep } = useChatStep(id);

  // Hook do assistente unificado
  const healthAssistant = useHealthAssistant();

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    experimental_resume,
    data,
    stop
  } = useChat({
    id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: fetchWithErrorHandlers,
    experimental_prepareRequestBody: (body) => ({
      id,
      message: body.messages.at(-1),
      selectedChatModel: initialChatModel,
      selectedVisibilityType: 'private',
      userInfo, // Enviando informações do usuário para a API
      chatStep, // Enviando o estado atual da etapa para a API
    }),
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
    },
    onToolCall: ({ toolCall }) => {
      // Ferramenta para transição de estado
      if (toolCall.toolName === 'updateChatStep') {
        const { nextStep } = toolCall.args as { nextStep: string };
        updateChatStep(nextStep as any);
      }
      
      // NOVO: Ferramenta para salvar dados do usuário
      if (toolCall.toolName === 'updateUserInfo') {
        saveUserInfo(toolCall.args as any); // Salva todos os novos dados de uma vez
      }
    },

  });

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({
        role: 'user',
        content: query,
      });

      setHasAppendedQuery(true);
    }
  }, [query, append, hasAppendedQuery, id]);

  const { scrollRef, showScrollButton, scrollToBottom, handleScroll } = useConditionalScroll(messages);

  useEffect(() => {
    if (status === 'streaming' || !showScrollButton) {
      scrollToBottom();
    }
  }, [messages, status, scrollToBottom, showScrollButton]);

  // Scroll automático quando o teclado virtual aparecer
  useEffect(() => {
    if (isKeyboardOpen && !isDesktop) {
      // Pequeno delay para garantir que o layout foi ajustado
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isKeyboardOpen, isDesktop, scrollToBottom]);

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  const handleSuggestionClick = (suggestion: string) => {
    append({
      role: 'user',
      content: suggestion,
    });
  };

  const handleCloseChat = () => {
    setOpen(false);
  }

  const handleInputFocus = () => {
    if (!isDesktop) {
      setTimeout(() => {
        scrollToBottom();
      }, 30);
    }
  };

  const submitForm = React.useCallback(() => {
    handleSubmit(undefined, {
      experimental_attachments: [],
    });

    if (!isDesktop && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [isDesktop, handleSubmit]);

  // Função para enviar mensagem para o assistente unificado
  const handleUnifiedSubmit = async (message: string) => {
    await healthAssistant.sendMessage(message);
  };

  const renderChatContent = () => (
    <Card className={`${isDesktop ? 'h-full max-h-full' : 'size-full'} border-0 md:border grid grid-rows-[auto_1fr_auto] overflow-hidden ${
      !isDesktop && isKeyboardOpen ? 'keyboard-open' : ''
    }`}>
      <CardHeader className={`shrink-0 px-6 py-4 ${!isDesktop && isKeyboardOpen ? 'hidden' : ''}`}>
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="size-2 bg-green-500 rounded-full animate-pulse" />
            <h1 className="text-xl font-semibold">Assistente Médico</h1>
            <Badge variant="secondary" className="ml-2">
              <Stethoscope className="size-3 mr-1" />
              Inteligente
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleCloseChat}
            className="hover:bg-muted/50 rounded-full"
          >
            <X className="size-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 overflow-hidden p-0 flex flex-col">
        <ScrollArea 
          className={`flex-1 ${isDesktop ? 'max-h-[calc(70vh-140px)]' : ''}`}
          ref={scrollRef}
          onScroll={handleScroll}
        >
          <div className={`px-6 py-4 ${!isDesktop && isKeyboardOpen ? 'pt-3' : ''} ${
            healthAssistant.messages.length === 0 ? 'flex items-center justify-center min-h-full' : ''
          }`}>
            {healthAssistant.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center text-gray-500">
                <Stethoscope className="size-12 mb-4 text-green-400" />
                <h3 className="text-lg font-medium mb-2">
                  Assistente Médico
                </h3>
                <p className="text-sm max-w-md">
                  Posso ajudá-lo com triagem médica, análise de sintomas, interpretação de exames 
                  e informações sobre suplementos. Detecto automaticamente o tipo de ajuda que você precisa.
                </p>
                <div className="mt-6 space-y-2">
                  <p className="text-xs font-medium text-gray-400">EXEMPLOS DE PERGUNTAS:</p>
                  <div className="text-xs space-y-1">
                    <p>• &ldquo;Estou com dor de cabeça&rdquo; (Triagem)</p>
                    <p>• &ldquo;O que pode causar cansaço excessivo?&rdquo; (Análise)</p>
                    <p>• &ldquo;Meu TSH está em 4.5, isso é normal?&rdquo; (Exames)</p>
                    <p>• &ldquo;Para que serve o Omega 3?&rdquo; (Suplementos)</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {healthAssistant.messages.map((message, index) => (
                  <div key={`unified-${index}-${message.timestamp.getTime()}`} className="flex items-start gap-3">
                    <div className="shrink-0 mt-1">
                      {message.role === 'user' ? (
                        <div className="size-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">U</span>
                        </div>
                      ) : (
                        <Stethoscope className="size-4 text-green-600" />
                      )}
                    </div>
                    <div className={`flex-1 p-3 rounded-lg border ${
                      message.role === 'user' 
                        ? 'bg-blue-50 border-blue-200 ml-auto' 
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="text-sm text-gray-800">
                        {message.content.split('\n').map((line, i) => (
                          <React.Fragment key={i}>
                            {line}
                            {i < message.content.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {healthAssistant.isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-1">
                      <Stethoscope className="size-4 text-green-600" />
                    </div>
                    <div className="flex-1 p-3 rounded-lg border bg-green-50 border-green-200">
                      <div className="flex items-center gap-2">
                        <div className="size-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        <span className="text-sm text-gray-600">
                          Analisando sua pergunta...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Sugestões movidas para fora do ScrollArea */}
        {healthAssistant.messages.length === 0 && !isKeyboardOpen && (
          <div className="px-6 pb-4">
            <Suggestions suggestions={[
              {title:'Estou com dor de cabeça', label:'pode me ajudar?'},
              {title:'O que pode causar cansaço excessivo?', label:'análise de sintomas'},
              {title:'Meu TSH está em 4.5', label:'isso é normal?'},
              {title:'Para que serve o Omega 3?', label:'informações sobre suplementos'},
            ]} onSuggestionClick={(suggestion) => handleUnifiedSubmit(suggestion)} />
          </div>
        )}
      </CardContent>
      <CardFooter className="shrink-0 relative px-6 py-4">
        <form onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.querySelector('input') as HTMLInputElement;
          if (input && input.value.trim()) {
            handleUnifiedSubmit(input.value.trim());
            input.value = '';
          }
        }} className="flex bg-background gap-2 w-full sm:max-w-3xl">
          <div className="relative w-full flex flex-col gap-4">
            <AnimatePresence>
              {showScrollButton && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="absolute bottom-28 z-50 flex w-full items-center justify-center"
                >
                  <Button
                    data-testid="scroll-to-bottom-button"
                    className="rounded-full shadow-lg bg-background border-2 hover:bg-accent"
                    size="icon"
                    variant="outline"
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToBottom();
                    }}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full overflow-hidden rounded-2xl border-2 border-muted bg-background shadow-sm hover:shadow-md transition-shadow duration-200">
              <textarea
                placeholder="Digite sua pergunta médica..."
                onChange={(e) => {
                  // Gerenciar input localmente
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const value = e.currentTarget.value.trim();
                    if (value) {
                      handleUnifiedSubmit(value);
                      e.currentTarget.value = '';
                    }
                  }
                }}
                onFocus={handleInputFocus}
                className="w-full resize-none min-h-[56px] p-3 border-0 bg-transparent focus:outline-none"
                rows={1}
              />
              <div className="flex justify-end px-2 pb-2">
                <Button
                  disabled={healthAssistant.isLoading}
                  onClick={() => {
                    const textarea = document.querySelector('textarea[placeholder="Digite sua pergunta médica..."]') as HTMLTextAreaElement;
                    if (textarea && textarea.value.trim()) {
                      handleUnifiedSubmit(textarea.value.trim());
                      textarea.value = '';
                    }
                  }}
                  className="rounded-full hover:scale-105 transition-transform duration-200"
                  size="icon"
                >
                  <MessageSquare className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardFooter>
    </Card>
  );

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="fixed bottom-4 right-4 size-14 rounded-full shadow-lg z-50"
          >
            {open ? <X className="size-6" /> : <MessageSquare className="size-6" />}
            <span className="sr-only">Abrir chat</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          sideOffset={16}
          align="end"
          className="w-80 md:w-96 p-0"
          style={{ 
            maxHeight: '70vh',
            height: '70vh',
            overflow: 'hidden'
          }}
        >
          {renderChatContent()}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-4 right-4 size-14 rounded-full shadow-lg z-50"
        >
          {open ? <X className="size-6" /> : <MessageSquare className="size-6" />}
          <span className="sr-only">Abrir chat</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-full">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Assistente Médico</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col h-full">
          {renderChatContent()}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export { FloatingChat }

