import { getAgents, Agent as AgentType } from '@/services/agents/agentService';
import AgentsClient from './components/AgentsClient';

export default async function AgentsPage() {
  try {
    const result = await getAgents();

    // Vérification et nettoyage des données
    const agents: AgentType[] =
      result.status === 'success'
        ? (result.data || []).filter(
            (agent: AgentType | null | undefined): agent is AgentType =>
              agent !== null && agent !== undefined
          )
        : [];

    // Toujours forcer string | null
    const error: string | null =
      result.status === 'error' ? result.message ?? 'Erreur inconnue' : null;

    return (
      <AgentsClient 
        initialAgents={agents}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading agents:', error);
    return (
      <AgentsClient 
        initialAgents={[]}
        initialError="Erreur lors du chargement des agents"
      />
    );
  }
}