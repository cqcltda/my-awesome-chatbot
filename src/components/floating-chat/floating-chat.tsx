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

  // Função para enviar mensagem para o assistente unificado com streaming
  const handleUnifiedSubmit = async (message: string) => {
    await healthAssistant.sendMessageWithStreaming(message);
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
              {healthAssistant.threadId ? 'Sessão Ativa' : 'Inteligente'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {healthAssistant.messages.length > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={healthAssistant.clearMessages}
                disabled={healthAssistant.isLoading}
                className="hover:bg-muted/50 rounded-full"
                title="Limpar conversa"
              >
                <div className="size-4 rounded-full border-2 border-current" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCloseChat}
              className="hover:bg-muted/50 rounded-full"
            >
              <X className="size-5" />
            </Button>
          </div>
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
                      
                      {/* Botão de WhatsApp dentro da mensagem do assistente */}
                      {message.whatsAppUrl && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="size-8 bg-green-600 rounded-full flex items-center justify-center">
                              <svg className="size-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-green-800 text-sm">Consulta Médica Necessária</h4>
                              <p className="text-xs text-green-700">Clique para agendar sua consulta com o Dr. Bernardo</p>
                            </div>
                            <Button
                              onClick={() => window.open(message.whatsAppUrl!, '_blank')}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-auto"
                              size="sm"
                            >
                              Agendar
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {healthAssistant.isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span className="text-sm">Pensando...</span>
                  </div>
                )}
                

              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Área de erro */}
        {healthAssistant.error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200">
            <div className="flex items-start gap-2">
              <div className="size-4 text-red-600 mt-0.5 shrink-0">⚠️</div>
              <div className="text-red-800 text-sm">
                {healthAssistant.error}
              </div>
            </div>
          </div>
        )}
        
        {/* Sugestões movidas para fora do ScrollArea */}
        {healthAssistant.messages.length === 0 && !isKeyboardOpen && !healthAssistant.error && (
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
                disabled={healthAssistant.isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const value = e.currentTarget.value.trim();
                    if (value && !healthAssistant.isLoading) {
                      handleUnifiedSubmit(value);
                      e.currentTarget.value = '';
                    }
                  }
                }}
                onFocus={handleInputFocus}
                className="w-full resize-none min-h-[56px] p-3 border-0 bg-transparent focus:outline-none disabled:opacity-50"
                rows={1}
              />
              <div className="flex justify-end px-2 pb-2">
                <Button
                  disabled={healthAssistant.isLoading}
                  onClick={() => {
                    const textarea = document.querySelector('textarea[placeholder="Digite sua pergunta médica..."]') as HTMLTextAreaElement;
                    if (textarea && textarea.value.trim() && !healthAssistant.isLoading) {
                      handleUnifiedSubmit(textarea.value.trim());
                      textarea.value = '';
                    }
                  }}
                  className="rounded-full hover:scale-105 transition-transform duration-200"
                  size="icon"
                >
                  {healthAssistant.isLoading ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <MessageSquare className="size-4" />
                  )}
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

