// src/app/system/(admin)/taux/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { 
  Percent, Search, Plus, Edit, Trash2, Eye, EyeOff, 
  AlertTriangle, Save, X, Loader2, CheckCircle
} from 'lucide-react';
import Portal from '../components/Portal';
import {
  Taux as TauxType,
  getTaux,
  addTaux,
  updateTaux,
  deleteTaux,
  activateTaux,
  deactivateTaux
} from '../../../services/taux/tauxService';

export default function TauxPage() {
  const [tauxList, setTauxList] = useState<TauxType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTaux, setSelectedTaux] = useState<TauxType | null>(null);
  const [formData, setFormData] = useState({ 
    nom: '', 
    valeur: '', 
    description: '' 
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Chargement initial des taux
  useEffect(() => {
    loadTaux();
  }, []);

  const loadTaux = async () => {
    try {
      setLoading(true);
      const result = await getTaux();
      
      if (result.status === 'success') {
        setTauxList(result.data);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des taux');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors du chargement des taux:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTaux = tauxList.filter(taux =>
    taux.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    taux.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    taux.valeur.toString().includes(searchTerm)
  );

  const handleAddTaux = async () => {
    if (!formData.nom || !formData.valeur) {
      setError('Le nom et la valeur sont obligatoires');
      return;
    }

    const valeur = parseFloat(formData.valeur);
    if (isNaN(valeur) || valeur <= 0) {
      setError('La valeur doit être un nombre positif');
      return;
    }

    setProcessing(true);
    try {
      const result = await addTaux({
        nom: formData.nom,
        valeur: valeur,
        description: formData.description
      });
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Taux ajouté avec succès');
        setFormData({ nom: '', valeur: '', description: '' });
        setShowAddModal(false);
        loadTaux(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de l\'ajout du taux');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de l\'ajout du taux:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditTaux = async () => {
    if (!selectedTaux || !formData.nom || !formData.valeur) {
      setError('Le nom et la valeur sont obligatoires');
      return;
    }

    const valeur = parseFloat(formData.valeur);
    if (isNaN(valeur) || valeur <= 0) {
      setError('La valeur doit être un nombre positif');
      return;
    }

    setProcessing(true);
    try {
      const result = await updateTaux(selectedTaux.id, {
        nom: formData.nom,
        valeur: valeur,
        description: formData.description
      });
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Taux modifié avec succès');
        setShowEditModal(false);
        setSelectedTaux(null);
        setFormData({ nom: '', valeur: '', description: '' });
        loadTaux(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de la modification du taux');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de la modification du taux:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteTaux = async () => {
    if (!selectedTaux) return;

    setProcessing(true);
    try {
      const result = await deleteTaux(selectedTaux.id);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Taux supprimé avec succès');
        setShowDeleteModal(false);
        setSelectedTaux(null);
        loadTaux(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de la suppression du taux');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de la suppression du taux:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedTaux) return;

    setProcessing(true);
    try {
      let result;
      if (selectedTaux.actif) {
        result = await deactivateTaux(selectedTaux.id);
      } else {
        result = await activateTaux(selectedTaux.id);
      }
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Statut du taux modifié avec succès');
        setShowStatusModal(false);
        setSelectedTaux(null);
        loadTaux(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors du changement de statut du taux');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors du changement de statut du taux:', err);
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (taux: TauxType) => {
    setSelectedTaux(taux);
    setFormData({
      nom: taux.nom,
      valeur: taux.valeur.toString(),
      description: taux.description
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (taux: TauxType) => {
    setSelectedTaux(taux);
    setShowDeleteModal(true);
  };

  const openStatusModal = (taux: TauxType) => {
    setSelectedTaux(taux);
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
          <Percent className="w-6 h-6 mr-2 text-[#153258]" />
          Liste des Taux (CDF)
        </h2>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un taux..."
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

      {/* Tableau des taux */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valeur (CDF)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Création</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {filteredTaux.map((taux) => (
                  <tr key={taux.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{taux.nom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{taux.valeur.toLocaleString('fr-FR')} CDF</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 max-w-xs truncate">{taux.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        taux.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {taux.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {new Date(taux.date_creation).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openStatusModal(taux)}
                          className={`p-2 rounded-lg transition-colors ${
                            taux.actif ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={taux.actif ? 'Désactiver' : 'Activer'}
                        >
                          {taux.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(taux)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(taux)}
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

            {filteredTaux.length === 0 && (
              <div className="text-center py-12">
                <Percent className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun taux trouvé</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Ajouter Taux */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-[#153258]" />
                  Ajouter un Taux
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du Taux *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                    placeholder="Ex: Taux Standard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valeur en CDF *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valeur}
                    onChange={(e) => setFormData({...formData, valeur: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                    placeholder="Ex: 2000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent resize-none"
                    placeholder="Description du taux..."
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
                    onClick={handleAddTaux}
                    disabled={!formData.nom || !formData.valeur || processing}
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

      {/* Modal Modifier Taux */}
      {showEditModal && selectedTaux && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-[#153258]" />
                  Modifier le Taux
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTaux(null);
                    setFormData({ nom: '', valeur: '', description: '' });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du Taux *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valeur en CDF *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valeur}
                    onChange={(e) => setFormData({...formData, valeur: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent resize-none"
                  />
                </div>
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedTaux(null);
                      setFormData({ nom: '', valeur: '', description: '' });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleEditTaux}
                    disabled={!formData.nom || !formData.valeur || processing}
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

      {/* Modal Supprimer Taux */}
      {showDeleteModal && selectedTaux && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirmer la suppression</h3>
                <p className="text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir supprimer le taux <strong>{selectedTaux.nom}</strong> ? Cette action est irréversible.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedTaux(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteTaux}
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

      {/* Modal Changer Statut */}
      {showStatusModal && selectedTaux && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  selectedTaux.actif ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {selectedTaux.actif ? (
                    <EyeOff className="w-8 h-8 text-red-600" />
                  ) : (
                    <Eye className="w-8 h-8 text-green-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {selectedTaux.actif ? 'Désactiver' : 'Activer'} le taux
                </h3>
                <p className="text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir {selectedTaux.actif ? 'désactiver' : 'activer'} le taux <strong>{selectedTaux.nom}</strong> ?
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowStatusModal(false);
                      setSelectedTaux(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    disabled={processing}
                    className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedTaux.actif 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : selectedTaux.actif ? (
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