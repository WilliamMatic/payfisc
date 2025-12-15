"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Phone,
  MapPin,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardData } from "@/services/dashboards/dashboard";

interface ReproductionTableProps {
  filters?: {
    startDate: string;
    endDate: string;
    plateNumber: string;
  };
  refreshTrigger?: number;
}

interface ReproductionSale {
  id: string;
  fullName: string;
  oldPlateNumber: string;
  address: string;
  phone: string;
  reason: string;
  amount: number;
  vehicle: {
    plateNumber: string;
    oldPlateNumber: string;
    brand: string;
    model: string;
    energy: string;
    manufactureYear: string;
    circulationYear: string;
    color: string;
    fiscalPower: string;
    usage: string;
    engineNumber: string;
    chassisNumber: string;
  };
}

const ReproductionTable = ({
  filters,
  refreshTrigger = 0,
}: ReproductionTableProps) => {
  const { utilisateur, isLoading: authLoading } = useAuth();
  const [sales, setSales] = useState<ReproductionSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  useEffect(() => {
    const fetchSales = async () => {
      if (!utilisateur?.id || authLoading) return;

      try {
        setLoading(true);
        setError(null);

        const filterParams = {
          startDate: filters?.startDate || "",
          endDate: filters?.endDate || "",
          plateNumber: filters?.plateNumber || "",
          saleType: "reproduction" as const,
        };

        const response = await getDashboardData(utilisateur.id, filterParams);

        if (response.status === "success" && response.data?.reproductionSales) {
          setSales(response.data.reproductionSales);
        } else {
          setError(
            response.message ||
              "Erreur lors de la récupération des reproductions"
          );
          setSales([]);
        }
      } catch (err) {
        setError("Erreur de connexion au serveur");
        console.error("Erreur fetch ReproductionTable:", err);
        setSales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [utilisateur, authLoading, filters, refreshTrigger]);

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

  // Fonction pour déterminer la couleur du badge selon le motif
  const getReasonColor = (reason: string) => {
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes("vol")) return "bg-red-100 text-red-800";
    if (
      reasonLower.includes("détériorée") ||
      reasonLower.includes("endommagée")
    )
      return "bg-amber-100 text-amber-800";
    if (reasonLower.includes("perte") || reasonLower.includes("perdu"))
      return "bg-orange-100 text-orange-800";
    return "bg-amber-100 text-amber-800";
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
          <p className="font-medium">Erreur de chargement des reproductions</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-center text-gray-500">
          <p className="font-medium">Aucune reproduction de plaque trouvée</p>
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
                Assujetti
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Coordonnées
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Motif
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Montant payé
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.map((sale, index) => (
              <React.Fragment key={sale.id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <button
                      onClick={() => toggleRow(index)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedRows.includes(index) ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {sale.fullName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Plaque: {sale.oldPlateNumber}
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
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getReasonColor(
                        sale.reason
                      )}`}
                    >
                      {sale.reason}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-gray-900">
                        {formatAmount(sale.amount)}
                      </span>
                    </div>
                  </td>
                </tr>

                {expandedRows.includes(index) && (
                  <tr className="bg-amber-50">
                    <td colSpan={5} className="p-6">
                      <div className="bg-white rounded-lg border border-amber-100 overflow-hidden">
                        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                          <h4 className="font-medium text-amber-800">
                            Détails de l'engin reproduit
                          </h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-700">
                                  Plaque
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-700">
                                  Marque/Modèle
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-700">
                                  Énergie
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-700">
                                  Année fab.
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-700">
                                  Année circ.
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-700">
                                  Couleur
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-700">
                                  Puissance
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-700">
                                  Usage
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-700">
                                  Moteur
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-700">
                                  Châssis
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="hover:bg-gray-50">
                                <td className="py-3 px-4">
                                  <div>
                                    <span className="font-mono text-sm font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded">
                                      {sale.vehicle.plateNumber}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Ancienne: {sale.vehicle.oldPlateNumber}
                                    </p>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div>
                                    <p className="font-medium">
                                      {sale.vehicle.brand}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {sale.vehicle.model}
                                    </p>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                    {sale.vehicle.energy}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm">
                                  {sale.vehicle.manufactureYear}
                                </td>
                                <td className="py-3 px-4 text-sm">
                                  {sale.vehicle.circulationYear}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-4 h-4 rounded border"
                                      style={{
                                        backgroundColor:
                                          sale.vehicle.color.toLowerCase(),
                                      }}
                                    />
                                    <span className="text-sm">
                                      {sale.vehicle.color}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm">
                                  {sale.vehicle.fiscalPower} CV
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                    {sale.vehicle.usage}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="font-mono text-sm">
                                    {sale.vehicle.engineNumber}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="font-mono text-sm">
                                    {sale.vehicle.chassisNumber}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReproductionTable;
