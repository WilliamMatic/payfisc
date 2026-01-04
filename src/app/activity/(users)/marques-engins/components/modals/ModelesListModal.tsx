import { X, Plus, Edit, Trash2, Eye, EyeOff, Loader2, List, Save } from 'lucide-react';
import { MarqueEngin as MarqueEnginType, ModeleEngin as ModeleEnginType } from '@/services/marques-engins/marqueEnginService';
import { useState } from 'react';

interface ModelesListModalProps {
  marque: MarqueEnginType;
  modeles: ModeleEnginType[];
  processing: boolean;
  onClose: () => void;
  onReloadModeles: () => Promise<void>;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

export default function ModelesListModal({
  marque,
  modeles,
  processing,
  onClose,
  onReloadModeles,
  onError,
  onSuccess
}: ModelesListModalProps) {
  const [loading, setLoading] = useState(false);
  const [editingModele, setEditingModele] = useState<ModeleEnginType | null>(null);
  const [editFormData, setEditFormData] = useState({ libelle: '', description: '' });

  const handleReload = async () => {
    setLoading(true);
    await onReloadModeles();
    setLoading(false);
  };

  const handleToggleStatus = async (modele: ModeleEnginType) => {
    setLoading(true);
    try {
      const { toggleModeleEnginStatus } = await import('@/services/marques-engins/marqueEnginService');
      const result = await toggleModeleEnginStatus(modele.id, !modele.actif);
      
      if (result.status === 'success') {
        onSuccess(result.message || 'Statut du modèle modifié avec succès');
        await onReloadModeles();
      } else {
        onError(result.message || 'Erreur lors du changement de statut du modèle');
      }
    } catch (err) {
      onError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (modele: ModeleEnginType) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le modèle "${modele.libelle}" ? Cette action est irréversible.`)) {
      return;
    }

    setLoading(true);
    try {
      const { deleteModeleEngin } = await import('@/services/marques-engins/marqueEnginService');
      const result = await deleteModeleEngin(modele.id);
      
      if (result.status === 'success') {
        onSuccess(result.message || 'Modèle supprimé avec succès');
        await onReloadModeles();
      } else {
        onError(result.message || 'Erreur lors de la suppression du modèle');
      }
    } catch (err) {
      onError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (modele: ModeleEnginType) => {
    setEditingModele(modele);
    setEditFormData({
      libelle: modele.libelle,
      description: modele.description || ''
    });
  };

  const cancelEdit = () => {
    setEditingModele(null);
    setEditFormData({ libelle: '', description: '' });
  };

  const handleSaveEdit = async () => {
    if (!editingModele || !editFormData.libelle.trim()) {
      onError('Le libellé du modèle est obligatoire');
      return;
    }

    setLoading(true);
    try {
      const { updateModeleEngin } = await import('@/services/marques-engins/marqueEnginService');
      const result = await updateModeleEngin(editingModele.id, {
        libelle: editFormData.libelle,
        description: editFormData.description,
        marque_engin_id: editingModele.marque_engin_id
      });
      
      if (result.status === 'success') {
        onSuccess(result.message || 'Modèle modifié avec succès');
        setEditingModele(null);
        setEditFormData({ libelle: '', description: '' });
        await onReloadModeles();
      } else {
        onError(result.message || 'Erreur lors de la modification du modèle');
      }
    } catch (err) {
      onError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* EN-TÊTE MODALE */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className="bg-purple-500 p-2 rounded-lg mr-3">
              <List className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Modèles de {marque.libelle}</h3>
              <p className="text-sm text-gray-500">
                {modeles.length} modèle(s) trouvé(s) - Type: {marque.type_engin_libelle}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReload}
              disabled={loading}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualiser"
            >
              <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* CORPS DE LA MODALE */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {modeles.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <List className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucun modèle trouvé</p>
              <p className="text-gray-400 text-sm mt-1">
                Cette marque ne possède pas encore de modèles
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {modeles.map((modele) => (
                <div
                  key={modele.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {editingModele?.id === modele.id ? (
                    // MODE ÉDITION
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Libellé *
                        </label>
                        <input
                          type="text"
                          value={editFormData.libelle}
                          onChange={(e) => setEditFormData({...editFormData, libelle: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                          placeholder="Libellé du modèle"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 resize-none"
                          placeholder="Description du modèle"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={loading || !editFormData.libelle.trim()}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm"
                        >
                          <Save className="w-4 h-4" />
                          <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={loading}
                          className="px-3 py-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    // MODE AFFICHAGE
                    <>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-800 text-sm">
                            {modele.libelle}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            modele.actif 
                              ? 'bg-green-50 text-green-700 border border-green-100' 
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {modele.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        {modele.description && (
                          <p className="text-gray-600 text-sm mt-1">
                            {modele.description}
                          </p>
                        )}
                        <p className="text-gray-400 text-xs mt-1">
                          Créé le {modele.date_creation}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        -
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* PIED DE PAGE */}
        <div className="flex items-center justify-between p-5 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Total: {modeles.length} modèle(s)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}