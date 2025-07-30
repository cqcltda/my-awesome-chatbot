#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

async function checkAssistantConfig() {

  // Verificar se o arquivo de configuração existe
  if (!fs.existsSync('./health-assistant-config.json')) {
    return;
  }

  // Ler configuração
  const config = JSON.parse(fs.readFileSync('./health-assistant-config.json', 'utf8'));

  // Verificar variável de ambiente
  const envAssistantId = process.env.HEALTH_ASSISTANT_ID;
  if (!envAssistantId) {
    return;
  }


  // Verificar se os IDs coincidem
  if (envAssistantId !== config.assistantId) {
  } else {
  }

  // Verificar chave da OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return;
  }


  // Verificar se os arquivos PDF existem
  const pdfFiles = [
    './public/documents/base-1.pdf',
    './public/documents/base-2.pdf',
    './public/documents/base-3.pdf'
  ];

  let allFilesExist = true;
  pdfFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const size = fs.statSync(file).size;
      const sizeMB = (size / (1024 * 1024)).toFixed(2);
    } else {
      allFilesExist = false;
    }
  });

  if (!allFilesExist) {
  } else {
  }

  
  if (envAssistantId && openaiKey && allFilesExist) {
  } else {
  }
}

// Executar o script
if (require.main === module) {
  checkAssistantConfig();
} 