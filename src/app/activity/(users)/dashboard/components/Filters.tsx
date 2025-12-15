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
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filtres</h3>
        </div>
        {utilisateur && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Site:</span>
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
              {utilisateur.site_nom}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date de début */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Date début
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={loading}
              />
            </div>
          </div>

          {/* Date de fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Date fin
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={loading}
              />
            </div>
          </div>

          {/* Numéro de plaque */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔢 Numéro de plaque
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ex: 6AB123CD"
                value={filters.plateNumber}
                onChange={(e) => handleFilterChange('plateNumber', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={loading}
              />
            </div>
          </div>

          {/* Type de vente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏷 Type de vente
            </label>
            <select
              value={filters.saleType}
              onChange={(e) => handleFilterChange('saleType', e.target.value as SaleType)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4" />
            Réinitialiser
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Chargement...
              </>
            ) : (
              'Appliquer les filtres'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Filters;