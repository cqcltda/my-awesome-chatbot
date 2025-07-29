import type { Geo } from '@vercel/functions';

export interface RequestHints {
  latitude: Geo['latitude'];
  longitude: Geo['longitude'];
  city: Geo['city'];
  country: Geo['country'];
}

export interface UserInfo {
  name?: string;
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  profession?: string;
  location?: string;
  contact?: string;
  mainComplaint?: string;
  duration?: string;
  intensity?: number;
}

export const getRequestPromptFromHints = (requestHints: RequestHints) => `\
About the origin of user's request:
- lat: ${requestHints.latitude}
- lon: ${requestHints.longitude}
- city: ${requestHints.city}
- country: ${requestHints.country}
`;

// Função para formatar as informações do usuário para o prompt
export const formatUserInfoForPrompt = (userInfo: UserInfo) => {
  if (!userInfo || Object.keys(userInfo).length === 0) {
    return 'Nenhuma informação do usuário disponível ainda.';
  }

  return `
Informações já coletadas sobre o usuário:
- Nome: ${userInfo.name || 'Não informado'}
- Idade: ${userInfo.age || 'Não informado'}
- Gênero: ${userInfo.gender || 'Não informado'}
- Peso: ${userInfo.weight || 'Não informado'}
- Altura: ${userInfo.height || 'Não informado'}
- Profissão: ${userInfo.profession || 'Não informado'}
- Localização: ${userInfo.location || 'Não informado'}
- Contato: ${userInfo.contact || 'Não informado'}
- Queixa Principal: ${userInfo.mainComplaint || 'Não informada'}
- Duração dos Sintomas: ${userInfo.duration || 'Não informada'}
- Intensidade (0-10): ${userInfo.intensity === undefined ? 'Não informada' : userInfo.intensity}
`;
};

// Prompts específicos para cada etapa (VERSÃO TEMPORÁRIA - SEM FUNCTION CALLING)
const promptEtapa1 = (userInfo: UserInfo) => `
**ETAPA ATUAL: 1 - DADOS PESSOAIS**
- Apresente-se e peça os dados básicos do paciente (nome, idade, sexo, etc.).
- Colete as informações de forma natural e conversacional.
- Quando todos os dados pessoais forem coletados, informe ao usuário que passará para a próxima etapa.

${formatUserInfoForPrompt(userInfo)}
`;

const promptEtapa2 = (userInfo: UserInfo) => `
**ETAPA ATUAL: 2 - DETALHES DA QUEIXA**
- Agora, colete os 3 detalhes da queixa principal: Sintoma, Duração e Intensidade (0-10).
- Peça UMA informação por vez de forma conversacional.
- Quando os 3 detalhes da queixa forem coletados, informe ao usuário que passará para a triagem.

${formatUserInfoForPrompt(userInfo)}
`;

const promptEtapa3 = (userInfo: UserInfo) => `
**ETAPA ATUAL: 3 - TRIAGEM E AÇÃO**
- Você tem todas as informações do paciente. Analise os critérios de automedicação segura.
- **SE FOR SEGURO:** Forneça orientações de autocuidado e encerre.
- **SE NÃO FOR SEGURO:** Informe ao usuário que uma consulta é necessária e forneça orientações sobre como proceder.

${formatUserInfoForPrompt(userInfo)}
`;



// Função principal que seleciona o prompt baseado na etapa atual
export const getSystemPromptForStep = ({
  step,
  userInfo,
  requestHints
}: {
  step: string;
  userInfo?: UserInfo;
  requestHints: RequestHints;
}) => {
  const baseRules = `Você é uma IA médica. Siga a ETAPA ATUAL. NÃO mostre JSON ou código para o usuário. ${getRequestPromptFromHints(requestHints)}`;

  let stepPrompt = '';
  switch (step) {
    case 'MEDICAL_EVALUATION':
      stepPrompt = promptEtapa2(userInfo || {});
      break;
    case 'TRIAGE':
      stepPrompt = promptEtapa3(userInfo || {});
      break;
    case 'GATHERING_INFO':
    default:
      stepPrompt = promptEtapa1(userInfo || {});
      break;
  }

  return `${baseRules}\n${stepPrompt}`;
};

// Função systemPrompt atualizada para usar a nova estrutura
export const systemPrompt = ({
  selectedChatModel,
  requestHints,
  userInfo,
  chatStep = 'GATHERING_INFO',
}: {
  selectedChatModel: string; 
  requestHints: RequestHints;
  userInfo?: UserInfo;
  chatStep?: string;
}) => {
  return getSystemPromptForStep({ step: chatStep, userInfo, requestHints });
};


