import { AIAssistantChat } from '@/components/ai-assistant/ai-chat';

export const metadata = {
  title: 'Asistente AI - Casas Confortables',
  description: 'Tu asistente personal para el CRM de Casas Confortables',
};

export default function AssistantPage() {
  return (
    <div className="container mx-auto py-6">
      <AIAssistantChat />
    </div>
  );
}
