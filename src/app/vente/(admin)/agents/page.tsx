// components/AgentsPage.tsx
'use client';
import { useState, useEffect } from 'react';
import { 
  User, Search, Plus, Edit, Trash2, Eye, EyeOff, 
  AlertTriangle, Save, X, Shield, Check, CheckCircle, Loader2
} from 'lucide-react';
import Portal from '../components/Portal';
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
} from '../../../services/agents/agentService';

// Liste des privilèges disponibles par module (pour l'initialisation)
const defaultPrivileges: Privilege[] = [
  // Dashboard
  { id: 1, moduleName: "Dashboard", action: "Visualiser", description: "Accéder au tableau de bord", selected: false },
  
  // Particuliers
  { id: 2, moduleName: "Particuliers", action: "Visualiser", description: "Voir la liste des particuliers", selected: false },
  { id: 3, moduleName: "Particuliers", action: "Créer", description: "Ajouter un nouveau particulier", selected: false },
  { id: 4, moduleName: "Particuliers", action: "Modifier", description: "Modifier un particulier existant", selected: false },
  { id: 5, moduleName: "Particuliers", action: "Supprimer", description: "Supprimer un particulier", selected: false },
  { id: 6, moduleName: "Particuliers", action: "Rechercher", description: "Rechercher des particuliers", selected: false },
  
  // Entreprises
  { id: 7, moduleName: "Entreprises", action: "Visualiser", description: "Voir la liste des entreprises", selected: false },
  { id: 8, moduleName: "Entreprises", action: "Créer", description: "Ajouter une nouvelle entreprise", selected: false },
  { id: 9, moduleName: "Entreprises", action: "Modifier", description: "Modifier une entreprise existante", selected: false },
  { id: 10, moduleName: "Entreprises", action: "Supprimer", description: "Supprimer une entreprise", selected: false },
  { id: 11, moduleName: "Entreprises", action: "Rechercher", description: "Rechercher des entreprises", selected: false },
  
  // Provinces
  { id: 12, moduleName: "Provinces", action: "Visualiser", description: "Voir la liste des provinces", selected: false },
  { id: 13, moduleName: "Provinces", action: "Créer", description: "Ajouter une nouvelle province", selected: false },
  { id: 14, moduleName: "Provinces", action: "Modifier", description: "Modifier une province existante", selected: false },
  { id: 15, moduleName: "Provinces", action: "Supprimer", description: "Supprimer une province", selected: false },
  
  // Sites
  { id: 16, moduleName: "Sites", action: "Visualiser", description: "Voir la liste des sites", selected: false },
  { id: 17, moduleName: "Sites", action: "Créer", description: "Ajouter un nouveau site", selected: false },
  { id: 18, moduleName: "Sites", action: "Modifier", description: "Modifier un site existant", selected: false },
  { id: 19, moduleName: "Sites", action: "Supprimer", description: "Supprimer un site", selected: false },
  
  // Agents
  { id: 20, moduleName: "Agents", action: "Visualiser", description: "Voir la liste des agents", selected: false },
  { id: 21, moduleName: "Agents", action: "Créer", description: "Ajouter un nouvel agent", selected: false },
  { id: 22, moduleName: "Agents", action: "Modifier", description: "Modifier un agent existant", selected: false },
  { id: 23, moduleName: "Agents", action: "Supprimer", description: "Supprimer un agent", selected: false },
  { id: 24, moduleName: "Agents", action: "Gérer les privilèges", description: "Attribuer des droits d'accès", selected: false },
  
  // Taux
  { id: 25, moduleName: "Taux", action: "Visualiser", description: "Voir les taux appliqués", selected: false },
  { id: 26, moduleName: "Taux", action: "Créer", description: "Ajouter un nouveau taux", selected: false },
  { id: 27, moduleName: "Taux", action: "Modifier", description: "Modifier un taux existant", selected: false },
  { id: 28, moduleName: "Taux", action: "Supprimer", description: "Supprimer un taux", selected: false },
  { id: 29, moduleName: "Taux", action: "Rechercher", description: "Rechercher des taux", selected: false },
  
  // Impôts
  { id: 30, moduleName: "Impôts", action: "Visualiser", description: "Voir la liste des impôts", selected: false },
  { id: 31, moduleName: "Impôts", action: "Créer", description: "Ajouter un nouvel impôt", selected: false },
  { id: 32, moduleName: "Impôts", action: "Modifier", description: "Modifier un impôt existant", selected: false },
  { id: 33, moduleName: "Impôts", action: "Supprimer", description: "Supprimer un impôt", selected: false },
  { id: 34, moduleName: "Impôts", action: "Rechercher", description: "Rechercher des impôts", selected: false },
  
  // Rôles
  { id: 35, moduleName: "Rôles", action: "Visualiser", description: "Voir la liste des rôles", selected: false },
  { id: 36, moduleName: "Rôles", action: "Créer", description: "Créer un nouveau rôle", selected: false },
  { id: 37, moduleName: "Rôles", action: "Modifier", description: "Modifier un rôle existant", selected: false },
  { id: 38, moduleName: "Rôles", action: "Supprimer", description: "Supprimer un rôle", selected: false },
  { id: 39, moduleName: "Rôles", action: "Gérer les permissions", description: "Attribuer des permissions aux rôles", selected: false },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPrivilegesModal, setShowPrivilegesModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [agentPrivileges, setAgentPrivileges] = useState<Privilege[]>([]);
  const [formData, setFormData] = useState({ 
    nom: '', 
    prenom: '', 
    email: ''
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Chargement initial des agents
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const result = await getAgents();
      
      if (result.status === 'success') {
        setAgents(result.data);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des agents');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors du chargement des agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddAgent = async () => {
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
        loadAgents(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de l\'ajout de l\'agent');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de l\'ajout de l\'agent:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditAgent = async () => {
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
        loadAgents(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de la modification de l\'agent');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de la modification de l\'agent:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return;

    setProcessing(true);
    try {
      const result = await deleteAgent(selectedAgent.id);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Agent supprimé avec succès');
        setShowDeleteModal(false);
        setSelectedAgent(null);
        loadAgents(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de la suppression de l\'agent');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de la suppression de l\'agent:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedAgent) return;

    setProcessing(true);
    try {
      const result = await toggleAgentStatus(selectedAgent.id, !selectedAgent.actif);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Statut de l\'agent modifié avec succès');
        setShowStatusModal(false);
        setSelectedAgent(null);
        loadAgents(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors du changement de statut de l\'agent');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors du changement de statut de l\'agent:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handlePrivilegeToggle = (id: number) => {
    setAgentPrivileges(prev => 
      prev.map(privilege => 
        privilege.id === id 
          ? { ...privilege, selected: !privilege.selected } 
          : privilege
      )
    );
  };

  const handleSavePrivileges = async () => {
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
      console.error('Erreur lors de la sauvegarde des privilèges:', err);
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (agent: AgentType) => {
    setSelectedAgent(agent);
    setFormData({
      nom: agent.nom,
      prenom: agent.prenom,
      email: agent.email
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
      console.error('Erreur lors du chargement des privilèges:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Grouper les privilèges par module
  const groupedPrivileges = agentPrivileges.reduce((groups, privilege) => {
    const module = privilege.moduleName;
    if (!groups[module]) {
      groups[module] = [];
    }
    groups[module].push(privilege);
    return groups;
  }, {} as Record<string, Privilege[]>);

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
      {/* Messages d'alerte */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <User className="w-6 h-6 mr-2 text-[#153258]" />
          Liste des Agents
        </h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent bg-gray-50 w-64"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Ajouter</span>
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto h-full">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Création</th> */}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {agent.prenom} {agent.nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{agent.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        agent.actif 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {agent.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {new Date(agent.date_creation).toLocaleDateString('fr-FR')}
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openPrivilegesModal(agent)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Gérer les privilèges"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openStatusModal(agent)}
                          className={`p-2 rounded-lg transition-colors ${agent.actif ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={agent.actif ? 'Désactiver' : 'Activer'}
                        >
                          {agent.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(agent)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(agent)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAgents.length === 0 && (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun agent trouvé</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-[#153258]" />
                  Ajouter un Agent
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                    placeholder="Ex: Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                    placeholder="Ex: John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                    placeholder="Ex: john.doe@example.com"
                  />
                </div>
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddAgent}
                    disabled={!formData.nom || !formData.prenom || !formData.email || processing}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal de modification */}
      {showEditModal && selectedAgent && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-[#153258]" />
                  Modifier l'Agent
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAgent(null);
                    setFormData({ nom: '', prenom: '', email: '' });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                    placeholder="Ex: Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                    placeholder="Ex: John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                    placeholder="Ex: john.doe@example.com"
                  />
                </div>
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedAgent(null);
                      setFormData({ nom: '', prenom: '', email: '' });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleEditAgent}
                    disabled={!formData.nom || !formData.prenom || !formData.email || processing}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Modifier</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal de suppression */}
      {showDeleteModal && selectedAgent && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Confirmer la suppression
                </h3>
                <p className="text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir supprimer l'agent <strong>{selectedAgent.prenom} {selectedAgent.nom}</strong> ? 
                  Cette action est irréversible.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedAgent(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteAgent}
                    disabled={processing}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal de changement de statut */}
      {showStatusModal && selectedAgent && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  selectedAgent.actif ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {selectedAgent.actif ? (
                    <EyeOff className="w-8 h-8 text-red-600" />
                  ) : (
                    <Eye className="w-8 h-8 text-green-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {selectedAgent.actif ? 'Désactiver' : 'Activer'} l'agent
                </h3>
                <p className="text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir {selectedAgent.actif ? 'désactiver' : 'activer'} l'agent <strong>{selectedAgent.prenom} {selectedAgent.nom}</strong> ?
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowStatusModal(false);
                      setSelectedAgent(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    disabled={processing}
                    className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedAgent.actif 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : selectedAgent.actif ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>Désactiver</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Activer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal de gestion des privilèges */}
      {showPrivilegesModal && selectedAgent && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-[#153258]" />
                  Gestion des Privilèges - {selectedAgent.prenom} {selectedAgent.nom}
                </h3>
                <button
                  onClick={() => {
                    setShowPrivilegesModal(false);
                    setSelectedAgent(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  {Object.entries(groupedPrivileges).map(([module, modulePrivileges]) => (
                    <div key={module} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="font-medium text-gray-800">{module}</h4>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {modulePrivileges.map(privilege => (
                          <div key={privilege.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                            <div>
                              <div className="font-medium text-gray-800">{privilege.action}</div>
                              <div className="text-sm text-gray-600">{privilege.description}</div>
                            </div>
                            <button
                              onClick={() => handlePrivilegeToggle(privilege.id)}
                              className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                                privilege.selected 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              {privilege.selected ? <Check className="w-5 h-5" /> : <Plus className="w-4 h-4" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowPrivilegesModal(false);
                    setSelectedAgent(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSavePrivileges}
                  disabled={processing}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Sauvegarder</span>
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}