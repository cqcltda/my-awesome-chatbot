'use client';

import type { UIMessage } from 'ai';
import { useCallback, useEffect, useRef, useState } from 'react';

export const useConditionalScroll = (messages: UIMessage[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (element) {
      // Para ScrollArea do Radix UI, precisamos acessar o viewport
      const viewport = element.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      const scrollElement = viewport || element;
      
      if (scrollElement) {
        const isOverflowing = scrollElement.scrollHeight > scrollElement.clientHeight;
        const isAtBottom = scrollElement.scrollHeight - scrollElement.scrollTop <= scrollElement.clientHeight + 5; // +5 para tolerância

        setShowScrollButton(isOverflowing && !isAtBottom);
      }
    }
  }, []);

  // Recalcula quando as mensagens mudam (o conteúdo cresce)
  useEffect(() => {
    // Pequeno delay para garantir que o DOM foi atualizado
    const timer = setTimeout(handleScroll, 100);
    return () => clearTimeout(timer);
  }, [messages, handleScroll]);

  // Adiciona listener de scroll
  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      const viewport = element.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      const scrollElement = viewport || element;
      
      if (scrollElement) {
        scrollElement.addEventListener('scroll', handleScroll);
        return () => scrollElement.removeEventListener('scroll', handleScroll);
      }
    }
  }, [handleScroll]);

  const scrollToBottom = () => {
    const element = scrollRef.current;
    if (element) {
      // Para ScrollArea do Radix UI, precisamos acessar o viewport
      const viewport = element.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      const scrollElement = viewport || element;
      
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  };

  return { scrollRef, showScrollButton, scrollToBottom, handleScroll };
}; 