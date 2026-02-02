// import { Suspense } from "react";
// import { FilterIcon, XCircle, RefreshCw } from "lucide-react";
// import CarteRoseAnnulationScreenClient from "./components/CarteRoseAnnulationScreenClient";
// import {
//   fetchCartesRoses,
//   fetchStats,
//   fetchSites,
//   fetchTypesVehicules
// } from "./actions/carteRoseActions";

// interface PageProps {
//   searchParams: {
//     page?: string;
//     search?: string;
//     date_debut?: string;
//     date_fin?: string;
//     site_id?: string;
//     type_engin?: string;
//     order_by?: string;
//     order_dir?: "ASC" | "DESC";
//   };
// }

// export default async function CarteRoseAnnulationPage({ searchParams }: PageProps) {
//   // Parse les paramètres de recherche
//   const page = parseInt(searchParams.page || "1");
//   const limit = 20;

//   const filters = {
//     date_debut: searchParams.date_debut || "",
//     date_fin: searchParams.date_fin || "",
//     site_id: parseInt(searchParams.site_id || "0"),
//     type_engin: searchParams.type_engin || "",
//     order_by: searchParams.order_by || "date_attribution",
//     order_dir: searchParams.order_dir || "DESC" as "ASC" | "DESC",
//   };

//   // Charger les données en parallèle
//   const [cartesRosesData, stats, sites, typesVehicules] = await Promise.all([
//     fetchCartesRoses({ page, limit, ...filters, search: searchParams.search }),
//     fetchStats({ ...filters, search: searchParams.search }),
//     fetchSites(),
//     fetchTypesVehicules(),
//   ]);

//   return (
//     <Suspense fallback={
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
//             <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
//               <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
//             </div>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">
//               Chargement de la page...
//             </h3>
//             <p className="text-gray-500">
//               Veuillez patienter pendant le chargement des données.
//             </p>
//           </div>
//         </div>
//       </div>
//     }>
//       <CarteRoseAnnulationScreenClient
//         initialCartesRoses={cartesRosesData.cartesRoses}
//         initialPagination={cartesRosesData.pagination}
//         initialStats={stats}
//         initialSites={sites}
//         initialTypesVehicules={typesVehicules}
//         initialFilters={filters}
//         initialSearchTerm={searchParams.search || ""}
//       />
//     </Suspense>
//   );
// }

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  User,
  Calendar,
  Phone,
  Trash2,
  Eye,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BarChart3,
  Users,
  FileText,
  XCircle,
  Filter as FilterIcon,
  CalendarDays,
  Building,
  Loader2,
  Car,
  Hash,
  Mail,
  MapPin,
  Tag,
  Shield,
  BadgeDollarSign,
  Car as CarIcon,
  Fuel,
  Palette,
  Gauge,
  Wrench,
} from "lucide-react";
import {
  getCartesRoses,
  getStatsCartesRoses,
  annulerCarteRose,
  type CarteRose,
  type StatsCartesRoses,
  type RechercheParamsCartesRoses,
  type PaginationResponseCartesRoses,
  getSitesDisponibles,
  exporterCartesRosesExcel,
  getDetailsCarteRose,
  getTypesVehicules,
} from "@/services/carteRose/carteRoseService";

// Types
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  carteRose: CarteRose | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface DetailModalProps {
  isOpen: boolean;
  carteRose: CarteRose | null;
  onClose: () => void;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
  sites: Site[];
  typesVehicules: TypeVehicule[];
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
  type_engin: string;
  order_by: string;
  order_dir: "ASC" | "DESC";
}

interface Site {
  id: number;
  nom: string;
  code: string;
}

interface TypeVehicule {
  type: string;
  count: number;
}

interface PaginationState {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Fonction utilitaire pour formater la date
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return dateString;
  }
};

