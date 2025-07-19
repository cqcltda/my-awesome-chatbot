import { HealthAssistant } from '@/components/health-assistant';

export default function HealthAssistantPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Assistente de Saúde e Bem-Estar
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Especializado em análise de sintomas, interpretação de exames laboratoriais 
            e informações sobre suplementos. Sempre consulte um profissional de saúde 
            para diagnóstico e tratamento.
          </p>
        </div>
        
        <HealthAssistant />
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Este assistente utiliza a API de Assistentes da OpenAI com base de conhecimento 
            especializada em saúde e bem-estar.
          </p>
        </div>
      </div>
    </div>
  );
} 