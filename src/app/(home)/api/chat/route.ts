import { getSystemPromptForStep, type RequestHints } from '@/lib/ai/prompts';
import { myProvider } from '@/lib/ai/providers';

import { sendToWhatsapp } from '@/lib/ai/tools/send-to-whatsapp';
import { updateChatStep } from '@/lib/ai/tools/update-chat-step';
import { updateUserInfo } from '@/lib/ai/tools/update-user-info';
import { isProductionEnvironment } from '@/lib/constants';
import { ChatSDKError } from '@/lib/errors';
import { generateUUID } from '@/lib/utils';
import { geolocation } from '@vercel/functions';
import {
    appendClientMessage,
    createDataStream,
    generateObject,
    smoothStream,
    streamText
} from 'ai';
import { z } from 'zod';
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
    const { id, message, selectedChatModel, userInfo, chatStep = 'GATHERING_INFO' } = requestBody;

    const messages = appendClientMessage({
      messages: [],
      message,
    });
    
    // NOVO: Bloco para extrair a queixa principal
    let mainComplaint = userInfo?.mainComplaint || '';
    if (!mainComplaint && messages.length === 1 && messages[0].role === 'user') {
      try {
        const { object } = await generateObject({
          model: myProvider.languageModel('chat-model'),
          prompt: `Extraia o sintoma ou a queixa principal da seguinte mensagem de um paciente: "${messages[0].content}"`,
          schema: z.object({
            symptom: z.string().describe('O principal sintoma ou queixa. Ex: "dor de cabeça", "febre", "dor no peito".'),
          }),
        });
        mainComplaint = object.symptom;
      } catch (e) {
        console.error("Falha ao extrair a queixa principal:", e);
        // Prosseguir mesmo que falhe, o prompt lidará com isso.
      }
    }
    
    // Atualiza o userInfo com a queixa extraída para manter o estado
    const updatedUserInfo = { ...userInfo, mainComplaint };

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
          system: getSystemPromptForStep({
            step: chatStep,
            userInfo: updatedUserInfo,
            requestHints,
          }),
          messages,
          maxSteps: 5,
          experimental_activeTools: [
            'sendToWhatsapp',
            'updateChatStep',
            'updateUserInfo',
          ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            sendToWhatsapp: sendToWhatsapp,
            updateChatStep: updateChatStep,
            updateUserInfo: updateUserInfo,
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


