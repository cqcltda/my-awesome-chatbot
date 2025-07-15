import { tool } from 'ai';
import { z } from 'zod';

export const extractMedicalInfo = tool({
  description: 'Extrai informações médicas específicas das respostas do usuário para atualizar o estado da conversa.',
  parameters: z.object({
    mainComplaint: z.string().optional().describe('A queixa principal do paciente (ex: dor de cabeça, febre)'),
    duration: z.string().optional().describe('Há quanto tempo o sintoma está presente'),
    intensity: z.number().optional().describe('Intensidade do sintoma (escala 0-10)'),
  }),
  execute: async ({ mainComplaint, duration, intensity }) => {
    // Esta ferramenta não precisa fazer nada no backend,
    // sua execução será tratada pelo frontend para atualizar o userInfo
    return { 
      success: true, 
      mainComplaint, 
      duration, 
      intensity 
    };
  },
}); 