import { tool } from 'ai';
import { z } from 'zod';

// Schema com todos os dados que podem ser coletados
const userInfoSchema = z.object({
  name: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  profession: z.string().optional(),
  location: z.string().optional(),
  contact: z.string().optional(),
  mainComplaint: z.string().optional(),
  duration: z.string().optional(),
  intensity: z.number().optional(),
});

export const updateUserInfo = tool({
  description: 'Atualiza ou salva as informações do paciente. Use esta ferramenta sempre que coletar um novo dado.',
  parameters: userInfoSchema,
  execute: async (userInfo) => {
    // Esta ferramenta não precisa de lógica no backend.
    // Ela serve apenas para a IA nos comunicar os dados de forma estruturada.
    // A mágica acontecerá no `onToolCall` do frontend.
    return userInfo;
  },
}); 