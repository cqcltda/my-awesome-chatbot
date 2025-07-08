# Configuração da OpenAI

Este documento explica como configurar o chatbot para usar os modelos da OpenAI em vez do xAI Grok.

## Passos Realizados

### 1. ✅ Instalação do Pacote

O pacote `@ai-sdk/openai` foi instalado com sucesso:

```bash
pnpm install @ai-sdk/openai
```

### 2. ✅ Modificação do Provedor

O arquivo `lib/ai/providers.ts` foi atualizado para usar a OpenAI:

- Substituída a importação de `xai` por `openai`
- Configurados os modelos:
  - **Chat principal**: `gpt-4o-mini`
  - **Chat com raciocínio**: `gpt-4o-mini` (com middleware de raciocínio)
  - **Títulos**: `gpt-3.5-turbo` (mais rápido e econômico)
  - **Artefatos**: `gpt-4o-mini`
  - **Imagens**: `dall-e-3`

## Configuração da Chave de API

### 3. 🔧 Criar Arquivo de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
# OpenAI Configuration
OPENAI_API_KEY=sua_chave_de_api_aqui

# Database Configuration (se necessário)
POSTGRES_URL=sua_url_postgres_aqui

# Authentication (se necessário)
AUTH_SECRET=seu_auth_secret_aqui
```

### 4. 🔑 Obter Chave da API da OpenAI

1. Acesse [OpenAI Platform](https://platform.openai.com/api-keys)
2. Faça login ou crie uma conta
3. Clique em "Create new secret key"
4. Copie a chave gerada
5. Cole no arquivo `.env.local` no lugar de `sua_chave_de_api_aqui`

## Modelos Configurados

- **GPT-4o-mini**: Para conversas principais e artefatos (versão mais rápida e econômica do GPT-4)
- **GPT-3.5 Turbo**: Para geração de títulos (mais rápido e econômico)
- **DALL-E 3**: Para geração de imagens

## Reiniciar o Servidor

Após configurar a chave de API, reinicie o servidor de desenvolvimento:

```bash
pnpm dev
```

## Verificação

Para verificar se tudo está funcionando:

1. Acesse `http://localhost:3000`
2. Inicie uma conversa
3. O chatbot deve responder usando os modelos da OpenAI

## Notas Importantes

- O arquivo `.env.local` não será commitado no git (está no .gitignore)
- Mantenha sua chave de API segura e não a compartilhe
- A OpenAI cobra por uso, verifique os preços em [OpenAI Pricing](https://openai.com/pricing)
- O GPT-4o-mini é mais rápido e econômico que o GPT-4-turbo, mantendo boa qualidade
