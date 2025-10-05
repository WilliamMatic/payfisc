// src/app/system/(admin)/particuliers/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit, Trash2, Eye, EyeOff, 
  AlertTriangle, Save, X, Loader2, User
} from 'lucide-react';
import Portal from '../components/Portal';
import {
  Particulier as ParticulierType,
  getParticuliers,
  addParticulier,
  updateParticulier,
  deleteParticulier,
  toggleParticulierStatus,
  searchParticuliers
} from '../../../services/particuliers/particulierService';

export default function ParticuliersPage() {
  const [particuliers, setParticuliers] = useState<ParticulierType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedParticulier, setSelectedParticulier] = useState<ParticulierType | null>(null);
  const [formData, setFormData] = useState<Partial<ParticulierType>>({
    nom: '', prenom: '', date_naissance: '', lieu_naissance: '', sexe: '',
    rue: '', ville: '', code_postal: '', province: '',
    id_national: '', telephone: '', email: '',
    nif: '', situation_familiale: '', dependants: 0
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Exemple de listes
  const provinces = ["Kinshasa", "Bas-Congo", "Katanga", "Kasaï", "Orientale", "Équateur"];
  const situationsFamiliales = ["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf/Veuve"];

  // Chargement initial des particuliers
  useEffect(() => {
    loadParticuliers();
  }, []);

  const loadParticuliers = async () => {
    try {
      setLoading(true);
      const result = await getParticuliers();
      
      if (result.status === 'success') {
        setParticuliers(result.data);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des particuliers');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors du chargement des particuliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredParticuliers = particuliers.filter(p =>
    p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nif.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddParticulier = async () => {
    if (!formData.nom || !formData.prenom || !formData.date_naissance || !formData.nif) {
      setError('Les champs nom, prénom, date de naissance et NIF sont obligatoires');
      return;
    }

    setProcessing(true);
    try {
      const result = await addParticulier({
        nom: formData.nom!,
        prenom: formData.prenom!,
        date_naissance: formData.date_naissance!,
        lieu_naissance: formData.lieu_naissance,
        sexe: formData.sexe,
        rue: formData.rue,
        ville: formData.ville,
        code_postal: formData.code_postal,
        province: formData.province,
        id_national: formData.id_national,
        telephone: formData.telephone,
        email: formData.email,
        nif: formData.nif!,
        situation_familiale: formData.situation_familiale,
        dependants: formData.dependants || 0
      });
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Particulier ajouté avec succès');
        setFormData({
          nom: '', prenom: '', date_naissance: '', lieu_naissance: '', sexe: '',
          rue: '', ville: '', code_postal: '', province: '',
          id_national: '', telephone: '', email: '',
          nif: '', situation_familiale: '', dependants: 0
        });
        setShowAddModal(false);
        loadParticuliers(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de l\'ajout du particulier');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de l\'ajout du particulier:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditParticulier = async () => {
    if (!selectedParticulier || !formData.nom || !formData.prenom || !formData.date_naissance || !formData.nif) {
      setError('Les champs nom, prénom, date de naissance et NIF sont obligatoires');
      return;
    }

    setProcessing(true);
    try {
      const result = await updateParticulier(selectedParticulier.id, {
        nom: formData.nom!,
        prenom: formData.prenom!,
        date_naissance: formData.date_naissance!,
        lieu_naissance: formData.lieu_naissance,
        sexe: formData.sexe,
        rue: formData.rue,
        ville: formData.ville,
        code_postal: formData.code_postal,
        province: formData.province,
        id_national: formData.id_national,
        telephone: formData.telephone,
        email: formData.email,
        nif: formData.nif!,
        situation_familiale: formData.situation_familiale,
        dependants: formData.dependants || 0
      });
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Particulier modifié avec succès');
        setShowEditModal(false);
        setSelectedParticulier(null);
        setFormData({
          nom: '', prenom: '', date_naissance: '', lieu_naissance: '', sexe: '',
          rue: '', ville: '', code_postal: '', province: '',
          id_national: '', telephone: '', email: '',
          nif: '', situation_familiale: '', dependants: 0
        });
        loadParticuliers(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de la modification du particulier');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de la modification du particulier:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteParticulier = async () => {
    if (!selectedParticulier) return;

    setProcessing(true);
    try {
      const result = await deleteParticulier(selectedParticulier.id);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Particulier supprimé avec succès');
        setShowDeleteModal(false);
        setSelectedParticulier(null);
        loadParticuliers(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de la suppression du particulier');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de la suppression du particulier:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedParticulier) return;

    setProcessing(true);
    try {
      const result = await toggleParticulierStatus(selectedParticulier.id, !selectedParticulier.actif);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Statut du particulier modifié avec succès');
        setShowStatusModal(false);
        setSelectedParticulier(null);
        loadParticuliers(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors du changement de statut du particulier');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors du changement de statut du particulier:', err);
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (p: ParticulierType) => {
    setSelectedParticulier(p);
    setFormData({ 
      nom: p.nom || '', 
      prenom: p.prenom || '', 
      date_naissance: p.date_naissance || '', 
      lieu_naissance: p.lieu_naissance || '', 
      sexe: p.sexe || '',
      rue: p.rue || '', 
      ville: p.ville || '', 
      code_postal: p.code_postal || '', 
      province: p.province || '',
      id_national: p.id_national || '', 
      telephone: p.telephone || '', 
      email: p.email || '',
      nif: p.nif || '', 
      situation_familiale: p.situation_familiale || '', 
      dependants: p.dependants || 0
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (p: ParticulierType) => {
    setSelectedParticulier(p);
    setShowDeleteModal(true);
  };

  const openStatusModal = (p: ParticulierType) => {
    setSelectedParticulier(p);
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
          <User className="w-6 h-6 mr-2 text-[#153258]" />
          Contribuables Particuliers
        </h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un contribuable..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent bg-gray-50 w-64"
            />
          </div>
          <button
            onClick={() => {
              setFormData({
                nom: '', prenom: '', date_naissance: '', lieu_naissance: '', sexe: '',
                rue: '', ville: '', code_postal: '', province: '',
                id_national: '', telephone: '', email: '',
                nif: '', situation_familiale: '', dependants: 0
              });
              setShowAddModal(true);
            }}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prénom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIF</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Création</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {filteredParticuliers.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{p.nom}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{p.prenom}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{p.nif}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{p.telephone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {p.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{new Date(p.date_creation).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openStatusModal(p)}
                          className={`p-2 rounded-lg transition-colors ${p.actif ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={p.actif ? 'Désactiver' : 'Activer'}
                        >
                          {p.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(p)}
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

            {filteredParticuliers.length === 0 && (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun contribuable trouvé</p>
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
                  Ajouter un Contribuable
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      nom: '', prenom: '', date_naissance: '', lieu_naissance: '', sexe: '',
                      rue: '', ville: '', code_postal: '', province: '',
                      id_national: '', telephone: '', email: '',
                      nif: '', situation_familiale: '', dependants: 0
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Formulaire 2 champs par ligne */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                    <input type="text" value={formData.nom || ''} onChange={(e) => setFormData({...formData, nom: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                    <input type="text" value={formData.prenom || ''} onChange={(e) => setFormData({...formData, prenom: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance *</label>
                    <input type="date" value={formData.date_naissance || ''} onChange={(e) => setFormData({...formData, date_naissance: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lieu de naissance</label>
                    <input type="text" value={formData.lieu_naissance || ''} onChange={(e) => setFormData({...formData, lieu_naissance: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sexe</label>
                    <select value={formData.sexe || ''} onChange={(e) => setFormData({...formData, sexe: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]">
                      <option value="">Sélectionner</option>
                      <option value="Masculin">Masculin</option>
                      <option value="Féminin">Féminin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rue</label>
                    <input type="text" value={formData.rue || ''} onChange={(e) => setFormData({...formData, rue: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                    <input type="text" value={formData.ville || ''} onChange={(e) => setFormData({...formData, ville: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Code Postal</label>
                    <input type="text" value={formData.code_postal || ''} onChange={(e) => setFormData({...formData, code_postal: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Province / Région</label>
                    <select
                      value={formData.province || ''}
                      onChange={(e) => setFormData({...formData, province: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]"
                    >
                      <option value="">Sélectionner une province</option>
                      {provinces.map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID National</label>
                    <input type="text" value={formData.id_national || ''} onChange={(e) => setFormData({...formData, id_national: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input type="text" value={formData.telephone || ''} onChange={(e) => setFormData({...formData, telephone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">NIF *</label>
                    <input type="text" value={formData.nif || ''} onChange={(e) => setFormData({...formData, nif: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Situation familiale</label>
                    <select
                      value={formData.situation_familiale || ''}
                      onChange={(e) => setFormData({...formData, situation_familiale: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]"
                    >
                      <option value="">Sélectionner</option>
                      {situationsFamiliales.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dépendants</label>
                    <input type="number" value={formData.dependants || 0} onChange={(e) => setFormData({...formData, dependants: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({
                        nom: '', prenom: '', date_naissance: '', lieu_naissance: '', sexe: '',
                        rue: '', ville: '', code_postal: '', province: '',
                        id_national: '', telephone: '', email: '',
                        nif: '', situation_familiale: '', dependants: 0
                      });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddParticulier}
                    disabled={!formData.nom || !formData.prenom || !formData.nif || !formData.date_naissance || processing}
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
      {showEditModal && selectedParticulier && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-[#153258]" />
                  Modifier le Contribuable
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedParticulier(null);
                    setFormData({
                      nom: '', prenom: '', date_naissance: '', lieu_naissance: '', sexe: '',
                      rue: '', ville: '', code_postal: '', province: '',
                      id_national: '', telephone: '', email: '',
                      nif: '', situation_familiale: '', dependants: 0
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Formulaire 2 champs per ligne */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                    <input type="text" value={formData.nom || ''} onChange={(e) => setFormData({...formData, nom: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                    <input type="text" value={formData.prenom || ''} onChange={(e) => setFormData({...formData, prenom: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance *</label>
                    <input type="date" value={formData.date_naissance || ''} onChange={(e) => setFormData({...formData, date_naissance: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lieu de naissance</label>
                    <input type="text" value={formData.lieu_naissance || ''} onChange={(e) => setFormData({...formData, lieu_naissance: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sexe</label>
                    <select value={formData.sexe || ''} onChange={(e) => setFormData({...formData, sexe: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]">
                      <option value="">Sélectionner</option>
                      <option value="Masculin">Masculin</option>
                      <option value="Féminin">Féminin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rue</label>
                    <input type="text" value={formData.rue || ''} onChange={(e) => setFormData({...formData, rue: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                    <input type="text" value={formData.ville || ''} onChange={(e) => setFormData({...formData, ville: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Code Postal</label>
                    <input type="text" value={formData.code_postal || ''} onChange={(e) => setFormData({...formData, code_postal: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Province / Région</label>
                    <select
                      value={formData.province || ''}
                      onChange={(e) => setFormData({...formData, province: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]"
                    >
                      <option value="">Sélectionner une province</option>
                      {provinces.map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID National</label>
                    <input type="text" value={formData.id_national || ''} onChange={(e) => setFormData({...formData, id_national: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input type="text" value={formData.telephone || ''} onChange={(e) => setFormData({...formData, telephone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">NIF *</label>
                    <input type="text" value={formData.nif || ''} onChange={(e) => setFormData({...formData, nif: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Situation familiale</label>
                    <select
                      value={formData.situation_familiale || ''}
                      onChange={(e) => setFormData({...formData, situation_familiale: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]"
                    >
                      <option value="">Sélectionner</option>
                      {situationsFamiliales.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dépendants</label>
                    <input type="number" value={formData.dependants || 0} onChange={(e) => setFormData({...formData, dependants: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]" />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedParticulier(null);
                      setFormData({
                        nom: '', prenom: '', date_naissance: '', lieu_naissance: '', sexe: '',
                        rue: '', ville: '', code_postal: '', province: '',
                        id_national: '', telephone: '', email: '',
                        nif: '', situation_familiale: '', dependants: 0
                      });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleEditParticulier}
                    disabled={!formData.nom || !formData.prenom || !formData.nif || !formData.date_naissance || processing}
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
      {showDeleteModal && selectedParticulier && (
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
                  Êtes-vous sûr de vouloir supprimer <strong>{selectedParticulier.nom} {selectedParticulier.prenom}</strong> ? Cette action est irréversible.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedParticulier(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteParticulier}
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
      {showStatusModal && selectedParticulier && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${selectedParticulier.actif ? 'bg-red-100' : 'bg-green-100'}`}>
                  {selectedParticulier.actif ? <EyeOff className="w-8 h-8 text-red-600" /> : <Eye className="w-8 h-8 text-green-600" />}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {selectedParticulier.actif ? 'Désactiver' : 'Activer'} le contribuable
                </h3>
                <p className="text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir {selectedParticulier.actif ? 'désactiver' : 'activer'} <strong>{selectedParticulier.nom} {selectedParticulier.prenom}</strong> ?
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowStatusModal(false);
                      setSelectedParticulier(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    disabled={processing}
                    className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${selectedParticulier.actif ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : selectedParticulier.actif ? (
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