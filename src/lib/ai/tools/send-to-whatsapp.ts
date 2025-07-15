import { tool } from 'ai';
import { z } from 'zod';

export const sendToWhatsapp = tool({
  description: `Encaminha o paciente para o WhatsApp para agendar uma consulta. Esta ferramenta DEVE ser usada QUANDO o encaminhamento para um médico for necessário. Ela recebe todas as informações do paciente de uma vez.`,
  parameters: z.object({
    userInfo: z.object({
      name: z.string().describe('Nome completo do paciente.'),
      age: z.number().describe('Idade do paciente.'),
      gender: z.string().describe('Sexo do paciente.'),
      weight: z.number().describe('Peso do paciente em kg.'),
      height: z.number().describe('Altura do paciente em metros.'),
      profession: z.string().describe('Profissão do paciente.'),
    }),
  }),
  execute: async ({ userInfo }) => { // Recebe o objeto userInfo
    const { name, age, gender, weight, height, profession } = userInfo;
    const phoneNumber = '+5511945139833'; // Número do consultório do Dr. Bernardo

    const greeting = 'Olá, fiz um atendimento inicial com a IA médica e gostaria de agendar uma consulta com o Dr. Bernardo. Segue minhas informações abaixo:';
    const patientInfo = [
      `Nome: ${name}`,
      `Idade: ${age}`,
      `Sexo: ${gender}`,
      `Peso: ${weight}kg`,
      `Altura: ${height}m`,
      `Profissão: ${profession}`,
    ].join('\n'); // Usa '\n' para quebras de linha na mensagem

    const text = encodeURIComponent(`${greeting}\n\n${patientInfo}`);
    const url = `https://wa.me/${phoneNumber}?text=${text}`;

    return {
      url,
      message: `Tudo pronto! Para agendar sua consulta com o Dr. Bernardo, clique no botão abaixo.`,
    };
  },
}); 