// Modal de message
function MessageModal({
  isOpen,
  type,
  title,
  message,
  onClose,
}: MessageModalProps) {
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

  const {
    icon: Icon,
    iconColor,
    bgColor,
    borderColor,
    textColor,
    buttonColor,
  } = typeStyles[type];

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

          <div
            className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-6`}
          >
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

// Modal de confirmation d'annulation
function DeleteConfirmationModal({
  isOpen,
  carteRose,
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

  if (!isOpen || !carteRose) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
              Confirmer l'annulation
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
              Êtes-vous sûr de vouloir annuler cette carte rose ?
            </p>
            <div className="mt-3 space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Client:</span> {carteRose.nom}{" "}
                {carteRose.prenom}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Téléphone:</span>{" "}
                {carteRose.telephone}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Numéro de plaque:</span>{" "}
                <span className="font-bold text-red-600">
                  {carteRose.numero_plaque}
                </span>
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Véhicule:</span>{" "}
                {carteRose.type_engin} - {carteRose.marque}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Chassis:</span>{" "}
                {carteRose.numero_chassis || "Non renseigné"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Date attribution:</span>{" "}
                {formatDate(carteRose.date_attribution)}
              </p>
            </div>
            <p className="text-red-600 text-sm mt-3">
              Cette action annulera complètement la carte rose, restaurera la
              plaque dans le stock disponible, et supprimera tous les
              enregistrements associés (véhicule, paiement, carte reprint).
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
                  Annulation...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Annuler la carte rose
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
function DetailModal({ isOpen, carteRose, onClose }: DetailModalProps) {
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

  if (!isOpen || !carteRose) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Détails de la carte rose
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Paiement #{carteRose.paiement_id} • Plaque{" "}
                {carteRose.numero_plaque}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section Propriétaire */}
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
              <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informations du propriétaire
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">
                    Nom complet:
                  </span>
                  <span className="text-gray-900 font-bold">
                    {carteRose.nom} {carteRose.prenom}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Téléphone:</span>
                  <span className="text-gray-900">
                    {carteRose.telephone || "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Email:</span>
                  <span className="text-gray-900">
                    {carteRose.email || "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Adresse:</span>
                  <span className="text-gray-900">
                    {carteRose.adresse || "Non renseignée"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">NIF:</span>
                  <span className="text-gray-900">
                    {carteRose.nif || "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">
                    ID Propriétaire:
                  </span>
                  <span className="text-gray-900">
                    {carteRose.particulier_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Section Véhicule */}
            <div className="bg-green-50 rounded-xl p-5 border border-green-200">
              <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                <CarIcon className="w-5 h-5 mr-2" />
                Informations du véhicule
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">
                    Numéro plaque:
                  </span>
                  <span className="text-gray-900 font-bold">
                    {carteRose.numero_plaque}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">Type:</span>
                  <span className="text-gray-900">{carteRose.type_engin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">Marque:</span>
                  <span className="text-gray-900">{carteRose.marque}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">Énergie:</span>
                  <span className="text-gray-900">
                    {carteRose.energie || "Non renseignée"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">
                    Année fabrication:
                  </span>
                  <span className="text-gray-900">
                    {carteRose.annee_fabrication || "Non renseignée"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">
                    Année circulation:
                  </span>
                  <span className="text-gray-900">
                    {carteRose.annee_circulation || "Non renseignée"}
                  </span>
                </div>
              </div>
            </div>

            {/* Section Caractéristiques */}
            <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
              <h4 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                <Gauge className="w-5 h-5 mr-2" />
                Caractéristiques techniques
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">Couleur:</span>
                  <span className="text-gray-900">
                    {carteRose.couleur || "Non renseignée"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">
                    Puissance fiscale:
                  </span>
                  <span className="text-gray-900">
                    {carteRose.puissance_fiscal || "Non renseignée"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">Usage:</span>
                  <span className="text-gray-900">
                    {carteRose.usage_engin || "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">
                    Numéro chassis:
                  </span>
                  <span className="text-gray-900">
                    {carteRose.numero_chassis || "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">
                    Numéro moteur:
                  </span>
                  <span className="text-gray-900">
                    {carteRose.numero_moteur || "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">ID Engin:</span>
                  <span className="text-gray-900">{carteRose.engin_id}</span>
                </div>
              </div>
            </div>

            {/* Section Administration */}
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
              <h4 className="text-lg font-bold text-amber-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Informations administratives
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">
                    Date attribution:
                  </span>
                  <span className="text-gray-900">
                    {formatDate(carteRose.date_attribution)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Site:</span>
                  <span className="text-gray-900">{carteRose.site_nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Caissier:</span>
                  <span className="text-gray-900">{carteRose.caissier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">
                    ID Paiement:
                  </span>
                  <span className="text-gray-900">{carteRose.paiement_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">ID Impôt:</span>
                  <span className="text-gray-900">{carteRose.impot_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">
                    ID Plaque attribuée:
                  </span>
                  <span className="text-gray-900">
                    {carteRose.plaque_attribuee_id || "Non renseigné"}
                  </span>
                </div>
                {carteRose.reprint_id && (
                  <div className="flex justify-between">
                    <span className="text-amber-700 font-medium">
                      ID Carte reprint:
                    </span>
                    <span className="text-gray-900">
                      {carteRose.reprint_id}
                    </span>
                  </div>
                )}
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
  typesVehicules,
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
      type_engin: "",
      order_by: "date_attribution",
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

              {/* Type de véhicule */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de véhicule
                </label>
                <select
                  value={localFilters.type_engin}
                  onChange={(e) => handleChange("type_engin", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tous les types</option>
                  {typesVehicules.map((type) => (
                    <option key={type.type} value={type.type}>
                      {type.type} ({type.count})
                    </option>
                  ))}
                </select>
              </div> */}

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
                    <option value="date_attribution">Date attribution</option>
                    <option value="nom">Nom</option>
                    <option value="numero_plaque">Numéro plaque</option>
                    <option value="type_engin">Type véhicule</option>
                    <option value="marque">Marque</option>
                  </select>
                  <select
                    value={localFilters.order_dir}
                    onChange={(e) =>
                      handleChange(
                        "order_dir",
                        e.target.value as "ASC" | "DESC",
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
export default function CarteRoseAnnulationScreen() {
  // États principaux
  const [cartesRoses, setCartesRoses] = useState<CarteRose[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCarteRose, setSelectedCarteRose] = useState<CarteRose | null>(
    null,
  );
  const [carteRoseToDelete, setCarteRoseToDelete] = useState<CarteRose | null>(
    null,
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
  const [stats, setStats] = useState<StatsCartesRoses | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [typesVehicules, setTypesVehicules] = useState<TypeVehicule[]>([]);
  const [error, setError] = useState<string | null>(null);

  // États filtres
  const [filters, setFilters] = useState<FilterState>({
    date_debut: "",
    date_fin: "",
    site_id: 0,
    type_engin: "",
    order_by: "date_attribution",
    order_dir: "DESC",
  });

  // Fonction pour afficher les messages
  const showMessage = (
    type: "success" | "error" | "info" | "warning",
    title: string,
    message: string,
  ) => {
    setMessageModalProps({ type, title, message });
    setShowMessageModal(true);
  };

  // Charger les sites et types de véhicules
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Charger les sites
        const sitesResult = await getSitesDisponibles();
        if (sitesResult.status === "success" && sitesResult.data) {
          setSites(sitesResult.data);
        }

        // Charger les types de véhicules
        const typesResult = await getTypesVehicules();
        if (typesResult.status === "success" && typesResult.data) {
          setTypesVehicules(typesResult.data);
        }
      } catch (error) {
        console.error("Erreur chargement données initiales:", error);
      }
    };

    loadInitialData();
  }, []);

  // Charger les cartes roses
  const loadCartesRoses = async (page = 1, search = searchTerm) => {
    setIsLoading(true);
    setError(null);

    try {
      const params: RechercheParamsCartesRoses = {
        page,
        limit: pagination.limit,
        search,
        ...filters,
      };

      const result = await getCartesRoses(params);

      if (result.status === "success" && result.data) {
        const cartesRosesArray = Array.isArray(result.data.cartesRoses)
          ? result.data.cartesRoses
          : [];
        setCartesRoses(cartesRosesArray);

        const paginationData = result.data.pagination || {
          total: cartesRosesArray.length,
          page: page,
          limit: pagination.limit,
          totalPages: Math.max(
            1,
            Math.ceil(cartesRosesArray.length / pagination.limit),
          ),
        };

        setPagination(paginationData);

        if (cartesRosesArray.length === 0) {
          setError("Aucune carte rose trouvée avec les critères sélectionnés");
        }
      } else {
        const errorMessage =
          result.message || "Erreur inconnue lors du chargement";
        setError(errorMessage);
        setCartesRoses([]);
        setPagination({
          total: 0,
          page: 1,
          limit: pagination.limit,
          totalPages: 1,
        });
      }
    } catch (error) {
      setError("Erreur réseau. Vérifiez votre connexion.");
      setCartesRoses([]);
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
        RechercheParamsCartesRoses,
        "page" | "limit" | "order_by" | "order_dir"
      > = {
        search: searchTerm,
        date_debut: filters.date_debut,
        date_fin: filters.date_fin,
        site_id: filters.site_id,
        type_engin: filters.type_engin,
      };

      const result = await getStatsCartesRoses(params);

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
    loadCartesRoses();
    loadStats();
  }, []);

  // Recharger quand les filtres changent
  useEffect(() => {
    loadCartesRoses(1);
    loadStats();
  }, [filters]);

  // Gérer la recherche
  const handleSearch = useCallback(() => {
    loadCartesRoses(1, searchTerm);
    loadStats();
  }, [searchTerm]);

  // Gérer le changement de page
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadCartesRoses(page);
    }
  };

  // Gérer l'ouverture du détail
  const handleViewDetail = (carteRose: CarteRose) => {
    setSelectedCarteRose(carteRose);
    setShowDetailModal(true);
  };

  // Gérer l'annulation
  const handleDeleteClick = (carteRose: CarteRose, e: React.MouseEvent) => {
    e.stopPropagation();
    setCarteRoseToDelete(carteRose);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!carteRoseToDelete) return;

    setIsDeleting(true);
    try {
      const result = await annulerCarteRose(
        carteRoseToDelete.paiement_id,
        1, // ID utilisateur - à remplacer par l'ID réel de l'utilisateur connecté
        "Annulation via interface admin",
      );

      if (result.status === "success") {
        await Promise.all([loadCartesRoses(pagination.page), loadStats()]);
        setShowDeleteModal(false);
        setCarteRoseToDelete(null);
        showMessage("success", "Succès", "Carte rose annulée avec succès");
      } else {
        showMessage(
          "error",
          "Erreur",
          result.message || "Erreur lors de l'annulation",
        );
      }
    } catch (error) {
      showMessage("error", "Erreur", "Erreur réseau lors de l'annulation");
    } finally {
      setIsDeleting(false);
    }
  };

  // Gérer les filtres
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    loadCartesRoses(1);
    loadStats();
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    const resetFilters: FilterState = {
      date_debut: "",
      date_fin: "",
      site_id: 0,
      type_engin: "",
      order_by: "date_attribution",
      order_dir: "DESC",
    };
    setFilters(resetFilters);
    setSearchTerm("");
    loadCartesRoses(1, "");
    loadStats();
    setError(null);
    showMessage(
      "info",
      "Filtres réinitialisés",
      "Tous les filtres ont été réinitialisés",
    );
  };

  // Gérer l'export Excel
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const params: RechercheParamsCartesRoses = {
        search: searchTerm,
        date_debut: filters.date_debut,
        date_fin: filters.date_fin,
        site_id: filters.site_id,
        type_engin: filters.type_engin,
      };

      const result = await exporterCartesRosesExcel(params);

      if (result.status === "success" && result.data) {
        const link = document.createElement("a");
        link.href = `${process.env.NEXT_PUBLIC_API_URL || ""}/exports/${
          result.data.filename
        }`;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showMessage(
          "success",
          "Export réussi",
          "Export Excel terminé avec succès",
        );
      } else {
        showMessage(
          "error",
          "Erreur",
          result.message || "Erreur lors de l'exportation",
        );
      }
    } catch (error) {
      showMessage("error", "Erreur", "Erreur réseau lors de l'exportation");
    } finally {
      setIsExporting(false);
    }
  };

  // Formatage
  const getFullName = (carteRose: CarteRose) => {
    return `${carteRose.nom} ${carteRose.prenom}`;
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
              },
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

  // Calculer les statistiques des types de véhicules
  const getTopTypesVehicules = () => {
    if (!stats?.typesVehicules) return [];

    return Object.entries(stats.typesVehicules)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* En-tête */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Annulation des Cartes Roses
              </h1>
              <p className="text-gray-600 mt-2">
                Gestion des annulations de cartes roses délivrées
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
                  loadCartesRoses(pagination.page);
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
                      Total Cartes Roses
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
                      Clients Uniques
                    </p>
                    <p className="text-2xl font-bold text-green-800">
                      {stats.clientsUniques}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 font-medium">
                      Première attribution
                    </p>
                    <p className="text-sm font-bold text-purple-800">
                      {stats.datePremiere
                        ? formatDate(stats.datePremiere)
                        : "N/A"}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700 font-medium">
                      Dernière attribution
                    </p>
                    <p className="text-sm font-bold text-amber-800">
                      {stats.dateDerniere
                        ? formatDate(stats.dateDerniere)
                        : "N/A"}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-amber-600" />
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
                placeholder="Rechercher par nom, téléphone, plaque, chassis..."
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
                filters.site_id > 0 ||
                filters.type_engin) && (
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
                      Site:{" "}
                      {sites.find((s) => s.id === filters.site_id)?.nom ||
                        filters.site_id}
                    </span>
                  )}
                  {filters.type_engin && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">
                      <CarIcon className="w-3 h-3 mr-1" />
                      Type: {filters.type_engin}
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

        {/* Liste des cartes roses */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {isLoading && cartesRoses.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chargement des cartes roses...
              </h3>
              <p className="text-gray-500">
                Veuillez patienter pendant le chargement des données.
              </p>
            </div>
          ) : cartesRoses.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Propriétaire
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Téléphone
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Plaque
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Véhicule
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
                    {cartesRoses.map((carteRose, index) => (
                      <tr
                        key={`${carteRose.paiement_id}-${carteRose.engin_id}-${index}`}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleViewDetail(carteRose)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(carteRose.date_attribution)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {getFullName(carteRose)}
                              </div>
                              <div className="text-sm text-gray-500">
                                NIF: {carteRose.nif || "Non renseigné"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {carteRose.telephone || "Non renseigné"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-50 text-red-700 border border-red-200">
                            <CarIcon className="w-4 h-4 mr-2" />
                            {carteRose.numero_plaque}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {carteRose.type_engin}
                          </div>
                          <div className="text-xs text-gray-500">
                            {carteRose.marque}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {carteRose.site_nom}
                          </div>
                          <div className="text-xs text-gray-500">
                            {carteRose.caissier}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div
                            className="flex space-x-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleViewDetail(carteRose)}
                              className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Détail
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(carteRose, e)}
                              className="inline-flex items-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                              disabled={isDeleting}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Annuler
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
                {error ? "Erreur de chargement" : "Aucune carte rose trouvée"}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {error ||
                  (searchTerm ||
                  filters.date_debut ||
                  filters.date_fin ||
                  filters.site_id > 0 ||
                  filters.type_engin
                    ? "Aucune carte rose ne correspond à votre recherche. Essayez d'autres critères."
                    : "Aucune carte rose n'a été délivrée.")}
              </p>
              {error && (
                <button
                  onClick={() => {
                    setError(null);
                    loadCartesRoses();
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
        carteRose={selectedCarteRose}
        onClose={() => setShowDetailModal(false)}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        carteRose={carteRoseToDelete}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setCarteRoseToDelete(null);
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
        typesVehicules={typesVehicules}
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
