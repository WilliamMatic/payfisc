"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Phone,
  Hash,
  Loader2,
} from "lucide-react";
import VignetteDetailsModal from "./VignetteDetailsModal";
import RenouvellementConfirmModal from "./RenouvellementConfirmModal";
import SuccessModal from "./SuccessModal";
import { getVignettesARenouveler, renouvelerVignette } from "@/services/vente-vignette/venteVignetteService";
import { useAuth } from "@/contexts/AuthContext";
import { Vignette, Impot } from "./types";

interface RenouvellementListProps {
  impot: Impot;
}

type FiltreStatut = "tous" | "expire" | "proche-expiration" | "valide";

export default function RenouvellementList({ impot }: RenouvellementListProps) {
  const { utilisateur } = useAuth();
  const [vignettes, setVignettes] = useState<Vignette[]>([]);
  const [filteredVignettes, setFilteredVignettes] = useState<Vignette[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("tous");
  const [showFilters, setShowFilters] = useState(false);

  // États pour les modaux
  const [selectedVignette, setSelectedVignette] = useState<Vignette | null>(
    null,
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRenouvellementModal, setShowRenouvellementModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [renouvellementData, setRenouvellementData] = useState<any>(null);

  // Charger les données
  const loadVignettes = async (statut?: string, recherche?: string) => {
    setIsLoading(true);
    try {
      const filtres: {
        seuil_jours?: number;
        statut_expiration?: 'expire' | 'proche';
        recherche?: string;
      } = { seuil_jours: 30 };

      if (statut === 'expire') filtres.statut_expiration = 'expire';
      else if (statut === 'proche-expiration') filtres.statut_expiration = 'proche';

      if (recherche) filtres.recherche = recherche;

      const result = await getVignettesARenouveler(filtres);
      if (result.status === 'success' && result.data) {
        const mapped: Vignette[] = result.data.map((item) => ({
          id: item.id,
          assujetti: {
            id: item.particulier_id,
            nom_complet: item.nom_complet,
            telephone: item.telephone,
            adresse: '',
          },
          engin: {
            id: item.engin_id,
            numero_plaque: item.numero_plaque,
            marque: item.marque,
            modele: item.modele,
            couleur: '',
            energie: '',
            usage_engin: '',
            puissance_fiscal: '',
            annee_fabrication: '',
            numero_chassis: '',
            numero_moteur: '',
            type_engin: '',
          },
          paiement: {
            id: item.id_paiement,
            montant: item.montant,
            mode_paiement: '',
            operateur: null,
            numero_transaction: '',
            date_paiement: '',
          },
          site_achat: item.site_nom,
          date_achat: item.date_delivrance,
          date_expiration: item.date_validite,
          montant_paye: item.montant,
          mode_paiement: '',
          reference_paiement: item.code_vignette,
          jours_restants: item.jours_restants,
        }));
        setVignettes(mapped);
        setFilteredVignettes(mapped);
      } else {
        setVignettes([]);
        setFilteredVignettes([]);
      }
    } catch {
      setVignettes([]);
      setFilteredVignettes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVignettes(
      filtreStatut !== 'tous' ? filtreStatut : undefined,
      searchTerm || undefined,
    );
  }, [searchTerm, filtreStatut]);

  const handleViewDetails = (vignette: Vignette) => {
    setSelectedVignette(vignette);
    setShowDetailsModal(true);
  };

  const handleRenew = (vignette: Vignette) => {
    setSelectedVignette(vignette);
    setShowRenouvellementModal(true);
  };

  const handleRenouvellementSuccess = (data: any) => {
    setShowRenouvellementModal(false);
    // Structurer les données pour le SuccessModal
    setRenouvellementData({
      renouvellement: {
        id: data.id,
        paiement_id: data.paiement_id,
        date_renouvellement: new Date().toISOString(),
        montant: data.montant || Number(impot.prix) || 0,
        nouvelle_date_expiration: data.date_validite,
      },
      engin: {
        numero_plaque: selectedVignette?.engin?.numero_plaque,
      },
      assujetti: {
        nom_complet: selectedVignette?.assujetti?.nom_complet,
      },
    });
    setShowSuccessModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    loadVignettes(
      filtreStatut !== 'tous' ? filtreStatut : undefined,
      searchTerm || undefined,
    );
  };

  // Fonction pour obtenir la classe de statut
  const getStatutBadge = (vignette: Vignette) => {
    const aujourdhui = new Date();
    const dateExpiration = new Date(vignette.date_expiration);
    const diffJours = Math.ceil(
      (dateExpiration.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (dateExpiration < aujourdhui) {
      return {
        text: "Expirée",
        class: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
      };
    } else if (diffJours <= 30) {
      return {
        text: `Expire dans ${diffJours} jours`,
        class: "bg-amber-100 text-amber-800 border-amber-200",
        icon: Clock,
      };
    } else {
      return {
        text: `Valide (${diffJours} jours)`,
        class: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
      };
    }
  };

  // Statistiques
  const stats = {
    total: vignettes.length,
    expirees: vignettes.filter((v) => new Date(v.date_expiration) < new Date())
      .length,
    proches: vignettes.filter((v) => {
      const dateExpiration = new Date(v.date_expiration);
      const diffJours = Math.ceil(
        (dateExpiration.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return dateExpiration >= new Date() && diffJours <= 30;
    }).length,
    valides: vignettes.filter((v) => {
      const dateExpiration = new Date(v.date_expiration);
      const diffJours = Math.ceil(
        (dateExpiration.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return dateExpiration >= new Date() && diffJours > 30;
    }).length,
  };

  return (
    <>
      <div className="space-y-6">
        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expirées</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.expirees}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Proche expiration</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.proches}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Valides</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.valides}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par plaque ou téléphone..."
                className="block w-full pl-12 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              />
            </div>

            <button
              onClick={() => loadVignettes(
                filtreStatut !== 'tous' ? filtreStatut : undefined,
                searchTerm || undefined,
              )}
              disabled={isLoading}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50"
              title="Rafraîchir la liste"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtres
            </button>
          </div>

          {/* Filtres déroulants */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setFiltreStatut("tous")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtreStatut === "tous"
                      ? "bg-amber-100 text-amber-800 border-2 border-amber-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFiltreStatut("expire")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtreStatut === "expire"
                      ? "bg-red-100 text-red-800 border-2 border-red-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Expirées
                </button>
                <button
                  onClick={() => setFiltreStatut("proche-expiration")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtreStatut === "proche-expiration"
                      ? "bg-amber-100 text-amber-800 border-2 border-amber-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Proche expiration (30 jours)
                </button>
                <button
                  onClick={() => setFiltreStatut("valide")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtreStatut === "valide"
                      ? "bg-green-100 text-green-800 border-2 border-green-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Valides
                </button>
              </div>
            </div>
          )}

          {/* Indication recherche */}
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-4">
            <div className="flex items-center">
              <Hash className="w-3 h-3 mr-1" />
              Recherche par plaque (ex: AA256)
            </div>
            <div className="flex items-center">
              <Phone className="w-3 h-3 mr-1" />
              Recherche par téléphone (ex: +243...)
            </div>
          </div>
        </div>

        {/* Tableau des vignettes */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plaque
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propriétaire
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date achat
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date expiration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
                        <p className="text-gray-500">
                          Chargement des vignettes...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredVignettes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-gray-500 font-medium">
                          Aucune vignette trouvée
                        </p>
                        <p className="text-sm text-gray-400">
                          Essayez de modifier vos critères de recherche
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVignettes.map((vignette) => {
                    const statut = getStatutBadge(vignette);
                    const StatutIcon = statut.icon;

                    return (
                      <tr
                        key={vignette.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-gray-900">
                            {vignette.engin.numero_plaque}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {vignette.assujetti.nom_complet}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {vignette.assujetti.telephone || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {vignette.engin.marque} {vignette.engin.modele}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {new Date(vignette.date_achat).toLocaleDateString(
                              "fr-FR",
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {new Date(
                              vignette.date_expiration,
                            ).toLocaleDateString("fr-FR")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statut.class}`}
                          >
                            <StatutIcon className="w-3 h-3 mr-1" />
                            {statut.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                          <button
                            onClick={() => handleViewDetails(vignette)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRenew(vignette)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Renouveler"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pied de tableau */}
          {!isLoading && filteredVignettes.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Affichage de {filteredVignettes.length} vignette
                {filteredVignettes.length > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modaux */}
      <VignetteDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        vignette={selectedVignette}
        onRenew={() => {
          setShowDetailsModal(false);
          setTimeout(() => setShowRenouvellementModal(true), 100);
        }}
      />

      <RenouvellementConfirmModal
        isOpen={showRenouvellementModal}
        onClose={() => setShowRenouvellementModal(false)}
        onSuccess={handleRenouvellementSuccess}
        vignette={selectedVignette}
        montant={Number(impot.prix) || 0}
        utilisateur={utilisateur}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        data={renouvellementData}
      />
    </>
  );
}
