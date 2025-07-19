# Configuração da API de Assistentes da OpenAI

Este documento explica como configurar e usar a API de Assistentes da OpenAI no projeto, permitindo que o chatbot use documentos específicos como base de conhecimento.

## 🚀 Visão Geral

A API de Assistentes da OpenAI permite criar um assistente especializado que pode:

- Usar documentos específicos como base de conhecimento
- Manter contexto de conversa através de threads
- Fornecer respostas baseadas em informações confiáveis
- Gerenciar conversas de forma estruturada

## 📋 Pré-requisitos

1. **Chave da API da OpenAI**: Configure sua chave no arquivo `.env.local`
2. **Documentos PDF**: Coloque os arquivos PDF na pasta `public/documents`
3. **Dependências**: O pacote `openai` já está instalado

## 🔧 Configuração Inicial

### 1. Configurar Variáveis de Ambiente

Crie ou atualize o arquivo `.env.local`:

```env
# OpenAI Configuration
OPENAI_API_KEY=sua_chave_de_api_aqui

# Health Assistant ID (será gerado automaticamente)
HEALTH_ASSISTANT_ID=

# Outras configurações existentes...
POSTGRES_URL=sua_url_postgres_aqui
AUTH_SECRET=seu_auth_secret_aqui
```

### 2. Preparar Documentos PDF

Coloque os seguintes arquivos PDF na pasta `public/documents`:

- `base-1.pdf` - Tabela do Nível de Higidez
- `base-2.pdf` - Valores Ideais de Exames Laboratoriais
- `base-3.pdf` - Guia Magistral Singularis

### 3. Executar Script de Configuração

```bash
pnpm run setup-assistant
```

Este script irá:

- Fazer upload dos arquivos PDF para a OpenAI
- Criar o assistente de saúde com as instruções apropriadas
- Salvar a configuração em `health-assistant-config.json`
- Exibir o ID do assistente para adicionar ao `.env.local`

## 🏗️ Estrutura do Projeto

### Arquivos Criados/Modificados

```
src/
├── lib/ai/
│   └── assistants.ts              # Serviço principal da API de Assistentes
├── hooks/
│   └── use-health-assistant.ts    # Hook React para o assistente
├── components/health-assistant/
│   ├── health-assistant.tsx       # Componente de interface
│   └── index.ts                   # Exportações
├── app/(home)/api/assistant/
│   └── route.ts                   # API route para o assistente
└── app/(home)/health-assistant/
    └── page.tsx                   # Página de demonstração

public/
└── documents/                     # Pasta com os PDFs
    ├── base-1.pdf                 # Tabela do Nível de Higidez
    ├── base-2.pdf                 # Valores Ideais de Exames Laboratoriais
    └── base-3.pdf                 # Guia Magistral Singularis

scripts/
└── setup-health-assistant.ts      # Script de configuração
```

## 🎯 Como Usar

### 1. Acessar a Interface

Navegue para `/health-assistant` para usar o assistente de saúde.

### 2. Usar Programaticamente

```typescript
import { useHealthAssistant } from "@/hooks/use-health-assistant";

function MyComponent() {
  const { messages, isLoading, sendMessage, clearMessages } =
    useHealthAssistant();

  const handleSendMessage = async () => {
    await sendMessage("Tenho sentido muito cansaço, o que pode ser?");
  };

  return <div>{/* Sua interface aqui */}</div>;
}
```

### 3. Usar a API Diretamente

```typescript
// Enviar mensagem
const response = await fetch("/api/assistant", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "Sua pergunta aqui",
    threadId: "opcional", // Para continuar conversa existente
  }),
});

// Obter histórico
const history = await fetch("/api/assistant?threadId=seu_thread_id");
```

## 🔍 Funcionalidades

### Assistente de Saúde

O assistente está configurado para:

1. **Análise de Sintomas**: Usa o "base-1.pdf (Tabela do Nível de Higidez)" para avaliar sintomas
2. **Interpretação de Exames**: Usa "base-2.pdf (Valores Ideais de Exames Laboratoriais)" para interpretar resultados
3. **Informações sobre Suplementos**: Usa "base-3.pdf (Guia Magistral Singularis)" para informações sobre suplementos

