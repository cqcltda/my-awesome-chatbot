import { tool } from 'ai';
import { z } from 'zod';

export const updateChatStep = tool({
  description: 'Atualiza o estado da conversa para a próxima etapa. Use esta ferramenta assim que uma etapa for concluída.',
  parameters: z.object({
    nextStep: z.string().describe("A próxima etapa da conversa. Ex: 'MEDICAL_EVALUATION', 'TRIAGE', 'FINAL_RECOMMENDATION'"),
  }),
  execute: async ({ nextStep }) => {
    // Esta ferramenta não precisa fazer nada no backend,
    // sua execução será tratada pelo `onToolCall` no frontend.
    return { success: true, nextStep };
  },
}); 