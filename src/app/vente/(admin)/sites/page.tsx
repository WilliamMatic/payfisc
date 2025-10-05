'use client';
import { useState, useEffect } from 'react';
import { 
  MapPin, Search, Plus, Edit, Trash2, Eye, EyeOff, 
  AlertTriangle, Save, X, Loader2
} from 'lucide-react';
import Portal from '../components/Portal';
import {
  Site as SiteType,
  Province as ProvinceType,
  getSites,
  getProvinces,
  addSite,
  updateSite,
  deleteSite,
  toggleSiteStatus
} from '../../../services/sites/siteService';

export default function SitesPage() {
  const [sites, setSites] = useState<SiteType[]>([]);
  const [provinces, setProvinces] = useState<ProvinceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteType | null>(null);
  const [formData, setFormData] = useState({ 
    nom: '', 
    code: '', 
    description: '', 
    province_id: 0 
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Chargement initial des sites et provinces
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les sites
      const sitesResult = await getSites();
      if (sitesResult.status === 'success') {
        setSites(sitesResult.data);
      } else {
        setError(sitesResult.message || 'Erreur lors du chargement des sites');
      }

      // Charger les provinces
      const provincesResult = await getProvinces();
      if (provincesResult.status === 'success') {
        setProvinces(provincesResult.data);
      } else {
        setError(provincesResult.message || 'Erreur lors du chargement des provinces');
      }
      
      setError(null);
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors du chargement des données:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage local des sites comme dans le screen 2
  const filteredSites = sites.filter(site =>
    site.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.province_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSite = async () => {
    if (!formData.nom || !formData.code || !formData.province_id) {
      setError('Le nom, le code et la province sont obligatoires');
      return;
    }

    setProcessing(true);
    try {
      const result = await addSite(formData);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Site ajouté avec succès');
        setFormData({ nom: '', code: '', description: '', province_id: 0 });
        setShowAddModal(false);
        loadData(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de l\'ajout du site');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de l\'ajout du site:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditSite = async () => {
    if (!selectedSite || !formData.nom || !formData.code || !formData.province_id) {
      setError('Le nom, le code et la province sont obligatoires');
      return;
    }

    setProcessing(true);
    try {
      const result = await updateSite(selectedSite.id, formData);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Site modifié avec succès');
        setShowEditModal(false);
        setSelectedSite(null);
        setFormData({ nom: '', code: '', description: '', province_id: 0 });
        loadData(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de la modification du site');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de la modification du site:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!selectedSite) return;

    setProcessing(true);
    try {
      const result = await deleteSite(selectedSite.id);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Site supprimé avec succès');
        setShowDeleteModal(false);
        setSelectedSite(null);
        loadData(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de la suppression du site');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors de la suppression du site:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedSite) return;

    setProcessing(true);
    try {
      const result = await toggleSiteStatus(selectedSite.id, !selectedSite.actif);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Statut du site modifié avec succès');
        setShowStatusModal(false);
        setSelectedSite(null);
        loadData(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors du changement de statut du site');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors du changement de statut du site:', err);
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (site: SiteType) => {
    setSelectedSite(site);
    setFormData({
      nom: site.nom,
      code: site.code,
      description: site.description,
      province_id: site.province_id
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (site: SiteType) => {
    setSelectedSite(site);
    setShowDeleteModal(true);
  };

  const openStatusModal = (site: SiteType) => {
    setSelectedSite(site);
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
          <MapPin className="w-6 h-6 mr-2 text-[#153258]" />
          Liste des Sites
        </h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un site..."
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Province</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Création</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {filteredSites.map((site) => (
                  <tr key={site.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{site.nom}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {site.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{site.province_nom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 max-w-xs truncate">{site.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        site.actif 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {site.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {new Date(site.date_creation).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openStatusModal(site)}
                          className={`p-2 rounded-lg transition-colors ${site.actif ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={site.actif ? 'Désactiver' : 'Activer'}
                        >
                          {site.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(site)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(site)}
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

            {filteredSites.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun site trouvé</p>
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
                  Ajouter un Site
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du Site *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                    placeholder="Ex: Site A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code Site *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                    placeholder="Ex: SA"
                    maxLength={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Province *</label>
                  <select
                    value={formData.province_id}
                    onChange={(e) => setFormData({...formData, province_id: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                  >
                    <option value={0}>Sélectionner une province</option>
                    {provinces.map(p => (
                      <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent resize-none"
                    placeholder="Description du site..."
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
                    onClick={handleAddSite}
                    disabled={!formData.nom || !formData.code || !formData.province_id || processing}
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
      {showEditModal && selectedSite && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-[#153258]" />
                  Modifier le Site
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedSite(null);
                    setFormData({ nom: '', code: '', description: '', province_id: 0 });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du Site *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                    placeholder="Ex: Site A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code Site *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                    placeholder="Ex: SA"
                    maxLength={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Province *</label>
                  <select
                    value={formData.province_id}
                    onChange={(e) => setFormData({...formData, province_id: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                  >
                    <option value={0}>Sélectionner une province</option>
                    {provinces.map(p => (
                      <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent resize-none"
                    placeholder="Description du site..."
                  />
                </div>
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedSite(null);
                      setFormData({ nom: '', code: '', description: '', province_id: 0 });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleEditSite}
                    disabled={!formData.nom || !formData.code || !formData.province_id || processing}
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
      {showDeleteModal && selectedSite && (
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
                  Êtes-vous sûr de vouloir supprimer le site <strong>{selectedSite.nom}</strong> ? 
                  Cette action est irréversible.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedSite(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteSite}
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
      {showStatusModal && selectedSite && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  selectedSite.actif ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {selectedSite.actif ? (
                    <EyeOff className="w-8 h-8 text-red-600" />
                  ) : (
                    <Eye className="w-8 h-8 text-green-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {selectedSite.actif ? 'Désactiver' : 'Activer'} le site
                </h3>
                <p className="text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir {selectedSite.actif ? 'désactiver' : 'activer'} le site <strong>{selectedSite.nom}</strong> ?
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowStatusModal(false);
                      setSelectedSite(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    disabled={processing}
                    className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedSite.actif 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : selectedSite.actif ? (
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