### Características

- ✅ **Contexto Persistente**: Mantém histórico da conversa
- ✅ **Base de Conhecimento**: Usa documentos específicos como fonte
- ✅ **Interface Responsiva**: Design moderno e acessível
- ✅ **Tratamento de Erros**: Feedback claro para o usuário
- ✅ **Disclaimer Médico**: Sempre enfatiza a necessidade de consulta médica

## 🛠️ Desenvolvimento

### Adicionar Novo Assistente

1. Crie uma nova configuração em `scripts/setup-health-assistant.ts`
2. Execute o script de configuração
3. Crie novos componentes/hooks se necessário

### Modificar Instruções

Edite as instruções do assistente em `scripts/setup-health-assistant.ts`:

```typescript
const HEALTH_ASSISTANT_CONFIG = {
  name: "Seu Assistente",
  instructions: `Suas instruções aqui...`,
  model: "gpt-4o",
};
```

### Adicionar Novos Documentos

1. Adicione os arquivos PDF na pasta `public/documents`
2. Atualize o array `pdfFiles` no script de configuração
3. Execute `pnpm run setup-assistant` novamente

## 🔒 Segurança e Boas Práticas

### Variáveis de Ambiente

- ✅ Nunca commite chaves de API no código
- ✅ Use `.env.local` para configurações locais
- ✅ Configure variáveis de ambiente no servidor de produção

### Tratamento de Dados

- ✅ O assistente não armazena dados pessoais permanentemente
- ✅ Threads são gerenciadas pela OpenAI
- ✅ Sempre inclua disclaimers médicos

### Rate Limiting

- ✅ A API tem limites de uso da OpenAI
- ✅ Implemente rate limiting se necessário
- ✅ Monitore o uso da API

## 🐛 Troubleshooting

### Erro: "Assistente ID não fornecido"

1. Verifique se `HEALTH_ASSISTANT_ID` está configurado no `.env.local`
2. Execute `pnpm run setup-assistant` para gerar um novo ID

### Erro: "Arquivo não encontrado"

1. Verifique se os arquivos PDF estão na pasta `public/documents`
2. Confirme os nomes dos arquivos no script de configuração

### Erro: "API Key inválida"

1. Verifique se `OPENAI_API_KEY` está configurada corretamente
2. Confirme se a chave tem permissões para a API de Assistentes

### Erro: "Run failed"

1. Verifique os logs do servidor para detalhes
2. Pode ser um problema temporário da API da OpenAI
3. Tente novamente em alguns minutos

## 📊 Monitoramento

### Logs Importantes

- Upload de arquivos: `Arquivo X enviado com ID: Y`
- Criação de assistente: `Assistente criado com ID: X`
- Criação de thread: `Thread criada com ID: X`
- Erros de execução: `Erro ao executar assistente: X`

### Métricas Úteis

- Número de threads criadas
- Tempo de resposta do assistente
- Taxa de erro das requisições
- Uso da API da OpenAI

## 🔄 Atualizações

### Atualizar Documentos

1. Substitua os arquivos PDF na pasta `public/documents`
2. Execute `pnpm run setup-assistant` novamente
3. O assistente será atualizado com os novos documentos

### Atualizar Instruções

1. Modifique `HEALTH_ASSISTANT_CONFIG` no script
2. Execute `pnpm run setup-assistant` novamente
3. Um novo assistente será criado com as instruções atualizadas

## 📚 Recursos Adicionais

- [Documentação da API de Assistentes](https://platform.openai.com/docs/assistants)
- [Guia de Upload de Arquivos](https://platform.openai.com/docs/assistants/tools/knowledge-retrieval)
- [Melhores Práticas](https://platform.openai.com/docs/assistants/overview)

---

**Nota**: Este assistente é para fins educativos e informativos. Sempre consulte um profissional de saúde para diagnóstico e tratamento médico.
