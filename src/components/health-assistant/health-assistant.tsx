'use client';


import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useHealthAssistant } from '@/hooks/use-health-assistant';
import {
    AlertTriangle,
    Bot,
    FileText,
    Heart,
    RefreshCw,
    Send,
    Stethoscope,
    User
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface HealthAssistantProps {
  className?: string;
}

export function HealthAssistant({ className }: HealthAssistantProps) {
  const {
    messages,
    isLoading,
    error,
    threadId,
    sendMessage,
    clearMessages,
  } = useHealthAssistant();

  const [inputMessage, setInputMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus no input quando o componente carrega
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content: string) => {
    // Quebrar linhas para melhor legibilidade
    return content.split('\n').map((line, index) => (
      <React.Fragment key={`line-${index}-${line.substring(0, 10)}`}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const getMessageIcon = (role: 'user' | 'assistant') => {
    return role === 'user' ? (
      <User className="size-4 text-blue-600" />
    ) : (
      <Bot className="size-4 text-green-600" />
    );
  };

  const getMessageStyle = (role: 'user' | 'assistant') => {
    return role === 'user'
      ? 'bg-blue-50 border-blue-200 ml-auto'
      : 'bg-green-50 border-green-200';
  };

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Stethoscope className="size-6 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-gray-800">
              Assistente de Saúde
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Especializado em análise de sintomas e interpretação de exames
            </p>
          </div>
          {threadId && (
            <Badge variant="secondary" className="ml-auto">
              <FileText className="size-3 mr-1" />
              Sessão ativa
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Área de mensagens */}
        <div className="h-96 relative">
          <ScrollArea 
            ref={scrollAreaRef}
            className="h-full p-4"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <Heart className="size-12 mb-4 text-green-400" />
                <h3 className="text-lg font-medium mb-2">
                  Olá! Sou seu assistente de saúde
                </h3>
                <p className="text-sm max-w-md">
                  Posso ajudar você a entender sintomas, interpretar exames laboratoriais 
                  e fornecer informações sobre suplementos. Lembre-se: sempre consulte 
                  um profissional de saúde para diagnóstico e tratamento.
                </p>
                <div className="mt-6 space-y-2">
                  <p className="text-xs font-medium text-gray-400">EXEMPLOS DE PERGUNTAS:</p>
                  <div className="text-xs space-y-1">
                    <p>• &ldquo;Tenho sentido muito cansaço, o que pode ser?&rdquo;</p>
                    <p>• &ldquo;Meu TSH está em 4.5, isso é normal?&rdquo;</p>
                    <p>• &ldquo;Para que serve o Omega 3 com DHA?&rdquo;</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div key={`message-${index}-${message.timestamp.getTime()}`} className="flex items-start gap-3">
                    <div className="shrink-0 mt-1">
                      {getMessageIcon(message.role)}
                    </div>
                    <div className={`flex-1 p-3 rounded-lg border ${getMessageStyle(message.role)}`}>
                      <div className="text-sm text-gray-800">
                        {formatMessage(message.content)}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-1">
                      <Bot className="size-4 text-green-600" />
                    </div>
                    <div className="flex-1 p-3 rounded-lg border bg-green-50 border-green-200">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="size-4 animate-spin text-green-600" />
                        <span className="text-sm text-gray-600">
                          Analisando sua pergunta...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        <Separator />

        {/* Área de erro */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-red-600 mt-0.5 shrink-0" />
              <div className="text-red-800 text-sm">
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Área de input */}
        <div className="p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta sobre saúde..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4"
            >
              <Send className="size-4" />
            </Button>
            {messages.length > 0 && (
              <Button
                variant="outline"
                onClick={clearMessages}
                disabled={isLoading}
                className="px-3"
                title="Limpar conversa"
              >
                <RefreshCw className="size-4" />
              </Button>
            )}
          </div>
          
          {/* Disclaimer */}
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-yellow-600 mt-0.5 shrink-0" />
              <div className="text-xs text-yellow-800">
                <strong>Importante:</strong> Este assistente fornece informações educativas apenas. 
                Não substitui consulta médica. Sempre consulte um profissional de saúde para 
                diagnóstico e tratamento.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 