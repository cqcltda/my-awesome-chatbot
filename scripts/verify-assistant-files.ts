#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import OpenAI from 'openai';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

async function verifyAssistantFiles() {
  console.log('🔍 Verificando arquivos do assistente...\n');

  // Verificar se a chave da API está configurada
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ OPENAI_API_KEY não encontrada');
    return;
  }

  const assistantId = process.env.HEALTH_ASSISTANT_ID;
  if (!assistantId) {
    console.log('❌ HEALTH_ASSISTANT_ID não encontrada');
    return;
  }

  console.log('✅ Chaves da API encontradas');

  // Criar cliente OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Buscar informações do assistente
    console.log('\n🤖 Buscando informações do assistente...');
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    
    console.log(`✅ Assistente encontrado: ${assistant.name}`);
    console.log(`📝 Modelo: ${assistant.model}`);
    // @ts-ignore - OpenAI API v5.10.2
    const fileIds = assistant.file_ids || [];
    console.log(`📁 Arquivos associados: ${fileIds.length}`);

    if (fileIds.length > 0) {
      console.log('\n📚 Arquivos associados ao assistente:');
      for (const fileId of fileIds) {
        try {
          const file = await openai.files.retrieve(fileId);
          console.log(`   ✅ ${file.filename} (ID: ${fileId}, Tamanho: ${file.bytes} bytes)`);
        } catch (error) {
          console.log(`   ❌ Arquivo ${fileId} não encontrado`);
        }
      }
    } else {
      console.log('\n⚠️  Nenhum arquivo associado ao assistente');
    }

    // Testar se o assistente consegue acessar os arquivos
    console.log('\n🧪 Testando acesso aos arquivos...');
    
    // Criar uma thread de teste
    const thread = await openai.beta.threads.create();
    console.log(`📝 Thread de teste criada: ${thread.id}`);

    // Adicionar uma pergunta que deve usar os arquivos
    const message = await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'Quais são os valores normais de TSH no sangue?',
    });
    console.log(`💬 Mensagem de teste adicionada: ${message.id}`);

    // Criar um run
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });
    console.log(`🚀 Run criado: ${run.id}`);

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Buscar mensagens
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    if (messages.data.length > 0) {
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
      if (assistantMessage) {
        const content = assistantMessage.content[0];
        if (content.type === 'text') {
          console.log('\n📋 Resposta do assistente:');
          console.log(content.text.value);
          
          // Verificar se a resposta menciona informações dos arquivos
          const response = content.text.value.toLowerCase();
          if (response.includes('tsh') || response.includes('valores') || response.includes('normal')) {
            console.log('\n✅ O assistente parece estar usando informações dos arquivos base!');
          } else {
            console.log('\n⚠️  A resposta não parece usar informações específicas dos arquivos');
          }
        }
      } else {
        console.log('\n⚠️  Nenhuma resposta do assistente encontrada');
      }
    }

    console.log('\n🎉 Verificação concluída!');

  } catch (error) {
    console.error('\n❌ Erro durante a verificação:', error);
  }
}

// Executar o script
if (require.main === module) {
  verifyAssistantFiles();
} 