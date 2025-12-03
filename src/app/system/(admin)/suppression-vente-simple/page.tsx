"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  User,
  Car,
  Calendar,
  DollarSign,
  Phone,
  Trash2,
  Eye,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  Bike,
  Shield,
} from "lucide-react";

// Données temporaires basées sur votre table HTML
const temporaryData = [
  {
    paiement_id: 129,
    engin_id: 92,
    particulier_id: 142443,
    montant: 32.0,
    serie_item_id: 607493,
    serie_id: 608,
    numero_plaque: "AA1",
    createur_engin: 20,
    site_id: 1,
    telephone: "0811552166",
    nom: "WILLY",
    prenom: "INSISILI",
    nb_engins_particulier: 12,
  },
  {
    paiement_id: 130,
    engin_id: 92,
    particulier_id: 142443,
    montant: 32.0,
    serie_item_id: 607493,
    serie_id: 608,
    numero_plaque: "AA1",
    createur_engin: 20,
    site_id: 1,
    telephone: "0811552166",
    nom: "WILLY",
    prenom: "INSISILI",
    nb_engins_particulier: 12,
  },
  {
    paiement_id: 131,
    engin_id: 92,
    particulier_id: 142443,
    montant: 32.0,
    serie_item_id: 607493,
    serie_id: 608,
    numero_plaque: "AA1",
    createur_engin: 20,
    site_id: 1,
    telephone: "0811552166",
    nom: "WILLY",
    prenom: "INSISILI",
    nb_engins_particulier: 12,
  },
  {
    paiement_id: 132,
    engin_id: 93,
    particulier_id: 142443,
    montant: 32.0,
    serie_item_id: 607495,
    serie_id: 608,
    numero_plaque: "AA3",
    createur_engin: 20,
    site_id: 1,
    telephone: "0811552166",
    nom: "WILLY",
    prenom: "INSISILI",
    nb_engins_particulier: 12,
  },
  {
    paiement_id: 133,
    engin_id: 93,
    particulier_id: 142443,
    montant: 32.0,
    serie_item_id: 607495,
    serie_id: 608,
    numero_plaque: "AA3",
    createur_engin: 20,
    site_id: 1,
    telephone: "0811552166",
    nom: "WILLY",
    prenom: "INSISILI",
    nb_engins_particulier: 12,
  },
  {
    paiement_id: 134,
    engin_id: 94,
    particulier_id: 142443,
    montant: 32.0,
    serie_item_id: 607497,
    serie_id: 608,
    numero_plaque: "AA5",
    createur_engin: 20,
    site_id: 1,
    telephone: "0811552166",
    nom: "WILLY",
    prenom: "INSISILI",
    nb_engins_particulier: 12,
  },
  {
    paiement_id: 142,
    engin_id: 92,
    particulier_id: 142443,
    montant: 32.0,
    serie_item_id: 607493,
    serie_id: 608,
    numero_plaque: "AA1",
    createur_engin: 20,
    site_id: 1,
    telephone: "0811552166",
    nom: "WILLY",
    prenom: "INSISILI",
    nb_engins_particulier: 12,
  }
];

// Types
interface VenteNonGrossiste {
  paiement_id: number;
  engin_id: number;
  particulier_id: number;
  montant: number;
  serie_item_id: number;
  serie_id: number;
  numero_plaque: string;
  createur_engin: number;
  site_id: number;
  telephone: string;
  nom: string;
  prenom: string;
  nb_engins_particulier: number;
}

interface Stats {
  total: number;
  montantTotal: number;
  clientsUniques: number;
}

