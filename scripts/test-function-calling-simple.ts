#!/usr/bin/env tsx

import { createThread, runUnifiedAssistant } from '@/lib/ai/assistants';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

async function testFunctionCallingSimple() {
  try {

    // Verificar se a chave da API está configurada
    if (!process.env.OPENAI_API_KEY) {
      return;
    }

    // Verificar se o ID do assistente está configurado
    const assistantId = process.env.HEALTH_ASSISTANT_ID;
    if (!assistantId) {
      return;
    }


    // Teste 1: Mensagem que deve acionar o function calling
    
    // Criar uma nova thread para cada teste
    const threadId1 = await createThread();
    
    const userInfo = {
      name: 'João Silva',
      age: 35,
      gender: 'Masculino',
      weight: 75,
      height: 1.75,
      profession: 'Engenheiro',
      location: 'São Paulo',
      contact: '11999999999',
      mainComplaint: 'cancer',
      duration: '1 mês',
      intensity: 10
    };

    try {
      const response = await runUnifiedAssistant(
        assistantId,
        threadId1,
        'Tenho cancer e preciso de ajuda urgente',
        userInfo,
        'TRIAGE'
      );

      
      // Verificar se a resposta contém indicação de WhatsApp
      if (response.includes('WhatsApp') || response.includes('agendar') || response.includes('consulta')) {
      } else {
      }
    } catch (error) {
      console.error('❌ Erro no teste 1:', error);
    }


    // Teste 2: Mensagem que não deve acionar o function calling
    
    // Criar uma nova thread para o segundo teste
    const threadId2 = await createThread();
    
    try {
      const response = await runUnifiedAssistant(
        assistantId,
        threadId2,
        'Para que serve o Omega 3?',
        undefined,
        'GATHERING_INFO'
      );

      
      // Verificar se a resposta NÃO contém indicação de WhatsApp
      if (!response.includes('WhatsApp') && !response.includes('agendar')) {
      } else {
      }
    } catch (error) {
      console.error('❌ Erro no teste 2:', error);
    }


    // Teste 3: Triagem médica que deve acionar o function calling
    
    // Criar uma nova thread para o terceiro teste
    const threadId3 = await createThread();
    
    const userInfo2 = {
      name: 'Maria Santos',
      age: 45,
      gender: 'Feminino',
      weight: 65,
      height: 1.60,
      profession: 'Professora',
      location: 'Rio de Janeiro',
      contact: '21988888888',
      mainComplaint: 'dor no peito',
      duration: '2 horas',
      intensity: 9
    };

    try {
      const response = await runUnifiedAssistant(
        assistantId,
        threadId3,
        'Estou com dor no peito há 2 horas, intensidade 9/10',
        userInfo2,
        'TRIAGE'
      );

      
      // Verificar se a resposta contém indicação de WhatsApp
      if (response.includes('WhatsApp') || response.includes('agendar') || response.includes('consulta')) {
      } else {
      }
    } catch (error) {
      console.error('❌ Erro no teste 3:', error);
    }


  } catch (error) {
    console.error('❌ Erro geral:', error);
    process.exit(1);
  }
}

// Executar o script
if (require.main === module) {
  testFunctionCallingSimple();
} 