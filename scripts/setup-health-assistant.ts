#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { createHealthAssistant, uploadFiles } from '../src/lib/ai/assistants';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const HEALTH_ASSISTANT_CONFIG = {
  name: "Assistente de Saúde e Bem-Estar",
  instructions: `Você é um assistente de saúde e bem-estar especializado em análise de sintomas e interpretação de exames laboratoriais.

SUAS FUNÇÕES PRINCIPAIS:
1. Analisar sintomas com base na "Tabela do Nível de Higidez" (base-1.pdf)
2. Interpretar resultados de exames laboratoriais usando os "Valores Ideais de Exames Laboratoriais" (base-2.pdf)
3. Fornecer informações sobre suplementos e formulações magistrais baseadas no "Guia Magistral Singularis" (base-3.pdf)

DIRETRIZES IMPORTANTES:
- SEMPRE enfatize que você NÃO é um profissional de saúde
- NUNCA forneça diagnósticos médicos definitivos
- SEMPRE recomende consulta a um médico para diagnóstico e tratamento
- Use os documentos fornecidos como base de conhecimento
- Cite as fontes quando possível
- Seja claro, informativo e responsável

COMO USAR OS DOCUMENTOS:
- "base-1.pdf (Tabela do Nível de Higidez)": Use para avaliar sintomas e identificar áreas de atenção
- "base-2.pdf (Valores Ideais de Exames Laboratoriais)": Use para interpretar resultados de exames
- "base-3.pdf (Guia Magistral Singularis)": Use para informações sobre suplementos e formulações

EXEMPLOS DE RESPOSTAS:
- "Com base na tabela de higidez, seus sintomas sugerem atenção em [área]. Recomendo consultar um médico para avaliação completa."
- "Seu valor de [exame] está [acima/abaixo] do ideal. Isso pode indicar [possibilidade], mas apenas um médico pode confirmar."
- "O suplemento [nome] tem indicações para [condição], mas consulte seu médico antes de usar."

Lembre-se: Sua função é INFORMAR e ORIENTAR, não diagnosticar ou prescrever.`,
  model: "gpt-4o",
};

async function setupHealthAssistant() {
  try {
    console.log('🚀 Iniciando configuração do Assistente de Saúde...\n');

    // Verificar se a chave da API está configurada
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ OPENAI_API_KEY não encontrada no arquivo .env.local');
      console.log('💡 Adicione sua chave da OpenAI no arquivo .env.local:');
      console.log('   OPENAI_API_KEY=sua_chave_aqui');
      return;
    }

    console.log('✅ Chave da API da OpenAI configurada');

    // Verificar se os arquivos PDF existem na pasta public/documents
    const pdfFiles = [
      './public/documents/base-1.pdf',
      './public/documents/base-2.pdf',
      './public/documents/base-3.pdf'
    ];

    const existingFiles = pdfFiles.filter(file => fs.existsSync(file));
    
    if (existingFiles.length === 0) {
      console.log('❌ Nenhum arquivo PDF encontrado na pasta public/documents.');
      console.log('📁 Arquivos esperados:');
      pdfFiles.forEach(file => console.log(`   - ${file}`));
      console.log('\n💡 Coloque os arquivos PDF na pasta public/documents e execute novamente.');
      return;
    }

    console.log(`📄 Arquivos encontrados: ${existingFiles.length}/${pdfFiles.length}`);
    existingFiles.forEach(file => {
      const fileName = path.basename(file);
      const fileSize = fs.statSync(file).size;
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      console.log(`   ✅ ${fileName} (${fileSizeMB} MB)`);
    });

    if (existingFiles.length < pdfFiles.length) {
      console.log('\n⚠️  Alguns arquivos não foram encontrados. O assistente será criado com os arquivos disponíveis.');
    }

    // Upload dos arquivos
    console.log('\n📤 Fazendo upload dos arquivos para a OpenAI...');
    const fileIds = await uploadFiles(existingFiles);
    console.log(`✅ ${fileIds.length} arquivos enviados com sucesso!`);

    // Criar o assistente
    console.log('\n🤖 Criando o Assistente de Saúde...');
    const assistant = await createHealthAssistant({
      ...HEALTH_ASSISTANT_CONFIG,
      fileIds,
    });

    console.log('\n🎉 Assistente de Saúde configurado com sucesso!');
    console.log(`📋 ID do Assistente: ${assistant.id}`);
    console.log(`📝 Nome: ${assistant.name}`);
    console.log(`🧠 Modelo: ${assistant.model}`);
    console.log(`📁 Arquivos associados: ${assistant.fileIds.length}`);

    // Salvar o ID do assistente em um arquivo para uso posterior
    const configData = {
      assistantId: assistant.id,
      name: assistant.name,
      model: assistant.model,
      fileIds: assistant.fileIds,
      createdAt: new Date().toISOString(),
      files: existingFiles.map(file => ({
        path: file,
        name: path.basename(file),
        size: fs.statSync(file).size
      }))
    };

    fs.writeFileSync(
      './health-assistant-config.json',
      JSON.stringify(configData, null, 2)
    );

    console.log('\n💾 Configuração salva em: ./health-assistant-config.json');
    console.log('\n🔧 Para usar o assistente, adicione o ID nas variáveis de ambiente:');
    console.log(`   HEALTH_ASSISTANT_ID=${assistant.id}`);

    // Mostrar informações sobre os arquivos
    console.log('\n📚 Documentos carregados:');
    existingFiles.forEach((file, index) => {
      const fileName = path.basename(file);
      const descriptions = [
        'Tabela do Nível de Higidez',
        'Valores Ideais de Exames Laboratoriais', 
        'Guia Magistral Singularis'
      ];
      console.log(`   ${index + 1}. ${fileName} - ${descriptions[index] || 'Documento'}`);
    });

  } catch (error) {
    console.error('❌ Erro ao configurar o assistente:', error);
    process.exit(1);
  }
}

// Executar o script
if (require.main === module) {
  setupHealthAssistant();
} 