// Modal de confirmation de suppression
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  vente: VenteNonGrossiste | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmationModal({
  isOpen,
  vente,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onCancel]);

  if (!isOpen || !vente) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
              Confirmer la suppression
            </h3>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-medium">
              Êtes-vous sûr de vouloir supprimer cette vente ?
            </p>
            <div className="mt-3 space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Client:</span> {vente.nom}{" "}
                {vente.prenom}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Plaque:</span>{" "}
                <span className="font-bold text-red-600">
                  {vente.numero_plaque}
                </span>
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Montant:</span> {vente.montant} $
              </p>
            </div>
            <p className="text-red-600 text-sm mt-3">
              Cette action est irréversible.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal de détail
interface DetailModalProps {
  isOpen: boolean;
  vente: VenteNonGrossiste | null;
  onClose: () => void;
}

function DetailModal({ isOpen, vente, onClose }: DetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !vente) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Détails de la vente
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Transaction #{vente.paiement_id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section Client */}
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
              <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informations du client
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Nom complet:</span>
                  <span className="text-gray-900 font-bold">
                    {vente.nom} {vente.prenom}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">ID Client:</span>
                  <span className="text-gray-900">{vente.particulier_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Téléphone:</span>
                  <span className="text-gray-900">
                    <a
                      href={`tel:${vente.telephone}`}
                      className="hover:text-blue-600"
                    >
                      {vente.telephone}
                    </a>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">
                    Nombre d'engins:
                  </span>
                  <span className="text-gray-900">
                    {vente.nb_engins_particulier}
                  </span>
                </div>
              </div>
            </div>

            {/* Section Véhicule */}
            <div className="bg-green-50 rounded-xl p-5 border border-green-200">
              <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                <Bike className="w-5 h-5 mr-2" />
                Informations du véhicule
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">
                    Numéro de plaque:
                  </span>
                  <span className="text-red-600 font-bold text-lg">
                    {vente.numero_plaque}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">ID Engin:</span>
                  <span className="text-gray-900">{vente.engin_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">ID Série:</span>
                  <span className="text-gray-900">{vente.serie_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">
                    ID Item Série:
                  </span>
                  <span className="text-gray-900">{vente.serie_item_id}</span>
                </div>
              </div>
            </div>

            {/* Section Transaction */}
            <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
              <h4 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Informations de transaction
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">Montant:</span>
                  <span
                    className={`text-lg font-bold ${
                      vente.montant > 0 ? "text-green-600" : "text-gray-600"
                    }`}
                  >
                    {vente.montant} $
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">
                    ID Paiement:
                  </span>
                  <span className="text-gray-900">{vente.paiement_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">Site ID:</span>
                  <span className="text-gray-900">{vente.site_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">
                    Créateur ID:
                  </span>
                  <span className="text-gray-900">{vente.createur_engin}</span>
                </div>
              </div>
            </div>

            {/* Section Métadonnées */}
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
              <h4 className="text-lg font-bold text-amber-800 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Métadonnées
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Statut:</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complétée
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Type:</span>
                  <span className="text-gray-900">Non-Grossiste</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Catégorie:</span>
                  <span className="text-gray-900">Particulier</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant principal
export default function VentesNonGrossistesScreen() {
  const [ventes, setVentes] = useState<VenteNonGrossiste[]>([]);
  const [filteredVentes, setFilteredVentes] = useState<VenteNonGrossiste[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVente, setSelectedVente] = useState<VenteNonGrossiste | null>(
    null
  );
  const [venteToDelete, setVenteToDelete] = useState<VenteNonGrossiste | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    montantTotal: 0,
    clientsUniques: 0,
  });

  // Charger les données initiales
  useEffect(() => {
    loadVentes();
  }, []);

  const loadVentes = useCallback(async () => {
    setIsLoading(true);
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Utiliser les données temporaires
    const data = temporaryData;
    
    setVentes(data);
    setFilteredVentes(data);
    
    // Calculer les statistiques
    const total = data.length;
    const montantTotal = data.reduce((sum, vente) => sum + vente.montant, 0);
    const clientsUniques = new Set(data.map(v => v.particulier_id)).size;
    
    setStats({ total, montantTotal, clientsUniques });
    setIsLoading(false);
  }, []);

  // Filtrer les ventes
  useEffect(() => {
    const filtered = ventes.filter((vente) => {
      const searchLower = searchTerm.toLowerCase();
      const nomComplet = `${vente.nom} ${vente.prenom}`.toLowerCase();
      
      return (
        nomComplet.includes(searchLower) ||
        vente.numero_plaque.toLowerCase().includes(searchLower) ||
        vente.telephone.includes(searchTerm)
      );
    });
    
    setFilteredVentes(filtered);
  }, [searchTerm, ventes]);

  // Gérer l'ouverture du détail
  const handleViewDetail = (vente: VenteNonGrossiste) => {
    setSelectedVente(vente);
    setShowDetailModal(true);
  };

  // Gérer la suppression
  const handleDeleteClick = (vente: VenteNonGrossiste, e: React.MouseEvent) => {
    e.stopPropagation();
    setVenteToDelete(vente);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (venteToDelete) {
      // Supprimer la vente localement
      setVentes(prev => prev.filter(v => v.paiement_id !== venteToDelete.paiement_id));
      
      // Mettre à jour les statistiques
      setStats(prev => ({
        total: prev.total - 1,
        montantTotal: prev.montantTotal - venteToDelete.montant,
        clientsUniques: new Set(
          ventes.filter(v => v.paiement_id !== venteToDelete.paiement_id)
            .map(v => v.particulier_id)
        ).size,
      }));
      
      setShowDeleteModal(false);
      setVenteToDelete(null);
    }
  };

  // Formatage du nom complet
  const getFullName = (vente: VenteNonGrossiste) => {
    return `${vente.nom} ${vente.prenom}`;
  };

  // Formatage du montant
  const formatMontant = (montant: number) => {
    return `${montant.toFixed(2).replace('.', ',')} $`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* En-tête */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Ventes Non-Grossistes
              </h1>
              <p className="text-gray-600 mt-2">
                Gestion des ventes aux particuliers
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Ces données sont chargées localement à des fins de démonstration
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadVentes}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span>{isLoading ? "Chargement..." : "Actualiser"}</span>
              </button>
            </div>
          </div>

          {/* Chargement */}
          {isLoading && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-700">Chargement des données...</span>
              </div>
            </div>
          )}

          {/* Barre de recherche */}
          <div className="mt-6">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, plaque, téléphone..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-500 mt-2">
                {filteredVentes.length} résultat{filteredVentes.length !== 1 ? 's' : ''} trouvé{filteredVentes.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Liste des ventes */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Numéro de plaque
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Téléphone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVentes.map((vente) => (
                  <tr
                    key={vente.paiement_id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetail(vente)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getFullName(vente)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Client #{vente.particulier_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-50 text-red-700 border border-red-200">
                        <Bike className="w-4 h-4 mr-2" />
                        {vente.numero_plaque}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-lg font-bold ${vente.montant > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {formatMontant(vente.montant)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {vente.paiement_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {vente.telephone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(vente);
                          }}
                          className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Détail
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(vente, e)}
                          className="inline-flex items-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Message si aucune vente */}
          {filteredVentes.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune vente trouvée
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm
                  ? "Aucune vente ne correspond à votre recherche. Essayez un autre terme."
                  : "Aucune vente non-grossiste n'a été enregistrée."}
              </p>
            </div>
          )}

          {/* Pied de table */}
          {filteredVentes.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Affichage de <span className="font-medium">1</span> à{" "}
                <span className="font-medium">{filteredVentes.length}</span> sur{" "}
                <span className="font-medium">{filteredVentes.length}</span>{" "}
                résultats
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de détail */}
      <DetailModal
        isOpen={showDetailModal}
        vente={selectedVente}
        onClose={() => setShowDetailModal(false)}
      />

      {/* Modal de confirmation de suppression */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        vente={venteToDelete}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setVenteToDelete(null);
        }}
      />
    </div>
  );
}