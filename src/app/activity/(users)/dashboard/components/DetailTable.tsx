"use client";
import React, { useState, useEffect } from "react";

import {
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  MapPin,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardData } from "@/services/dashboards/dashboard";
import type { DetailSale } from "@/services/dashboards/dashboard";

interface DetailTableProps {
  filters?: {
    startDate: string;
    endDate: string;
    plateNumber: string;
  };
  refreshTrigger?: number;
}

const DetailTable = ({ filters, refreshTrigger = 0 }: DetailTableProps) => {
  const { utilisateur, isLoading: authLoading } = useAuth();
  const [sales, setSales] = useState<DetailSale[]>([]);
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
          saleType: "retail" as const,
        };

        const response = await getDashboardData(utilisateur.id, filterParams);

        if (response.status === "success" && response.data?.detailSales) {
          setSales(response.data.detailSales);
        } else {
          setError(
            response.message || "Erreur lors de la récupération des ventes"
          );
          console.error("Erreur API DetailTable:", response.message);
          setSales([]);
        }
      } catch (err) {
        setError("Erreur de connexion au serveur");
        console.error("Erreur fetch DetailTable:", err);
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
          <p className="font-medium">Erreur de chargement des ventes détail</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-center text-gray-500">
          <p className="font-medium">Aucune vente au détail trouvée</p>
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
                Montant total
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.map((sale, index) => (
              <React.Fragment key={`sale-${sale.id}`}>
                <tr
                  key={sale.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <button
                      onClick={() => toggleRow(index)}
                      className="p-1 hover:bg-gray-100 rounded"
                      disabled={sale.purchases.length === 0}
                    >
                      {sale.purchases.length > 0 ? (
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
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {sale.fullName}
                        </p>
                        <p className="text-sm text-gray-500">ID: {sale.id}</p>
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
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-gray-900">
                        {formatAmount(sale.totalAmount)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <button className="px-4 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors">
                      Voir détails
                    </button>
                  </td>
                </tr>

                {expandedRows.includes(index) && sale.purchases.length > 0 && (
                  <tr key={`expanded-${sale.id}`} className="bg-blue-50">
                    <td colSpan={5} className="p-6">
                      <div className="bg-white rounded-lg border border-blue-100 overflow-hidden">
                        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                          <h4 className="font-medium text-blue-800">
                            Engins achetés ({sale.purchases.length})
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
                            <tbody className="divide-y divide-gray-100">
                              {sale.purchases.map((purchase, pIndex) => (
                                <tr
                                  key={`${sale.id}-purchase-${pIndex}`}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="py-3 px-4">
                                    <span className="font-mono text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {purchase.plateNumber}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="font-medium">
                                        {purchase.brand}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {purchase.model}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                      {purchase.energy}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-sm">
                                    {purchase.manufactureYear}
                                  </td>
                                  <td className="py-3 px-4 text-sm">
                                    {purchase.circulationYear}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-4 h-4 rounded border"
                                        style={{
                                          backgroundColor:
                                            purchase.color.toLowerCase(),
                                        }}
                                      />
                                      <span className="text-sm">
                                        {purchase.color}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-sm">
                                    {purchase.fiscalPower} CV
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                      {purchase.usage}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="font-mono text-sm">
                                      {purchase.engineNumber}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="font-mono text-sm">
                                      {purchase.chassisNumber}
                                    </span>
                                  </td>
                                </tr>
                              ))}
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

export default DetailTable;
