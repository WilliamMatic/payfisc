// components/ImpotsPage.tsx
'use client';
import { useState, useEffect } from 'react';
import { 
  FileText, Search, Plus, Edit, Trash2, Eye, EyeOff, 
  AlertTriangle, Save, X, CheckCircle, Loader2, Calendar, Clock
} from 'lucide-react';
import Portal from '../components/Portal';
import {
  Impot as ImpotType,
  getImpots,
  addImpot,
  updateImpot,
  deleteImpot,
  toggleImpotStatus,
  searchImpots
} from '../../../services/impots/impotService';

export default function ImpotsPage() {
  const [impots, setImpots] = useState<ImpotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedImpot, setSelectedImpot] = useState<ImpotType | null>(null);
  const [formData, setFormData] = useState({ 
    nom: '', 
    description: '',
    jsonData: ''
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Chargement initial des impôts
  useEffect(() => {
    loadImpots();
  }, []);

  const loadImpots = async () => {
    try {
      setLoading(true);
      const result = await getImpots();
      
      if (result.status === 'success') {
        setImpots(result.data);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des impôts');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors du chargement des impôts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadImpots();
      return;
    }

    try {
      setLoading(true);
      const result = await searchImpots(searchTerm);
      
      if (result.status === 'success') {
        setImpots(result.data);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors de la recherche');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de la recherche:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredImpots = impots.filter(impot =>
    impot.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    impot.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddImpot = async () => {
    if (!formData.nom || !formData.description || !formData.jsonData) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    setProcessing(true);
    try {
      const result = await addImpot(formData);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Impôt ajouté avec succès');
        setFormData({ nom: '', description: '', jsonData: '' });
        setShowAddModal(false);
        loadImpots(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de l\'ajout de l\'impôt');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de l\'ajout de l\'impôt:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditImpot = async () => {
    if (!selectedImpot || !formData.nom || !formData.description || !formData.jsonData) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    setProcessing(true);
    try {
      const result = await updateImpot(selectedImpot.id, formData);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Impôt modifié avec succès');
        setShowEditModal(false);
        setSelectedImpot(null);
        setFormData({ nom: '', description: '', jsonData: '' });
        loadImpots(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de la modification de l\'impôt');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de la modification de l\'impôt:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteImpot = async () => {
    if (!selectedImpot) return;

    setProcessing(true);
    try {
      const result = await deleteImpot(selectedImpot.id);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Impôt supprimé avec succès');
        setShowDeleteModal(false);
        setSelectedImpot(null);
        loadImpots(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de la suppression de l\'impôt');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de la suppression de l\'impôt:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedImpot) return;

    setProcessing(true);
    try {
      const result = await toggleImpotStatus(selectedImpot.id, !selectedImpot.actif);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Statut de l\'impôt modifié avec succès');
        setShowStatusModal(false);
        setSelectedImpot(null);
        loadImpots(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors du changement de statut de l\'impôt');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors du changement de statut de l\'impôt:', err);
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (impot: ImpotType) => {
    setSelectedImpot(impot);
    setFormData({
      nom: impot.nom,
      description: impot.description,
      jsonData: JSON.stringify({
        periode: impot.periode,
        delaiAccord: impot.delai_accord,
        penalites: impot.penalites
      })
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (impot: ImpotType) => {
    setSelectedImpot(impot);
    setShowDeleteModal(true);
  };

  const openStatusModal = (impot: ImpotType) => {
    setSelectedImpot(impot);
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
          <FileText className="w-6 h-6 mr-2 text-[#153258]" />
          Liste des Impôts
        </h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un impôt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent bg-gray-50 w-64"
            />
          </div>
          {/* <button
            onClick={handleSearch}
            className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            Rechercher
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Ajouter</span>
          </button> */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Délai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {filteredImpots.map((impot) => (
                  <tr key={impot.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {impot.nom}
                    </td>
                    <td className="px-6 py-4 text-gray-700 max-w-xs truncate">
                      {impot.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {impot.periode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                        {impot.delai_accord} jours
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        impot.actif 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {impot.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openStatusModal(impot)}
                          className={`p-2 rounded-lg transition-colors ${impot.actif ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={impot.actif ? 'Désactiver' : 'Activer'}
                        >
                          {impot.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(impot)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(impot)}
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

            {filteredImpots.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun impôt trouvé</p>
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
                  Ajouter un Impôt
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
                    placeholder="Ex: Impôt foncier"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                    placeholder="Description de l'impôt"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Données JSON *</label>
                  <textarea
                    value={formData.jsonData}
                    onChange={(e) => setFormData({...formData, jsonData: e.target.value})}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent font-mono text-sm"
                    placeholder='{"periode": "annuel", "delaiAccord": 30, "penalites": {"type": "pourcentage", "valeur": 5}}'
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
                    onClick={handleAddImpot}
                    disabled={!formData.nom || !formData.description || !formData.jsonData || processing}
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
      {showEditModal && selectedImpot && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-[#153258]" />
                  Modifier l'Impôt
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedImpot(null);
                    setFormData({ nom: '', description: '', jsonData: '' });
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
                    placeholder="Ex: Impôt foncier"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                    placeholder="Description de l'impôt"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Données JSON *</label>
                  <textarea
                    value={formData.jsonData}
                    onChange={(e) => setFormData({...formData, jsonData: e.target.value})}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent font-mono text-sm"
                    placeholder='{"periode": "annuel", "delaiAccord": 30, "penalites": {"type": "pourcentage", "valeur": 5}}'
                  />
                </div>
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedImpot(null);
                      setFormData({ nom: '', description: '', jsonData: '' });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleEditImpot}
                    disabled={!formData.nom || !formData.description || !formData.jsonData || processing}
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
      {showDeleteModal && selectedImpot && (
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
                  Êtes-vous sûr de vouloir supprimer l'impôt <strong>{selectedImpot.nom}</strong> ? 
                  Cette action est irréversible.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedImpot(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteImpot}
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
      {showStatusModal && selectedImpot && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  selectedImpot.actif ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {selectedImpot.actif ? (
                    <EyeOff className="w-8 h-8 text-red-600" />
                  ) : (
                    <Eye className="w-8 h-8 text-green-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {selectedImpot.actif ? 'Désactiver' : 'Activer'} l'impôt
                </h3>
                <p className="text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir {selectedImpot.actif ? 'désactiver' : 'activer'} l'impôt <strong>{selectedImpot.nom}</strong> ?
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowStatusModal(false);
                      setSelectedImpot(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    disabled={processing}
                    className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedImpot.actif 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : selectedImpot.actif ? (
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