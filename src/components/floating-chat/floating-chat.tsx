"use client"

import { ArrowDown, MessageSquare, X } from "lucide-react"
import * as React from "react"

import { useAutoResume, useChatStep, useConditionalScroll, useMediaQuery, useUserInfo, useVirtualKeyboard } from "@/hooks"

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
import { Input, Suggestions } from "../ai"
import { ConversationWithResponse } from "../ai/conversation-with-response"
import { toast } from '../toast'

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

  const renderChatContent = () => (
    <Card className={`${isDesktop ? 'h-full max-h-full' : 'size-full'} border-0 md:border grid grid-rows-[auto_1fr_auto] overflow-hidden ${
      !isDesktop && isKeyboardOpen ? 'keyboard-open' : ''
    }`}>
      <CardHeader className={`shrink-0 px-6 py-4 ${!isDesktop && isKeyboardOpen ? 'hidden' : ''}`}>
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="size-2 bg-green-500 rounded-full animate-pulse" />
            <h1 className="text-xl font-semibold">IA Médica</h1>
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
          <div className={`px-6 py-4 ${!isDesktop && isKeyboardOpen ? 'pt-3' : ''}`}>
            <ConversationWithResponse
              messages={messages}
              status={status}
              chatId={id}
            />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="shrink-0 relative px-6 py-4">
        <form onSubmit={submitForm} className="flex bg-background gap-2 w-full sm:max-w-3xl">
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

            {messages.length === 0 && !isKeyboardOpen && (
              <Suggestions suggestions={[
                {title:'Estou com dor de cabeça', label:'pode me ajudar?'},
                {title:'Faz dois dias que tenho dores no peito', label:'o que devo fazer?'},
                {title:'Tenho dor de cabeça e estou com febre', label:'o que devo fazer?'},
              ]} onSuggestionClick={handleSuggestionClick} />
            )}

            <Input 
              onSubmit={submitForm} 
              inputValue={input} 
              setInput={setInput} 
              status={status} 
              stop={stop} 
              onFocus={handleInputFocus}
            />
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
          <DrawerTitle>IA Médica</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col h-full">
          {renderChatContent()}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export { FloatingChat }

