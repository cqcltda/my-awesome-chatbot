import { tool } from 'ai';
import { z } from 'zod';

export const sendToWhatsapp = tool({
  description: 'Apresenta um botão para o usuário iniciar uma conversa no WhatsApp com um especialista médico.',
  parameters: z.object({
    message: z.string().describe('A mensagem inicial para pré-preencher no WhatsApp.'),
  }),
  execute: async ({ message }) => {
    // Gera a URL do WhatsApp com a mensagem pré-preenchida
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=+5511945139833&text=${encodedMessage}&type=phone_number&app_absent=0`;
    
    return {
      url: whatsappUrl,
      message: `Link para o WhatsApp gerado com sucesso.`,
    };
  },
}); 