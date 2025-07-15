import { useEffect, useState } from 'react';

export type ChatStep = 'GATHERING_INFO' | 'MEDICAL_EVALUATION' | 'TRIAGE' | 'DECISION' | 'FINAL_RECOMMENDATION';

export const useChatStep = (chatId: string) => {
  const [chatStep, setChatStep] = useState<ChatStep>('GATHERING_INFO');

  // Carregar o estado da etapa do localStorage quando o componente montar
  useEffect(() => {
    const savedStep = localStorage.getItem(`chat-step-${chatId}`);
    if (savedStep && isValidChatStep(savedStep)) {
      setChatStep(savedStep as ChatStep);
    }
  }, [chatId]);

  // Salvar o estado da etapa no localStorage sempre que mudar
  const updateChatStep = (newStep: ChatStep) => {
    setChatStep(newStep);
    localStorage.setItem(`chat-step-${chatId}`, newStep);
  };

  // Resetar o estado da etapa
  const resetChatStep = () => {
    updateChatStep('GATHERING_INFO');
  };

  return {
    chatStep,
    updateChatStep,
    resetChatStep,
  };
};

// Função auxiliar para validar se o step é válido
function isValidChatStep(step: string): step is ChatStep {
  return ['GATHERING_INFO', 'MEDICAL_EVALUATION', 'TRIAGE', 'DECISION', 'FINAL_RECOMMENDATION'].includes(step);
} 