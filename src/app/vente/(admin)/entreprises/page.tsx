// src/app/system/(admin)/entreprises/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit, Trash2, Eye, EyeOff, 
  AlertTriangle, Save, X, Loader2, Building2
} from 'lucide-react';
import Portal from '../components/Portal';
import {
  Entreprise as EntrepriseType,
  getEntreprises,
  addEntreprise,
  updateEntreprise,
  deleteEntreprise,
  toggleEntrepriseStatus,
  searchEntreprises
} from '../../../services/entreprises/entrepriseService';

export default function EntreprisesPage() {
  const [entreprises, setEntreprises] = useState<EntrepriseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedEntreprise, setSelectedEntreprise] = useState<EntrepriseType | null>(null);
  const [formData, setFormData] = useState({
    raison_sociale: '',
    forme_juridique: '',
    nif: '',
    registre_commerce: '',
    date_creation: '',
    adresse_siege: '',
    telephone: '',
    email: '',
    representant_legal: ''
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formesJuridiques = ['SARL', 'SA', 'EI', 'SAS', 'Autre'];

  // Chargement initial des entreprises
  useEffect(() => {
    loadEntreprises();
  }, []);

  const loadEntreprises = async () => {
    try {
      setLoading(true);
      const result = await getEntreprises();
      
      if (result.status === 'success') {
        setEntreprises(result.data);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des entreprises');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors du chargement des entreprises:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadEntreprises();
      return;
    }

    try {
      setLoading(true);
      const result = await searchEntreprises(searchTerm);
      
      if (result.status === 'success') {
        setEntreprises(result.data);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors de la recherche des entreprises');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de la recherche des entreprises:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntreprise = async () => {
    if (!formData.raison_sociale || !formData.nif || !formData.registre_commerce) {
      setError('Les champs raison sociale, NIF et registre de commerce sont obligatoires');
      return;
    }

    setProcessing(true);
    try {
      const result = await addEntreprise(formData);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Entreprise ajoutée avec succès');
        setFormData({
          raison_sociale: '',
          forme_juridique: '',
          nif: '',
          registre_commerce: '',
          date_creation: '',
          adresse_siege: '',
          telephone: '',
          email: '',
          representant_legal: ''
        });
        setShowAddModal(false);
        loadEntreprises(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de l\'ajout de l\'entreprise');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de l\'ajout de l\'entreprise:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditEntreprise = async () => {
    if (!selectedEntreprise || !formData.raison_sociale || !formData.nif || !formData.registre_commerce) {
      setError('Les champs raison sociale, NIF et registre de commerce sont obligatoires');
      return;
    }

    setProcessing(true);
    try {
      const result = await updateEntreprise(selectedEntreprise.id, formData);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Entreprise modifiée avec succès');
        setShowEditModal(false);
        setSelectedEntreprise(null);
        setFormData({
          raison_sociale: '',
          forme_juridique: '',
          nif: '',
          registre_commerce: '',
          date_creation: '',
          adresse_siege: '',
          telephone: '',
          email: '',
          representant_legal: ''
        });
        loadEntreprises(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de la modification de l\'entreprise');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de la modification de l\'entreprise:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteEntreprise = async () => {
    if (!selectedEntreprise) return;

    setProcessing(true);
    try {
      const result = await deleteEntreprise(selectedEntreprise.id);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Entreprise supprimée avec succès');
        setShowDeleteModal(false);
        setSelectedEntreprise(null);
        loadEntreprises(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de la suppression de l\'entreprise');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de la suppression de l\'entreprise:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedEntreprise) return;

    setProcessing(true);
    try {
      const result = await toggleEntrepriseStatus(selectedEntreprise.id, !selectedEntreprise.actif);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Statut de l\'entreprise modifié avec succès');
        setShowStatusModal(false);
        setSelectedEntreprise(null);
        loadEntreprises(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors du changement de statut de l\'entreprise');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors du changement de statut de l\'entreprise:', err);
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (entreprise: EntrepriseType) => {
    setSelectedEntreprise(entreprise);
    setFormData({
      raison_sociale: entreprise.raison_sociale,
      forme_juridique: entreprise.forme_juridique,
      nif: entreprise.nif,
      registre_commerce: entreprise.registre_commerce,
      date_creation: entreprise.date_creation,
      adresse_siege: entreprise.adresse_siege,
      telephone: entreprise.telephone,
      email: entreprise.email,
      representant_legal: entreprise.representant_legal
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (entreprise: EntrepriseType) => {
    setSelectedEntreprise(entreprise);
    setShowDeleteModal(true);
  };

  const openStatusModal = (entreprise: EntrepriseType) => {
    setSelectedEntreprise(entreprise);
    setShowStatusModal(true);
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
          <Building2 className="w-6 h-6 mr-2 text-[#153258]" />
          Contribuables Entreprises
        </h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher une entreprise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raison Sociale</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forme Juridique</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIF</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Création</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {entreprises.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{e.raison_sociale}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{e.forme_juridique}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{e.nif}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{e.registre_commerce}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{e.telephone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        e.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {e.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{e.date_creation ? new Date(e.date_creation).toLocaleDateString('fr-FR') : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openStatusModal(e)}
                          className={`p-2 rounded-lg transition-colors ${e.actif ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={e.actif ? 'Désactiver' : 'Activer'}
                        >
                          {e.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(e)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(e)}
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

            {entreprises.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune entreprise trouvée</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-[#153258]" />
                  Ajouter une Entreprise
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Raison Sociale *</label>
                    <input 
                      type="text" 
                      value={formData.raison_sociale} 
                      onChange={(e) => setFormData({...formData, raison_sociale: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Forme Juridique</label>
                    <select 
                      value={formData.forme_juridique} 
                      onChange={(e) => setFormData({...formData, forme_juridique: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]"
                    >
                      <option value="">Sélectionner</option>
                      {formesJuridiques.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">NIF *</label>
                    <input 
                      type="text" 
                      value={formData.nif} 
                      onChange={(e) => setFormData({...formData, nif: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Registre de Commerce *</label>
                    <input 
                      type="text" 
                      value={formData.registre_commerce} 
                      onChange={(e) => setFormData({...formData, registre_commerce: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de création</label>
                    <input 
                      type="date" 
                      value={formData.date_creation} 
                      onChange={(e) => setFormData({...formData, date_creation: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse du siège</label>
                    <input 
                      type="text" 
                      value={formData.adresse_siege} 
                      onChange={(e) => setFormData({...formData, adresse_siege: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input 
                      type="text" 
                      value={formData.telephone} 
                      onChange={(e) => setFormData({...formData, telephone: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Représentant légal</label>
                    <input 
                      type="text" 
                      value={formData.representant_legal} 
                      onChange={(e) => setFormData({...formData, representant_legal: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddEntreprise}
                    disabled={!formData.raison_sociale || !formData.nif || !formData.registre_commerce || processing}
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
      {showEditModal && selectedEntreprise && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-[#153258]" />
                  Modifier l'Entreprise
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEntreprise(null);
                    setFormData({
                      raison_sociale: '',
                      forme_juridique: '',
                      nif: '',
                      registre_commerce: '',
                      date_creation: '',
                      adresse_siege: '',
                      telephone: '',
                      email: '',
                      representant_legal: ''
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Raison Sociale *</label>
                    <input 
                      type="text" 
                      value={formData.raison_sociale} 
                      onChange={(e) => setFormData({...formData, raison_sociale: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Forme Juridique</label>
                    <select 
                      value={formData.forme_juridique} 
                      onChange={(e) => setFormData({...formData, forme_juridique: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]"
                    >
                      <option value="">Sélectionner</option>
                      {formesJuridiques.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">NIF *</label>
                    <input 
                      type="text" 
                      value={formData.nif} 
                      onChange={(e) => setFormData({...formData, nif: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Registre de Commerce *</label>
                    <input 
                      type="text" 
                      value={formData.registre_commerce} 
                      onChange={(e) => setFormData({...formData, registre_commerce: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de création</label>
                    <input 
                      type="date" 
                      value={formData.date_creation} 
                      onChange={(e) => setFormData({...formData, date_creation: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse du siège</label>
                    <input 
                      type="text" 
                      value={formData.adresse_siege} 
                      onChange={(e) => setFormData({...formData, adresse_siege: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input 
                      type="text" 
                      value={formData.telephone} 
                      onChange={(e) => setFormData({...formData, telephone: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Représentant légal</label>
                    <input 
                      type="text" 
                      value={formData.representant_legal} 
                      onChange={(e) => setFormData({...formData, representant_legal: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedEntreprise(null);
                      setFormData({
                        raison_sociale: '',
                        forme_juridique: '',
                        nif: '',
                        registre_commerce: '',
                        date_creation: '',
                        adresse_siege: '',
                        telephone: '',
                        email: '',
                        representant_legal: ''
                      });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleEditEntreprise}
                    disabled={!formData.raison_sociale || !formData.nif || !formData.registre_commerce || processing}
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

      {/* Modal suppression */}
      {showDeleteModal && selectedEntreprise && (
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
                  Êtes-vous sûr de vouloir supprimer <strong>{selectedEntreprise.raison_sociale}</strong> ? Cette action est irréversible.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedEntreprise(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteEntreprise}
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

      {/* Modal statut */}
      {showStatusModal && selectedEntreprise && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${selectedEntreprise.actif ? 'bg-red-100' : 'bg-green-100'}`}>
                  {selectedEntreprise.actif ? <EyeOff className="w-8 h-8 text-red-600" /> : <Eye className="w-8 h-8 text-green-600" />}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {selectedEntreprise.actif ? 'Désactiver' : 'Activer'} l'entreprise
                </h3>
                <p className="text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir {selectedEntreprise.actif ? 'désactiver' : 'activer'} <strong>{selectedEntreprise.raison_sociale}</strong> ?
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowStatusModal(false);
                      setSelectedEntreprise(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    disabled={processing}
                    className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${selectedEntreprise.actif ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : selectedEntreprise.actif ? (
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
    </div>
  );
}