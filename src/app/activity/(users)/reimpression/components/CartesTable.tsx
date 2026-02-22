// src/app/activity/(users)/reimpression/components/CartesTable.tsx
"use client";

import { useState } from "react";
import {
  User,
  Bike,
  Calendar,
  AlertCircle,
  CheckCircle,
  Printer,
  Eye,
  Search,
} from "lucide-react";
import { formatPlaque } from "../../operations/utils/formatPlaque";
import PrintModal from "./PrintModal";
import { CarteReprint } from "../types";

interface CartesTableProps {
  cartes: CarteReprint[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  searchTerm: string;
  statusFilter: string;
  onPageChange: (page: number) => void;
  onPrintSuccess: (carteId: number) => void;
  utilisateur: any;
  onRefresh: () => void;
}

export default function CartesTable({
  cartes,
  isLoading,
  pagination,
  searchTerm,
  statusFilter,
  onPageChange,
  onPrintSuccess,
  utilisateur,
  onRefresh,
}: CartesTableProps) {
  const [selectedCarte, setSelectedCarte] = useState<CarteReprint | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const handlePrintClick = (carte: CarteReprint, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedCarte(carte);
    setShowPrintModal(true);
  };

  const handleViewClick = (carte: CarteReprint, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedCarte(carte);
    setShowPrintModal(true);
  };

  const handleRowClick = (carte: CarteReprint) => {
    setSelectedCarte(carte);
    setShowPrintModal(true);
  };

  const handlePrintSuccessWrapper = (carteId: number) => {
    onPrintSuccess(carteId);
    setShowPrintModal(false);
    onRefresh();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">
              Chargement des données...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (cartes.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune carte trouvée
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchTerm || statusFilter !== "all"
              ? "Aucune carte ne correspond à vos critères de recherche."
              : "Il n'y a actuellement aucune carte à réimprimer pour votre site."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Propriétaire
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Numéro de plaque
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cartes.map((carte) => (
                <tr
                  key={carte.id_primaire}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(carte)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {carte.nom_proprietaire}
                        </div>
                        <div className="text-sm text-gray-500">
                          {carte.nif_proprietaire}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-50 text-red-700 border border-red-200">
                      <Bike className="w-4 h-4 mr-2" />
                      {formatPlaque(carte.numero_plaque)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {carte.utilisateur_nom}
                    </div>
                    <div className="text-sm text-gray-500">
                      {carte.site_nom}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {carte.date_creation_formatted ||
                        new Date(carte.date_creation).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {carte.status === 0 ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                        <AlertCircle className="w-4 h-4 mr-1" />À imprimer
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Imprimé
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {carte.status === 0 && (
                      <button
                        onClick={(e) => handlePrintClick(carte, e)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimer
                      </button>
                    )}
                    <button
                      onClick={(e) => handleViewClick(carte, e)}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {cartes.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de{" "}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              à{" "}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              sur <span className="font-medium">{pagination.total}</span>{" "}
              résultats
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Précédent
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
                        onClick={() => onPageChange(pageNum)}
                        className={`px-3 py-1 text-sm rounded ${
                          pagination.page === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  },
                )}
              </div>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal d'impression */}
      {selectedCarte && (
        <PrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          carte={selectedCarte}
          onPrintSuccess={handlePrintSuccessWrapper}
          utilisateur={utilisateur}
        />
      )}
    </>
  );
}
