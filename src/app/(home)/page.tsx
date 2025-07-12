import { ChatProvider } from '@/components/chat-provider';
import { Suspense } from 'react';

// Componente simples para mostrar enquanto o chat carrega
function ChatSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-muted-foreground">Carregando IA Médica...</div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatProvider />
    </Suspense>
  );
}
