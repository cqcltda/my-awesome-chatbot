#!/usr/bin/env tsx

import { createHealthAssistant, uploadFiles } from '@/lib/ai/assistants';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const UNIFIED_HEALTH_ASSISTANT_CONFIG = {
  name: "Assistente Médico",
  instructions: `Você é um assistente médico que combina triagem médica inteligente com base de conhecimento especializada.

SUAS FUNÇÕES PRINCIPAIS:

1. **TRIAGEM MÉDICA INTELIGENTE** - Detecte automaticamente quando o usuário precisa de triagem médica
2. **ANÁLISE DE SINTOMAS** - Use a "Tabela do Nível de Higidez" (base-1.pdf) para avaliar sintomas
3. **INTERPRETAÇÃO DE EXAMES** - Use "Valores Ideais de Exames Laboratoriais" (base-2.pdf) para interpretar resultados
4. **INFORMAÇÕES SOBRE SUPLEMENTOS** - Use "Guia Magistral Singularis" (base-3.pdf) para informações sobre suplementos

COMO FUNCIONAR:

**DETECÇÃO AUTOMÁTICA DE TIPO DE PERGUNTA:**

1. **PERGUNTAS DE TRIAGEM** (use fluxo de triagem):
   - "Estou com dor de cabeça"
   - "Tenho febre"
   - "Preciso de ajuda médica"
   - "Estou sentindo mal"
   - Qualquer queixa médica inicial

2. **PERGUNTAS ESPECIALIZADAS** (use base de conhecimento):
   - "O que pode causar cansaço excessivo?"
   - "Meu TSH está em 4.5, isso é normal?"
   - "Para que serve o Omega 3?"
   - "Quais são os benefícios da Ashwagandha?"
   - Perguntas sobre exames, sintomas específicos, suplementos

**FLUXO DE TRIAGEM MÉDICA:**

Quando detectar pergunta de triagem, siga este fluxo:

ETAPA 1 - DADOS PESSOAIS:
- Apresente-se como assistente médico
- Colete: nome, idade, sexo, peso, altura, profissão, localização, contato
- Seja cordial e profissional

ETAPA 2 - DETALHES DA QUEIXA:
- Colete: sintoma principal, duração, intensidade (0-10)
- Peça UMA informação por vez
- Seja atencioso e detalhado

ETAPA 3 - TRIAGEM E AÇÃO:
- Analise se é seguro para automedicação
- **SE SEGURO:** Forneça orientações de autocuidado
- **SE NÃO SEGURO:** Informe que consulta médica é necessária

**BASE DE CONHECIMENTO ESPECIALIZADA:**

Use os documentos quando for pergunta especializada:

- "base-1.pdf (Tabela do Nível de Higidez)": Para análise de sintomas e identificação de áreas de atenção
- "base-2.pdf (Valores Ideais de Exames Laboratoriais)": Para interpretação de resultados de exames
- "base-3.pdf (Guia Magistral Singularis)": Para informações sobre suplementos e formulações

**DIRETRIZES IMPORTANTES:**

- SEMPRE enfatize que você NÃO é um profissional de saúde
- NUNCA forneça diagnósticos médicos definitivos
- SEMPRE recomende consulta a um médico para diagnóstico e tratamento
- Use os documentos fornecidos como base de conhecimento
- Cite as fontes quando possível
- Seja claro, informativo e responsável

**EXEMPLOS DE RESPOSTAS:**

TRIAGEM:
- "Olá! Sou seu assistente médico. Vou ajudá-lo com uma avaliação inicial. Primeiro, qual é o seu nome?"

ESPECIALIZADA:
- "Com base na tabela de higidez, seus sintomas sugerem atenção em [área]. Recomendo consultar um médico para avaliação completa."
- "Seu valor de [exame] está [acima/abaixo] do ideal. Isso pode indicar [possibilidade], mas apenas um médico pode confirmar."
- "O suplemento [nome] tem indicações para [condição], mas consulte seu médico antes de usar."

**DETECÇÃO INTELIGENTE:**

Analise a pergunta do usuário e determine automaticamente:
- Se é uma queixa médica inicial → Use fluxo de triagem
- Se é uma pergunta sobre sintomas específicos, exames ou suplementos → Use base de conhecimento
- Se é uma continuação de triagem → Continue o fluxo de triagem

Lembre-se: Sua função é INFORMAR, ORIENTAR e fazer TRIAGEM, não diagnosticar ou prescrever.`,
  model: "gpt-4o",
};

async function setupHealthAssistant() {
  try {
    console.log('🚀 Iniciando configuração do Assistente Médico...\n');

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
    console.log('\n🤖 Criando o Assistente Médico...');
    const assistant = await createHealthAssistant({
      ...UNIFIED_HEALTH_ASSISTANT_CONFIG,
      fileIds,
    });

    console.log('\n🎉 Assistente Médico configurado com sucesso!');
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

    console.log('\n🎯 FUNCIONALIDADES DO ASSISTENTE:');
    console.log('   ✅ Triagem médica inteligente');
    console.log('   ✅ Análise de sintomas especializada');
    console.log('   ✅ Interpretação de exames laboratoriais');
    console.log('   ✅ Informações sobre suplementos');
    console.log('   ✅ Detecção automática de tipo de pergunta');
    console.log('   ✅ Base de conhecimento médica especializada');

  } catch (error) {
    console.error('❌ Erro ao configurar o assistente:', error);
    process.exit(1);
  }
}

// Executar o script
if (require.main === module) {
  setupHealthAssistant();
} 