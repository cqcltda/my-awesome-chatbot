import { systemPrompt, type RequestHints } from '@/lib/ai/prompts';
import { myProvider } from '@/lib/ai/providers';

import { sendToWhatsapp } from '@/lib/ai/tools/send-to-whatsapp';
import { isProductionEnvironment } from '@/lib/constants';
import { ChatSDKError } from '@/lib/errors';
import { generateUUID } from '@/lib/utils';
import { geolocation } from '@vercel/functions';
import {
    appendClientMessage,
    createDataStream,
    smoothStream,
    streamText
} from 'ai';
import { postRequestBodySchema, type PostRequestBody } from './schema';

export const maxDuration = 60;

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const { id, message, selectedChatModel } = requestBody;

    const messages = appendClientMessage({
      messages: [],
      message,
    });

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    const stream = createDataStream({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages,
          maxSteps: 5,
          experimental_activeTools: [
            'sendToWhatsapp',
          ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            sendToWhatsapp: sendToWhatsapp,
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    return new Response(stream);
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
  }
}


