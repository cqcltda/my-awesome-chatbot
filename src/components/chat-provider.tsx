'use client';

import { DataStreamHandler } from '@/components/data-stream-handler';
import { FloatingChat } from '@/components/floating-chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';

export function ChatProvider() {
  const id = generateUUID();

  return (
    <>
      <FloatingChat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={DEFAULT_CHAT_MODEL}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
} 