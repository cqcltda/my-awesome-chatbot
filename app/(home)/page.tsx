import { cookies } from 'next/headers';

import { DataStreamHandler } from '@/components/data-stream-handler';
import { FloatingChat } from '@/components/floating-chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { auth } from '../(auth)/auth';
// import { FloatingChat } from './chat/components/floating-chat';

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <FloatingChat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          autoResume={false}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <FloatingChat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
