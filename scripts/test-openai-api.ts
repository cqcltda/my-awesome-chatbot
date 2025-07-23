#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import OpenAI from 'openai';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

async function testOpenAIAPI() {
  console.log('🧪 Testando API da OpenAI...\n');

  // Verificar se a chave da API está configurada
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ OPENAI_API_KEY não encontrada');
    return;
  }

  console.log('✅ Chave da API encontrada');

  // Criar cliente OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Teste 1: Criar uma thread
    console.log('\n📝 Teste 1: Criando thread...');
    const thread = await openai.beta.threads.create();
    console.log(`✅ Thread criada com ID: ${thread.id}`);

    // Teste 2: Adicionar mensagem à thread
    console.log('\n💬 Teste 2: Adicionando mensagem...');
    const message = await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'Teste de mensagem',
    });
    console.log(`✅ Mensagem adicionada com ID: ${message.id}`);

    // Teste 3: Verificar se o assistente existe
    console.log('\n🤖 Teste 3: Verificando assistente...');
    const assistantId = process.env.HEALTH_ASSISTANT_ID;
    if (!assistantId) {
      console.log('❌ HEALTH_ASSISTANT_ID não encontrada');
      return;
    }

    const assistant = await openai.beta.assistants.retrieve(assistantId);
    console.log(`✅ Assistente encontrado: ${assistant.name}`);

    // Teste 4: Criar um run (sem aguardar conclusão)
    console.log('\n🚀 Teste 4: Criando run...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });
    console.log(`✅ Run criado com ID: ${run.id}, status: ${run.status}`);

    // Teste 5: Verificar status do run
    console.log('\n📊 Teste 5: Verificando status do run...');
    console.log(`Thread ID: ${thread.id}, Run ID: ${run.id}`);
    console.log(`Thread ID type: ${typeof thread.id}, Run ID type: ${typeof run.id}`);
    console.log(`Thread ID length: ${thread.id?.length}, Run ID length: ${run.id?.length}`);
    
    // Usar a sintaxe correta da OpenAI v5.10.1
    // @ts-ignore - OpenAI API v5.10.1
    const runStatus = await openai.beta.threads.runs.retrieve(thread.id, { run_id: run.id });
    console.log(`✅ Status do run: ${runStatus.status}`);

    console.log('\n🎉 Todos os testes passaram! A API da OpenAI está funcionando corretamente.');

  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
    
    if (error instanceof Error) {
      console.error('Mensagem de erro:', error.message);
      
      // Verificar se é um erro de autenticação
      if (error.message.includes('401') || error.message.includes('authentication')) {
        console.log('\n💡 Possível problema de autenticação. Verifique sua chave da API.');
      }
      
      // Verificar se é um erro de rate limit
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        console.log('\n💡 Rate limit atingido. Aguarde um pouco e tente novamente.');
      }
    }
  }
}

// Executar o script
if (require.main === module) {
  testOpenAIAPI();
} 