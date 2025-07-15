import { openai } from '@ai-sdk/openai';
import {
  customProvider
} from 'ai';
import { isTestEnvironment } from '../constants';
import {
  chatModel,
  titleModel,
} from './models.test';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'title-model': titleModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': openai('gpt-4o'),
        'title-model': openai('gpt-3.5-turbo'),
      },
    });
