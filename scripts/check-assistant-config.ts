#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

async function checkAssistantConfig() {
  console.log('🔍 Verificando configuração do Assistente Médico...\n');

  // Verificar se o arquivo de configuração existe
  if (!fs.existsSync('./health-assistant-config.json')) {
    console.log('❌ Arquivo health-assistant-config.json não encontrado');
    console.log('💡 Execute o script de setup: pnpm run setup-assistant');
    return;
  }

  // Ler configuração
  const config = JSON.parse(fs.readFileSync('./health-assistant-config.json', 'utf8'));
  console.log('✅ Arquivo de configuração encontrado');
  console.log(`📋 ID do Assistente: ${config.assistantId}`);
  console.log(`📝 Nome: ${config.name}`);
  console.log(`🧠 Modelo: ${config.model}`);
  console.log(`📁 Arquivos: ${config.fileIds.length}`);

  // Verificar variável de ambiente
  const envAssistantId = process.env.HEALTH_ASSISTANT_ID;
  if (!envAssistantId) {
    console.log('\n❌ Variável HEALTH_ASSISTANT_ID não encontrada no .env.local');
    console.log('💡 Adicione a seguinte linha ao seu arquivo .env.local:');
    console.log(`   HEALTH_ASSISTANT_ID=${config.assistantId}`);
    return;
  }

  console.log('\n✅ Variável HEALTH_ASSISTANT_ID configurada');
  console.log(`🔑 Valor: ${envAssistantId}`);

  // Verificar se os IDs coincidem
  if (envAssistantId !== config.assistantId) {
    console.log('\n⚠️  AVISO: O ID da variável de ambiente não coincide com o arquivo de configuração');
    console.log(`   Config: ${config.assistantId}`);
    console.log(`   Env:    ${envAssistantId}`);
  } else {
    console.log('\n✅ IDs coincidem - configuração correta');
  }

  // Verificar chave da OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.log('\n❌ Variável OPENAI_API_KEY não encontrada');
    console.log('💡 Adicione sua chave da OpenAI ao arquivo .env.local');
    return;
  }

  console.log('\n✅ Variável OPENAI_API_KEY configurada');
  console.log(`🔑 Chave: ${openaiKey.substring(0, 10)}...`);

  // Verificar se os arquivos PDF existem
  const pdfFiles = [
    './public/documents/base-1.pdf',
    './public/documents/base-2.pdf',
    './public/documents/base-3.pdf'
  ];

  console.log('\n📄 Verificando arquivos PDF:');
  let allFilesExist = true;
  pdfFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const size = fs.statSync(file).size;
      const sizeMB = (size / (1024 * 1024)).toFixed(2);
      console.log(`   ✅ ${file} (${sizeMB} MB)`);
    } else {
      console.log(`   ❌ ${file} - NÃO ENCONTRADO`);
      allFilesExist = false;
    }
  });

  if (!allFilesExist) {
    console.log('\n⚠️  Alguns arquivos PDF não foram encontrados');
    console.log('💡 Certifique-se de que todos os arquivos estão na pasta public/documents');
  } else {
    console.log('\n✅ Todos os arquivos PDF encontrados');
  }

  console.log('\n🎯 Status da Configuração:');
  console.log(`   ${envAssistantId ? '✅' : '❌'} HEALTH_ASSISTANT_ID configurada`);
  console.log(`   ${openaiKey ? '✅' : '❌'} OPENAI_API_KEY configurada`);
  console.log(`   ${allFilesExist ? '✅' : '❌'} Arquivos PDF presentes`);
  
  if (envAssistantId && openaiKey && allFilesExist) {
    console.log('\n🎉 Configuração completa! O assistente deve funcionar corretamente.');
  } else {
    console.log('\n⚠️  Configuração incompleta. Corrija os itens marcados com ❌');
  }
}

// Executar o script
if (require.main === module) {
  checkAssistantConfig();
} 