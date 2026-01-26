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
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BarChart3,
  Home,
  Users,
  FileText,
  XCircle,
  Filter as FilterIcon,
  CalendarDays,
  Building,
  Loader2,
} from "lucide-react";
import {
  getVentesNonGrossistes,
  getStatsVentes,
  supprimerVenteNonGrossiste,
  type VenteNonGrossiste,
  type Stats,
  type RechercheParams,
  type PaginationResponse,
  getSitesDisponibles,
  exporterVentesExcel,
} from "@/services/ventes/ventesService";

// Types
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  vente: VenteNonGrossiste | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface DetailModalProps {
  isOpen: boolean;
  vente: VenteNonGrossiste | null;
  onClose: () => void;
  getSiteName: (siteId: number) => string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
  sites: Site[];
}

interface MessageModalProps {
  isOpen: boolean;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  onClose: () => void;
}

interface FilterState {
  date_debut: string;
  date_fin: string;
  site_id: number;
  order_by: string;
  order_dir: "ASC" | "DESC";
}

interface Site {
  id: number;
  nom: string;
  code: string;
}

interface PaginationState {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Fonction utilitaire pour formater le montant
const formatMontant = (montant: number): string => {
  return `${montant.toFixed(2).replace(".", ",")} $`;
};

// Modal de message
function MessageModal({ isOpen, type, title, message, onClose }: MessageModalProps) {
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

  if (!isOpen) return null;

  const typeStyles = {
    success: {
      icon: CheckCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      buttonColor: "bg-green-600 hover:bg-green-700",
    },
    error: {
      icon: AlertCircle,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
      buttonColor: "bg-red-600 hover:bg-red-700",
    },
    info: {
      icon: AlertCircle,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
    },
    warning: {
      icon: AlertCircle,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-800",
      buttonColor: "bg-amber-600 hover:bg-amber-700",
    },
  };

  const { icon: Icon, iconColor, bgColor, borderColor, textColor, buttonColor } = typeStyles[type];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`p-2 ${bgColor} rounded-lg mr-3`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-6`}>
            <p className={textColor}>{message}</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${buttonColor}`}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal de confirmation de suppression
function DeleteConfirmationModal({
  isOpen,
  vente,
  onConfirm,
  onCancel,
  isLoading = false,
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
              disabled={isLoading}
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
                <span className="font-medium">Montant:</span> {formatMontant(parseFloat(vente.montant.toString()))}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Date:</span> {vente.date_paiement}
              </p>
            </div>
            <p className="text-red-600 text-sm mt-3">
              Cette action supprimera toutes les données associées à cette vente
              : paiement, engin, et entrée dans carte_reprint.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal de détail
function DetailModal({ isOpen, vente, onClose, getSiteName }: DetailModalProps) {
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
                  <span className="text-blue-700 font-medium">
                    Nom complet:
                  </span>
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
                  <span className="text-blue-700 font-medium">Email:</span>
                  <span className="text-gray-900">
                    {vente.email || "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Adresse:</span>
                  <span className="text-gray-900">
                    {vente.adresse || "Non renseignée"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">NIF:</span>
                  <span className="text-gray-900">
                    {vente.nif || "Non renseigné"}
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
                  <span className="text-green-700 font-medium">Type:</span>
                  <span className="text-gray-900">{vente.type_engin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">Marque:</span>
                  <span className="text-gray-900">{vente.marque}</span>
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
                      parseFloat(vente.montant.toString()) > 0
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {formatMontant(parseFloat(vente.montant.toString()))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">
                    Montant initial:
                  </span>
                  <span className="text-gray-900">
                    {vente.montant_initial ? formatMontant(parseFloat(vente.montant_initial.toString())) : formatMontant(parseFloat(vente.montant.toString()))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">
                    Date Paiement:
                  </span>
                  <span className="text-gray-900">{vente.date_paiement}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">Mode:</span>
                  <span className="text-gray-900">{vente.mode_paiement}</span>
                </div>
                {vente.operateur && (
                  <div className="flex justify-between">
                    <span className="text-purple-700 font-medium">
                      Opérateur:
                    </span>
                    <span className="text-gray-900">{vente.operateur}</span>
                  </div>
                )}
                {vente.numero_transaction && (
                  <div className="flex justify-between">
                    <span className="text-purple-700 font-medium">
                      Numéro transaction:
                    </span>
                    <span className="text-gray-900">
                      {vente.numero_transaction}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Section Site et Agent */}
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
              <h4 className="text-lg font-bold text-amber-800 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Site et Agent
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Site:</span>
                  <span className="text-gray-900">{getSiteName(vente.site_id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Agent:</span>
                  <span className="text-gray-900">{vente.utilisateur_nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Site ID:</span>
                  <span className="text-gray-900">{vente.site_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">
                    Créateur ID:
                  </span>
                  <span className="text-gray-900">{vente.createur_engin}</span>
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

// Modal de filtres
function FilterModal({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onApply,
  onReset,
  sites,
}: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (key: keyof FilterState, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(localFilters);
    onApply();
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      date_debut: "",
      date_fin: "",
      site_id: 0,
      order_by: "date_paiement",
      order_dir: "DESC",
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
    onReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <FilterIcon className="w-6 h-6 text-blue-600 mr-2" />
              Filtres de recherche
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Date début */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  value={localFilters.date_debut}
                  onChange={(e) => handleChange("date_debut", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Date fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={localFilters.date_fin}
                  onChange={(e) => handleChange("date_fin", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Site */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site
                </label>
                <select
                  value={localFilters.site_id}
                  onChange={(e) =>
                    handleChange("site_id", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="0">Tous les sites</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.nom} ({site.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tri */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trier par
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={localFilters.order_by}
                    onChange={(e) => handleChange("order_by", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="date_paiement">Date</option>
                    <option value="montant">Montant</option>
                    <option value="nom">Nom</option>
                    <option value="numero_plaque">Plaque</option>
                  </select>
                  <select
                    value={localFilters.order_dir}
                    onChange={(e) =>
                      handleChange(
                        "order_dir",
                        e.target.value as "ASC" | "DESC"
                      )
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="DESC">Décroissant</option>
                    <option value="ASC">Croissant</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Réinitialiser
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Appliquer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Composant principal
export default function VentesNonGrossistesScreen() {
  // États principaux
  const [ventes, setVentes] = useState<VenteNonGrossiste[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVente, setSelectedVente] = useState<VenteNonGrossiste | null>(
    null
  );
  const [venteToDelete, setVenteToDelete] = useState<VenteNonGrossiste | null>(
    null
  );

  // États UI
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModalProps, setMessageModalProps] = useState<{
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
  }>({
    type: "info",
    title: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sites, setSites] = useState<Site[]>([
    { id: 8, nom: "LIMETE", code: "LMT" },
  ]);
  const [error, setError] = useState<string | null>(null);

  // États filtres
  const [filters, setFilters] = useState<FilterState>({
    date_debut: "",
    date_fin: "",
    site_id: 0,
    order_by: "date_paiement",
    order_dir: "DESC",
  });

  // Fonction pour obtenir le nom du site
  const getSiteName = useCallback((siteId: number): string => {
    const site = sites.find(s => s.id === siteId);
    return site ? `${site.nom} (${site.code})` : `Site ${siteId}`;
  }, [sites]);

  // Fonction pour mapper les ventes avec les noms de site
  const ventesWithSiteNames = useMemo(() => {
    return ventes.map(vente => ({
      ...vente,
      site_nom: getSiteName(vente.site_id)
    }));
  }, [ventes, sites, getSiteName]);

  // Fonction pour afficher les messages
  const showMessage = (type: "success" | "error" | "info" | "warning", title: string, message: string) => {
    setMessageModalProps({ type, title, message });
    setShowMessageModal(true);
  };

  // Charger les sites
  useEffect(() => {
    const loadSites = async () => {
      try {
        const result = await getSitesDisponibles();
        
        if (result.status === "success" && result.data) {
          setSites(result.data);
        } else {
          setSites([{ id: 8, nom: "LIMETE", code: "LMT" }]);
        }
      } catch (error) {
        setSites([{ id: 8, nom: "LIMETE", code: "LMT" }]);
      }
    };

    loadSites();
  }, []);

  // Charger les ventes
  const loadVentes = async (page = 1, search = searchTerm) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params: RechercheParams = {
        page,
        limit: pagination.limit,
        search,
        ...filters,
      };

      const result = await getVentesNonGrossistes(params);

      if (result.status === "success" && result.data) {
        const ventesArray = Array.isArray(result.data.ventes) ? result.data.ventes : [];
        setVentes(ventesArray);

        const paginationData = result.data.pagination || {
          total: ventesArray.length,
          page: page,
          limit: pagination.limit,
          totalPages: Math.max(1, Math.ceil(ventesArray.length / pagination.limit)),
        };

        setPagination(paginationData);

        if (ventesArray.length === 0) {
          setError("Aucune vente trouvée avec les critères sélectionnés");
        }
      } else {
        const errorMessage = result.message || "Erreur inconnue lors du chargement";
        setError(errorMessage);
        setVentes([]);
        setPagination({
          total: 0,
          page: 1,
          limit: pagination.limit,
          totalPages: 1,
        });
      }
    } catch (error) {
      setError("Erreur réseau. Vérifiez votre connexion.");
      setVentes([]);
      setPagination({
        total: 0,
        page: 1,
        limit: pagination.limit,
        totalPages: 1,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const params: Omit<
        RechercheParams,
        "page" | "limit" | "order_by" | "order_dir"
      > = {
        search: searchTerm,
        date_debut: filters.date_debut,
        date_fin: filters.date_fin,
        site_id: filters.site_id,
      };

      const result = await getStatsVentes(params);

      if (result.status === "success" && result.data) {
        setStats(result.data);
      } else {
        setStats(null);
      }
    } catch (error) {
      setStats(null);
    }
  };

  // Chargement initial
  useEffect(() => {
    loadVentes();
    loadStats();
  }, []);

  // Recharger quand les filtres changent
  useEffect(() => {
    loadVentes(1);
    loadStats();
  }, [filters]);

  // Gérer la recherche
  const handleSearch = useCallback(() => {
    loadVentes(1, searchTerm);
    loadStats();
  }, [searchTerm]);

  // Gérer le changement de page
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadVentes(page);
    }
  };

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

  const confirmDelete = async () => {
    if (!venteToDelete) return;

    setIsDeleting(true);
    try {
      const result = await supprimerVenteNonGrossiste(
        venteToDelete.paiement_id,
        1,
        "Suppression via interface admin"
      );

      if (result.status === "success") {
        await Promise.all([loadVentes(pagination.page), loadStats()]);
        setShowDeleteModal(false);
        setVenteToDelete(null);
        showMessage("success", "Succès", "Vente supprimée avec succès");
      } else {
        showMessage("error", "Erreur", result.message || "Erreur lors de la suppression");
      }
    } catch (error) {
      showMessage("error", "Erreur", "Erreur réseau lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  // Gérer les filtres
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    loadVentes(1);
    loadStats();
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    const resetFilters: FilterState = {
      date_debut: "",
      date_fin: "",
      site_id: 0,
      order_by: "date_paiement",
      order_dir: "DESC",
    };
    setFilters(resetFilters);
    setSearchTerm("");
    loadVentes(1, "");
    loadStats();
    setError(null);
    showMessage("info", "Filtres réinitialisés", "Tous les filtres ont été réinitialisés");
  };

  // Gérer l'export Excel
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const params: RechercheParams = {
        search: searchTerm,
        date_debut: filters.date_debut,
        date_fin: filters.date_fin,
        site_id: filters.site_id,
      };

      const result = await exporterVentesExcel(params);

      if (result.status === "success" && result.data) {
        const link = document.createElement("a");
        link.href = `${process.env.NEXT_PUBLIC_API_URL || ""}/exports/${
          result.data.filename
        }`;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showMessage("success", "Export réussi", "Export Excel terminé avec succès");
      } else {
        showMessage("error", "Erreur", result.message || "Erreur lors de l'exportation");
      }
    } catch (error) {
      showMessage("error", "Erreur", "Erreur réseau lors de l'exportation");
    } finally {
      setIsExporting(false);
    }
  };

  // Formatage
  const getFullName = (vente: VenteNonGrossiste) => {
    return `${vente.nom} ${vente.prenom}`;
  };

  // Pagination UI
  const renderPagination = () => {
    if (pagination.totalPages <= 1 || pagination.total === 0) return null;

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Affichage de{" "}
          <span className="font-medium">
            {(pagination.page - 1) * pagination.limit + 1}
          </span>{" "}
          à{" "}
          <span className="font-medium">
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>{" "}
          sur <span className="font-medium">{pagination.total}</span> résultats
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={pagination.page === 1 || isLoading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || isLoading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-1">
            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isLoading}
                    className={`w-8 h-8 rounded-lg ${
                      pagination.page === pageNum
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
            )}
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || isLoading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={pagination.page === pagination.totalPages || isLoading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
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
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilterModal(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <FilterIcon className="w-4 h-4" />
                <span>Filtres</span>
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Effacer</span>
              </button>
              <button
                onClick={() => {
                  loadVentes(pagination.page);
                  loadStats();
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>{isLoading ? "Chargement..." : "Actualiser"}</span>
              </button>
            </div>
          </div>

          {/* Affichage des erreurs */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Statistiques */}
          {stats && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">
                      Total Ventes
                    </p>
                    <p className="text-2xl font-bold text-blue-800">
                      {stats.total}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">
                      Montant Total
                    </p>
                    <p className="text-2xl font-bold text-green-800">
                      {formatMontant(stats.montantTotal)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 font-medium">
                      Clients Uniques
                    </p>
                    <p className="text-2xl font-bold text-purple-800">
                      {stats.clientsUniques}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700 font-medium">
                      Montant Moyen
                    </p>
                    <p className="text-2xl font-bold text-amber-800">
                      {formatMontant(stats.montantMoyen)}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-amber-600" />
                </div>
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
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Rechercher par nom, plaque, téléphone..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Filtres actifs */}
            <div className="mt-3 flex flex-wrap gap-2">
              {(filters.date_debut ||
                filters.date_fin ||
                filters.site_id > 0) && (
                <>
                  {filters.date_debut && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      Début: {filters.date_debut}
                    </span>
                  )}
                  {filters.date_fin && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      Fin: {filters.date_fin}
                    </span>
                  )}
                  {filters.site_id > 0 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                      <Building className="w-3 h-3 mr-1" />
                      Site: {getSiteName(filters.site_id)}
                    </span>
                  )}
                </>
              )}
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">
                  <Search className="w-3 h-3 mr-1" />
                  Recherche: {searchTerm}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Liste des ventes */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {isLoading && ventes.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chargement des ventes...
              </h3>
              <p className="text-gray-500">
                Veuillez patienter pendant le chargement des données.
              </p>
            </div>
          ) : ventes.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
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
                        Site
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ventes.map((vente) => (
                      <tr
                        key={vente.paiement_id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleViewDetail(vente)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {vente.date_paiement}
                          </div>
                        </td>
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
                                ID: {vente.particulier_id}
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
                          <div
                            className={`text-lg font-bold ${
                              parseFloat(vente.montant.toString()) > 0
                                ? "text-green-600"
                                : "text-gray-600"
                            }`}
                          >
                            {formatMontant(
                              parseFloat(vente.montant.toString())
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vente.mode_paiement}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {vente.telephone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getSiteName(vente.site_id)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {vente.utilisateur_nom}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div
                            className="flex space-x-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleViewDetail(vente)}
                              className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Détail
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(vente, e)}
                              className="inline-flex items-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                              disabled={isDeleting}
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

              {/* Pagination */}
              {renderPagination()}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {error ? "Erreur de chargement" : "Aucune vente trouvée"}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {error || (
                  searchTerm ||
                  filters.date_debut ||
                  filters.date_fin ||
                  filters.site_id > 0
                    ? "Aucune vente ne correspond à votre recherche. Essayez d'autres critères."
                    : "Aucune vente non-grossiste n'a été enregistrée."
                )}
              </p>
              {error && (
                <button
                  onClick={() => {
                    setError(null);
                    loadVentes();
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Réessayer
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DetailModal
        isOpen={showDetailModal}
        vente={selectedVente}
        onClose={() => setShowDetailModal(false)}
        getSiteName={getSiteName}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        vente={venteToDelete}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setVenteToDelete(null);
        }}
        isLoading={isDeleting}
      />

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        sites={sites}
      />

      <MessageModal
        isOpen={showMessageModal}
        type={messageModalProps.type}
        title={messageModalProps.title}
        message={messageModalProps.message}
        onClose={() => setShowMessageModal(false)}
      />
    </div>
  );
}