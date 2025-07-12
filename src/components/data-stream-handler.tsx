'use client';

import { useChat } from '@ai-sdk/react';

export function DataStreamHandler({ id }: { id: string }) {
  const { data: dataStream } = useChat({ id });

  // Componente simplificado - não precisa mais processar artefatos
  // Apenas mantém a conexão com o chat para compatibilidade
  return null;
}
