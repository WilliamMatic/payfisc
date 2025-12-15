"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Building2,
  Phone,
  MapPin,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardData } from "@/services/dashboards/dashboard";

interface WholesaleTableProps {
  filters?: {
    startDate: string;
    endDate: string;
    plateNumber: string;
  };
  refreshTrigger?: number;
}

interface WholesaleSale {
  id: string;
  companyName: string;
  registrationNumber: string;
  address: string;
  phone: string;
  platesPurchased: number;
  totalAmount: number;
  plates: string[];
  allPlates?: string[];
}

const WholesaleTable = ({
  filters,
  refreshTrigger = 0,
}: WholesaleTableProps) => {
  const { utilisateur, isLoading: authLoading } = useAuth();
  const [sales, setSales] = useState<WholesaleSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  useEffect(() => {
    const fetchSales = async () => {
      if (!utilisateur?.id) return;

      try {
        setLoading(true);
        setError(null);

        const filterParams = {
          startDate: filters?.startDate || "",
          endDate: filters?.endDate || "",
          plateNumber: filters?.plateNumber || "",
          saleType: "wholesale" as const,
        };

        const response = await getDashboardData(utilisateur.id, filterParams);

        if (response.status === "success" && response.data?.wholesaleSales) {
          setSales(response.data.wholesaleSales);
        } else {
          setError(
            response.message ||
              "Erreur lors de la récupération des ventes grossistes"
          );
          setSales([]);
        }
      } catch (err) {
        setError("Erreur de connexion au serveur");
        console.error("Erreur fetch WholesaleTable:", err);
        setSales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [utilisateur, filters, refreshTrigger]);

  const toggleRow = (index: number) => {
    setExpandedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Fonction pour formater l'affichage des plaques si > 100
  const formatPlates = (plates: string[]) => {
    if (plates.length > 100) {
      return [
        plates[0], // Première plaque
        "...",
        plates[plates.length - 1], // Dernière plaque
      ];
    }
    return plates;
  };

  if (authLoading || loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100">
        <div className="text-center text-red-600">
          <p className="font-medium">
            Erreur de chargement des ventes grossistes
          </p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-center text-gray-500">
          <p className="font-medium">Aucune vente grossiste trouvée</p>
          <p className="text-sm mt-1">
            Aucune transaction ne correspond aux critères sélectionnés
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-12 py-4"></th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Grossiste
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Coordonnées
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Plaques achetées
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Montant total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.map((sale, index) => {
              const displayPlates = formatPlates(sale.plates);
              const hasManyPlates = sale.plates.length > 100;

              return (
                <React.Fragment key={sale.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleRow(index)}
                        className="p-1 hover:bg-gray-100 rounded"
                        disabled={sale.plates.length === 0}
                      >
                        {sale.plates.length > 0 ? (
                          expandedRows.includes(index) ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          )
                        ) : null}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {sale.companyName}
                          </p>
                          <p className="text-sm text-gray-500">
                            RC: {sale.registrationNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{sale.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{sale.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-green-600">
                          {sale.platesPurchased}
                        </span>
                        <span className="text-sm text-gray-500">plaques</span>
                        {hasManyPlates && (
                          <span className="text-xs text-gray-400">
                            (affichage limité)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-bold text-gray-900">
                          {formatAmount(sale.totalAmount)}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {expandedRows.includes(index) && sale.plates.length > 0 && (
                    <tr className="bg-green-50">
                      <td colSpan={5} className="p-6">
                        <div className="bg-white rounded-lg border border-green-100 overflow-hidden">
                          <div className="px-4 py-3 bg-green-50 border-b border-green-100">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-green-800">
                                Plaques achetées ({sale.plates.length})
                              </h4>
                              {hasManyPlates && (
                                <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                                  Affichage: première et dernière plaque
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {displayPlates.map((plate, pIndex) => (
                                <span
                                  key={pIndex}
                                  className={`px-3 py-2 rounded-lg font-mono font-medium ${
                                    plate === "..."
                                      ? "bg-gray-100 text-gray-500 italic"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {plate}
                                </span>
                              ))}
                            </div>
                            {hasManyPlates &&
                              sale.allPlates &&
                              sale.allPlates.length > 0 && (
                                <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                                  <p className="text-sm text-gray-600 mb-2">
                                    Total réel: {sale.allPlates.length} plaques
                                  </p>
                                  <details className="text-sm">
                                    <summary className="cursor-pointer text-green-700 font-medium">
                                      Voir toutes les plaques
                                    </summary>
                                    <div className="mt-2 p-3 bg-white rounded border max-h-60 overflow-y-auto">
                                      <div className="flex flex-wrap gap-1">
                                        {sale.allPlates.map((plate, pIndex) => (
                                          <span
                                            key={pIndex}
                                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-mono"
                                          >
                                            {plate}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </details>
                                </div>
                              )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WholesaleTable;
