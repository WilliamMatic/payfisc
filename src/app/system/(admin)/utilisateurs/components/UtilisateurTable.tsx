import { useState } from 'react';
import { Users, Loader2, Edit, Trash2, Eye, EyeOff, Phone, MapPin, Shield, X, Car, FileCheck, ShieldCheck, Droplets } from 'lucide-react';
import { Utilisateur as UtilisateurType, Privileges } from '@/services/utilisateurs/utilisateurService';

interface UtilisateurTableProps {
  utilisateurs: UtilisateurType[];
  loading: boolean;
  onEdit: (utilisateur: UtilisateurType) => void;
  onDelete: (utilisateur: UtilisateurType) => void;
  onToggleStatus: (utilisateur: UtilisateurType) => void;
}

export default function UtilisateurTable({ 
  utilisateurs, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: UtilisateurTableProps) {
  const [privilegeModalUser, setPrivilegeModalUser] = useState<UtilisateurType | null>(null);

  const privilegeFullNames: Record<string, Record<string, string>> = {
    ventePlaque: {
      simple: 'Assujetti - Vente Directe', special: 'Grossiste - Vente en Gros', delivrance: 'Délivrance Carte Rose',
      correctionErreur: 'Correction & Reprocessing', plaque: 'Kit Complet Premium',
      reproduction: 'Reproduction', series: 'Séries', autresTaxes: 'Autres Taxes'
    },
    vignette: {
      venteDirecte: 'Vente de Vignette', delivrance: 'Délivrance Vignette', renouvellement: 'Renouvellement Vignette'
    },
    assurance: {
      venteDirecte: 'Souscription Assurance Moto', delivrance: 'Délivrance Assurance', renouvellement: 'Renouvellement Assurance'
    },
    assainissement: {
      agentTerrain: 'Agent Terrain', admin: 'Administrateur'
    }
  };

  const categoryMeta: Record<string, { label: string; icon: React.ReactNode; color: string; badgeColor: string }> = {
    ventePlaque: { label: 'Vente Plaque', icon: <Car className="w-4 h-4" />, color: 'text-blue-600', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
    vignette: { label: 'Vignette', icon: <FileCheck className="w-4 h-4" />, color: 'text-amber-600', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
    assurance: { label: 'Assurance', icon: <ShieldCheck className="w-4 h-4" />, color: 'text-emerald-600', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    assainissement: { label: 'Assainissement', icon: <Droplets className="w-4 h-4" />, color: 'text-cyan-600', badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  };

  const getPrivilegeCount = (privileges: Privileges) => {
    let count = 0;
    Object.values(privileges).forEach((cat) => {
      if (cat && typeof cat === 'object') {
        Object.values(cat as Record<string, unknown>).forEach((v) => { if (v === true || v === 'true') count++; });
      }
    });
    return count;
  };

  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#2D5B7A] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des utilisateurs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto h-full">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom Complet</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Adresse</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Site Affecté</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Privilèges</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Création</th>
              <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {utilisateurs.map((utilisateur) => (
              utilisateur && (
                <tr key={utilisateur.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-sm">{utilisateur.nom_complet || 'N/A'}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-700 text-sm">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-1 text-gray-400" />
                      {utilisateur.telephone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 text-sm max-w-xs truncate" title={utilisateur.adresse}>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {utilisateur.adresse || 'N/A'}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-700 text-sm">
                    {utilisateur.site_nom || 'N/A'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {(() => {
                      const count = getPrivilegeCount(utilisateur.privileges);
                      return count > 0 ? (
                        <button
                          onClick={() => setPrivilegeModalUser(utilisateur)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2D5B7A]/10 text-[#2D5B7A] rounded-lg hover:bg-[#2D5B7A]/20 transition-colors text-sm font-medium"
                          title="Voir les privilèges"
                        >
                          <Shield className="w-4 h-4" />
                          <span>{count}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Aucun</span>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      utilisateur.actif 
                        ? 'bg-green-50 text-green-700 border border-green-100' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {utilisateur.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {utilisateur.date_creation}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onToggleStatus(utilisateur)}
                        className={`p-2 rounded-lg transition-colors ${
                          utilisateur.actif 
                            ? 'text-gray-500 hover:bg-gray-100' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={utilisateur.actif ? 'Désactiver' : 'Activer'}
                      >
                        {utilisateur.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onEdit(utilisateur)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(utilisateur)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>

        {utilisateurs.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucun utilisateur trouvé</p>
            <p className="text-gray-400 text-sm mt-1">Les utilisateurs apparaîtront ici une fois ajoutés</p>
          </div>
        )}
      </div>

      {/* Modal Privilèges */}
      {privilegeModalUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4" onClick={() => setPrivilegeModalUser(null)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-in fade-in-90 zoom-in-90 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="bg-[#2D5B7A] p-2 rounded-lg mr-3">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Privilèges</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{privilegeModalUser.nom_complet}</p>
                </div>
              </div>
              <button
                onClick={() => setPrivilegeModalUser(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
              {Object.entries(privilegeModalUser.privileges).map(([category, perms]) => {
                const activePerms = Object.entries(perms as Record<string, boolean>).filter(([, v]) => v === true || v === ('true' as unknown));
                if (activePerms.length === 0) return null;
                const meta = categoryMeta[category];
                if (!meta) return null;
                return (
                  <div key={category} className="rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className={`flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 ${meta.color}`}>
                      {meta.icon}
                      <span className="text-sm font-semibold">{meta.label}</span>
                      <span className="ml-auto text-xs bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-500">{activePerms.length}</span>
                    </div>
                    <div className="p-3 space-y-1.5">
                      {activePerms.map(([key]) => (
                        <div key={key} className={`inline-flex items-center mr-2 mb-1 px-3 py-1.5 rounded-lg text-xs font-medium border ${meta.badgeColor}`}>
                          {privilegeFullNames[category]?.[key] || key}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setPrivilegeModalUser(null)}
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}