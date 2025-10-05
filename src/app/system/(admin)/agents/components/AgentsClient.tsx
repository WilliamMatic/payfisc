'use client';
import { useState, useEffect } from 'react';
import { 
  Agent as AgentType, 
  Privilege,
  getAgents,
  addAgent,
  updateAgent,
  deleteAgent,
  toggleAgentStatus,
  getAgentPrivileges,
  updateAgentPrivileges
} from '@/services/agents/agentService';
import AgentsHeader from './AgentsHeader';
import AgentsTable from './AgentsTable';
import AgentsModals from './AgentsModals';
import AlertMessage from './AlertMessage';

// Liste des privilèges disponibles par module
const defaultPrivileges: Privilege[] = [
  // Dashboard
  { id: 1, module: "Dashboard", action: "Visualiser", description: "Accéder au tableau de bord", selected: false },
  
  // Particuliers
  { id: 2, module: "Particuliers", action: "Visualiser", description: "Voir la liste des particuliers", selected: false },
  { id: 3, module: "Particuliers", action: "Créer", description: "Ajouter un nouveau particulier", selected: false },
  { id: 4, module: "Particuliers", action: "Modifier", description: "Modifier un particulier existant", selected: false },
  { id: 5, module: "Particuliers", action: "Supprimer", description: "Supprimer un particulier", selected: false },
  { id: 6, module: "Particuliers", action: "Rechercher", description: "Rechercher des particuliers", selected: false },
  
  // Entreprises
  { id: 7, module: "Entreprises", action: "Visualiser", description: "Voir la liste des entreprises", selected: false },
  { id: 8, module: "Entreprises", action: "Créer", description: "Ajouter une nouvelle entreprise", selected: false },
  { id: 9, module: "Entreprises", action: "Modifier", description: "Modifier une entreprise existante", selected: false },
  { id: 10, module: "Entreprises", action: "Supprimer", description: "Supprimer une entreprise", selected: false },
  { id: 11, module: "Entreprises", action: "Rechercher", description: "Rechercher des entreprises", selected: false },
  
  // Provinces
  { id: 12, module: "Provinces", action: "Visualiser", description: "Voir la liste des provinces", selected: false },
  { id: 13, module: "Provinces", action: "Créer", description: "Ajouter une nouvelle province", selected: false },
  { id: 14, module: "Provinces", action: "Modifier", description: "Modifier une province existante", selected: false },
  { id: 15, module: "Provinces", action: "Supprimer", description: "Supprimer une province", selected: false },
  
  // Sites
  { id: 16, module: "Sites", action: "Visualiser", description: "Voir la liste des sites", selected: false },
  { id: 17, module: "Sites", action: "Créer", description: "Ajouter un nouveau site", selected: false },
  { id: 18, module: "Sites", action: "Modifier", description: "Modifier un site existant", selected: false },
  { id: 19, module: "Sites", action: "Supprimer", description: "Supprimer un site", selected: false },
  
  // Agents
  { id: 20, module: "Agents", action: "Visualiser", description: "Voir la liste des agents", selected: false },
  { id: 21, module: "Agents", action: "Créer", description: "Ajouter un nouvel agent", selected: false },
  { id: 22, module: "Agents", action: "Modifier", description: "Modifier un agent existant", selected: false },
  { id: 23, module: "Agents", action: "Supprimer", description: "Supprimer un agent", selected: false },
  { id: 24, module: "Agents", action: "Gérer les privilèges", description: "Attribuer des droits d'accès", selected: false },
  
  // Taux
  { id: 25, module: "Taux", action: "Visualiser", description: "Voir les taux appliqués", selected: false },
  { id: 26, module: "Taux", action: "Créer", description: "Ajouter un nouveau taux", selected: false },
  { id: 27, module: "Taux", action: "Modifier", description: "Modifier un taux existant", selected: false },
  { id: 28, module: "Taux", action: "Supprimer", description: "Supprimer un taux", selected: false },
  { id: 29, module: "Taux", action: "Rechercher", description: "Rechercher des taux", selected: false },
  
  // Impôts
  { id: 30, module: "Impôts", action: "Visualiser", description: "Voir la liste des impôts", selected: false },
  { id: 31, module: "Impôts", action: "Créer", description: "Ajouter un nouvel impôt", selected: false },
  { id: 32, module: "Impôts", action: "Modifier", description: "Modifier un impôt existant", selected: false },
  { id: 33, module: "Impôts", action: "Supprimer", description: "Supprimer un impôt", selected: false },
  { id: 34, module: "Impôts", action: "Rechercher", description: "Rechercher des impôts", selected: false },
  
  // Rôles
  { id: 35, module: "Rôles", action: "Visualiser", description: "Voir la liste des rôles", selected: false },
  { id: 36, module: "Rôles", action: "Créer", description: "Créer un nouveau rôle", selected: false },
  { id: 37, module: "Rôles", action: "Modifier", description: "Modifier un rôle existant", selected: false },
  { id: 38, module: "Rôles", action: "Supprimer", description: "Supprimer un rôle", selected: false },
  { id: 39, module: "Rôles", action: "Gérer les permissions", description: "Attribuer des permissions aux rôles", selected: false },
];

