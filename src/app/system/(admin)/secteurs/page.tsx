'use client';
import { useState } from 'react';
import { 
  MapPin, Search, Plus, Edit, Trash2, Eye, EyeOff, 
  AlertTriangle, Save, X 
} from 'lucide-react';
import Portal from '../components/Portal';

interface Province {
  id: number;
  nom: string;
  code: string;
  description: string;
  actif: boolean;
  dateCreation: string;
}

export default function ProvincesPage() {
  const [provinces, setProvinces] = useState<Province[]>([
    { id: 1, nom: "Kinshasa", code: "KIN", description: "Capitale de la RDC", actif: true, dateCreation: "2024-01-15" },
    { id: 2, nom: "Kongo Central", code: "KCE", description: "Province du Kongo Central", actif: true, dateCreation: "2024-01-20" },
    { id: 3, nom: "Kasaï", code: "KAS", description: "Province du Kasaï", actif: false, dateCreation: "2024-02-10" },
    { id: 4, nom: "Nord-Kivu", code: "NKV", description: "Province du Nord-Kivu", actif: true, dateCreation: "2024-02-15" },
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [formData, setFormData] = useState({ nom: '', code: '', description: '' });

  const filteredProvinces = provinces.filter(province =>
    province.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    province.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProvince = () => {
    if (formData.nom && formData.code) {
      const newProvince: Province = {
        id: Date.now(),
        nom: formData.nom,
        code: formData.code,
        description: formData.description,
        actif: true,
        dateCreation: new Date().toISOString().split('T')[0]
      };
      setProvinces([...provinces, newProvince]);
      setFormData({ nom: '', code: '', description: '' });
      setShowAddModal(false);
    }
  };

  const handleEditProvince = () => {
    if (selectedProvince && formData.nom && formData.code) {
      setProvinces(provinces.map(p => 
        p.id === selectedProvince.id 
          ? { ...p, nom: formData.nom, code: formData.code, description: formData.description }
          : p
      ));
      setShowEditModal(false);
      setSelectedProvince(null);
      setFormData({ nom: '', code: '', description: '' });
    }
  };

  const handleDeleteProvince = () => {
    if (selectedProvince) {
      setProvinces(provinces.filter(p => p.id !== selectedProvince.id));
      setShowDeleteModal(false);
      setSelectedProvince(null);
    }
  };

  const handleToggleStatus = () => {
    if (selectedProvince) {
      setProvinces(provinces.map(p => 
        p.id === selectedProvince.id 
          ? { ...p, actif: !p.actif }
          : p
      ));
      setShowStatusModal(false);
      setSelectedProvince(null);
    }
  };

  const openEditModal = (province: Province) => {
    setSelectedProvince(province);
    setFormData({
      nom: province.nom,
      code: province.code,
      description: province.description
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (province: Province) => {
    setSelectedProvince(province);
    setShowDeleteModal(true);
  };

  const openStatusModal = (province: Province) => {
    setSelectedProvince(province);
    setShowStatusModal(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header de la section */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <MapPin className="w-6 h-6 mr-2 text-[#153258]" />
          Liste des Provinces
        </h2>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher une province..."
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

      {/* Tableau des provinces */}
<div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <div className="overflow-x-auto h-full">
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Province</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Création</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {filteredProvinces.map((province) => (
          <tr key={province.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="font-medium text-gray-900">{province.nom}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {province.code}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-500 max-w-xs truncate">
              {province.description}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                province.actif 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {province.actif ? 'Actif' : 'Inactif'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
              {new Date(province.dateCreation).toLocaleDateString('fr-FR')}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => openStatusModal(province)}
                  className={`p-2 rounded-lg transition-colors ${
                    province.actif 
                      ? 'text-red-600 hover:bg-red-50' 
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                  title={province.actif ? 'Désactiver' : 'Activer'}
                >
                  {province.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEditModal(province)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openDeleteModal(province)}
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
    
    {filteredProvinces.length === 0 && (
      <div className="text-center py-12">
        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Aucune province trouvée</p>
      </div>
    )}
  </div>
</div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-[#153258]" />
                  Ajouter une Province
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de la Province *
                    </label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                      placeholder="Ex: Kinshasa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code Province *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                      placeholder="Ex: KIN"
                      maxLength={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent resize-none"
                      placeholder="Description de la province..."
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
                    onClick={handleAddProvince}
                    disabled={!formData.nom || !formData.code}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal de modification */}
      {showEditModal && selectedProvince && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-[#153258]" />
                  Modifier la Province
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProvince(null);
                    setFormData({ nom: '', code: '', description: '' });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de la Province *
                    </label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                      placeholder="Ex: Kinshasa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code Province *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                      placeholder="Ex: KIN"
                      maxLength={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent resize-none"
                      placeholder="Description de la province..."
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedProvince(null);
                      setFormData({ nom: '', code: '', description: '' });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleEditProvince}
                    disabled={!formData.nom || !formData.code}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal de suppression */}
      {showDeleteModal && selectedProvince && (
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
                  Êtes-vous sûr de vouloir supprimer la province <strong>{selectedProvince.nom}</strong> ? 
                  Cette action est irréversible.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedProvince(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteProvince}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal de changement de statut */}
      {showStatusModal && selectedProvince && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  selectedProvince.actif ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {selectedProvince.actif ? (
                    <EyeOff className="w-8 h-8 text-red-600" />
                  ) : (
                    <Eye className="w-8 h-8 text-green-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {selectedProvince.actif ? 'Désactiver' : 'Activer'} la province
                </h3>
                <p className="text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir {selectedProvince.actif ? 'désactiver' : 'activer'} la province <strong>{selectedProvince.nom}</strong> ?
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowStatusModal(false);
                      setSelectedProvince(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors ${
                      selectedProvince.actif 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {selectedProvince.actif ? (
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