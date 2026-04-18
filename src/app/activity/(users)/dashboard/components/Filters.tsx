'use client';

import { useState, useEffect } from 'react';
import { Calendar, Search, Filter, RefreshCw } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";

type SaleType = 'all' | 'retail' | 'wholesale' | 'reproduction';

interface FiltersProps {
  onFilterChange: (filters: {
    startDate: string;
    endDate: string;
    plateNumber: string;
    saleType: SaleType;
  }) => void;
  loading?: boolean;
}

const Filters = ({ onFilterChange, loading = false }: FiltersProps) => {
  const { utilisateur } = useAuth();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    plateNumber: '',
    saleType: 'all' as SaleType,
  });

  const saleTypes: { value: SaleType; label: string }[] = [
    { value: 'all', label: 'Tous types' },
    { value: 'retail', label: 'Détail' },
    { value: 'wholesale', label: 'Grossiste' },
    { value: 'reproduction', label: 'Reproduction' },
  ];

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      startDate: '',
      endDate: '',
      plateNumber: '',
      saleType: 'all' as SaleType, // Correction ici
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  // Appliquer automatiquement les filtres lorsqu'ils changent
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  // Définir la date d'aujourd'hui par défaut
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const newFilters = { ...filters, startDate: today, endDate: today };
    setFilters(newFilters);
    onFilterChange(newFilters);
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#153258] to-[#1e4a7a] rounded-xl flex items-center justify-center">
            <Filter className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800">Filtres</h3>
            <p className="text-xs text-gray-400">Affinez vos résultats</p>
          </div>
        </div>
        {utilisateur && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            <span className="font-medium bg-gradient-to-r from-gray-50 to-blue-50 px-3 py-1.5 rounded-lg border border-gray-100 text-xs">
              {utilisateur.site_nom}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date de début */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              Date début
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#153258]/20 focus:border-[#153258] outline-none transition-all text-sm bg-gray-50/50"
                disabled={loading}
              />
            </div>
          </div>

          {/* Date de fin */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              Date fin
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#153258]/20 focus:border-[#153258] outline-none transition-all text-sm bg-gray-50/50"
                disabled={loading}
              />
            </div>
          </div>

          {/* Numéro de plaque */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              N° de plaque
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ex: 6AB123CD"
                value={filters.plateNumber}
                onChange={(e) => handleFilterChange('plateNumber', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#153258]/20 focus:border-[#153258] outline-none transition-all text-sm bg-gray-50/50"
                disabled={loading}
              />
            </div>
          </div>

          {/* Type de vente */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              Type de vente
            </label>
            <select
              value={filters.saleType}
              onChange={(e) => handleFilterChange('saleType', e.target.value as SaleType)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#153258]/20 focus:border-[#153258] outline-none transition-all text-sm bg-gray-50/50 appearance-none"
              disabled={loading}
            >
              {saleTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-gray-100">
          <button
            type="button"
            onClick={handleReset}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4" />
            Réinitialiser
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-[#153258] to-[#1e4a7a] text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Chargement...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Appliquer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Filters;