interface AgentsClientProps {
  initialAgents: AgentType[];
  initialError: string | null;
}

export default function AgentsClient({ initialAgents, initialError }: AgentsClientProps) {
  const [agents, setAgents] = useState<AgentType[]>(initialAgents || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPrivilegesModal, setShowPrivilegesModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [agentPrivileges, setAgentPrivileges] = useState<Privilege[]>(defaultPrivileges);
  const [formData, setFormData] = useState({ 
    nom: '', 
    prenom: '', 
    email: ''
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fonction pour recharger les agents
  const loadAgents = async () => {
    try {
      setLoading(true);
      const result = await getAgents();
      
      if (result.status === 'success') {
        setAgents(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des agents');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage local des agents
  const filteredAgents = agents.filter(agent =>
    agent && (
      agent.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const openEditModal = (agent: AgentType) => {
    setSelectedAgent(agent);
    setFormData({
      nom: agent.nom || '',
      prenom: agent.prenom || '',
      email: agent.email || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (agent: AgentType) => {
    setSelectedAgent(agent);
    setShowDeleteModal(true);
  };

  const openStatusModal = (agent: AgentType) => {
    setSelectedAgent(agent);
    setShowStatusModal(true);
  };

  const openPrivilegesModal = async (agent: AgentType) => {
    setSelectedAgent(agent);
    setProcessing(true);
    
    try {
      const result = await getAgentPrivileges(agent.id);
      
      if (result.status === 'success') {
        setAgentPrivileges(result.data || defaultPrivileges);
        setShowPrivilegesModal(true);
      } else {
        setError(result.message || 'Erreur lors du chargement des privilèges');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setProcessing(false);
    }
  };

  // Effacer les messages après un délai
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="h-full flex flex-col">
      <AlertMessage error={error} successMessage={successMessage} />
      
      <AgentsHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setShowAddModal(true)}
      />

      <AgentsTable
        agents={filteredAgents}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
        onPrivileges={openPrivilegesModal}
      />

      <AgentsModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        showPrivilegesModal={showPrivilegesModal}
        selectedAgent={selectedAgent}
        formData={formData}
        agentPrivileges={agentPrivileges}
        processing={processing}
        onAddClose={() => setShowAddModal(false)}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedAgent(null);
          setFormData({ nom: '', prenom: '', email: '' });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedAgent(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedAgent(null);
        }}
        onPrivilegesClose={() => {
          setShowPrivilegesModal(false);
          setSelectedAgent(null);
        }}
        onFormDataChange={setFormData}
        onAgentPrivilegesChange={setAgentPrivileges}
        onAddAgent={async () => {
          if (!formData.nom || !formData.prenom || !formData.email) {
            setError('Tous les champs sont obligatoires');
            return;
          }

          setProcessing(true);
          try {
            const result = await addAgent(formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Agent ajouté avec succès');
              setFormData({ nom: '', prenom: '', email: '' });
              setShowAddModal(false);
              
              // Recharger la liste complète des agents
              await loadAgents();
            } else {
              setError(result.message || 'Erreur lors de l\'ajout de l\'agent');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onEditAgent={async () => {
          if (!selectedAgent || !formData.nom || !formData.prenom || !formData.email) {
            setError('Tous les champs sont obligatoires');
            return;
          }

          setProcessing(true);
          try {
            const result = await updateAgent(selectedAgent.id, formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Agent modifié avec succès');
              setShowEditModal(false);
              setSelectedAgent(null);
              setFormData({ nom: '', prenom: '', email: '' });
              
              // Recharger la liste complète des agents
              await loadAgents();
            } else {
              setError(result.message || 'Erreur lors de la modification de l\'agent');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onDeleteAgent={async () => {
          if (!selectedAgent) return;

          setProcessing(true);
          try {
            const result = await deleteAgent(selectedAgent.id);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Agent supprimé avec succès');
              setShowDeleteModal(false);
              setSelectedAgent(null);
              
              // Recharger la liste complète des agents
              await loadAgents();
            } else {
              setError(result.message || 'Erreur lors de la suppression de l\'agent');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!selectedAgent) return;

          setProcessing(true);
          try {
            const result = await toggleAgentStatus(selectedAgent.id, !selectedAgent.actif);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Statut de l\'agent modifié avec succès');
              setShowStatusModal(false);
              setSelectedAgent(null);
              
              // Recharger la liste complète des agents
              await loadAgents();
            } else {
              setError(result.message || 'Erreur lors du changement de statut de l\'agent');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onSavePrivileges={async () => {
          if (!selectedAgent) return;

          setProcessing(true);
          try {
            const result = await updateAgentPrivileges(selectedAgent.id, agentPrivileges);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Privilèges sauvegardés avec succès');
              setShowPrivilegesModal(false);
              setSelectedAgent(null);
            } else {
              setError(result.message || 'Erreur lors de la sauvegarde des privilèges');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
      />
    </div>
  );
}