#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import OpenAI from 'openai';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

async function verifyAssistantFiles() {

  // Verificar se a chave da API está configurada
  if (!process.env.OPENAI_API_KEY) {
    return;
  }

  const assistantId = process.env.HEALTH_ASSISTANT_ID;
  if (!assistantId) {
    return;
  }


  // Criar cliente OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Buscar informações do assistente
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    
    // @ts-ignore - OpenAI API v5.10.2
    const fileIds = assistant.file_ids || [];

    if (fileIds.length > 0) {
      for (const fileId of fileIds) {
        try {
          const file = await openai.files.retrieve(fileId);
        } catch (error) {
        }
      }
    } else {
    }

    // Testar se o assistente consegue acessar os arquivos
    
    // Criar uma thread de teste
    const thread = await openai.beta.threads.create();

    // Adicionar uma pergunta que deve usar os arquivos
    const message = await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'Quais são os valores normais de TSH no sangue?',
    });

    // Criar um run
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Buscar mensagens
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    if (messages.data.length > 0) {
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
      if (assistantMessage) {
        const content = assistantMessage.content[0];
        if (content.type === 'text') {
          
          // Verificar se a resposta menciona informações dos arquivos
          const response = content.text.value.toLowerCase();
          if (response.includes('tsh') || response.includes('valores') || response.includes('normal')) {
          } else {
          }
        }
      } else {
      }
    }


  } catch (error) {
    console.error('\n❌ Erro durante a verificação:', error);
  }
}

// Executar o script
if (require.main === module) {
  verifyAssistantFiles();
} 