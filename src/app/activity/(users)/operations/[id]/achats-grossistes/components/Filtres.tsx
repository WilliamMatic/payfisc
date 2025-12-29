import { Search, Calendar, Filter, ArrowUpDown, Download } from "lucide-react";
import { ViewMode } from "../types";

interface FiltresProps {
  dateDebut: string;
  setDateDebut: (value: string) => void;
  dateFin: string;
  setDateFin: (value: string) => void;
  recherche: string;
  setRecherche: (value: string) => void;
  selectedPlaque: string;
  setSelectedPlaque: (value: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isPending: boolean;
  loading: boolean;
  appliquerFiltres: () => void;
  reinitialiserFiltres: () => void;
  exporterDonnees: () => void;
}

export default function Filtres({
  dateDebut,
  setDateDebut,
  dateFin,
  setDateFin,
  recherche,
  setRecherche,
  selectedPlaque,
  setSelectedPlaque,
  viewMode,
  setViewMode,
  isPending,
  loading,
  appliquerFiltres,
  reinitialiserFiltres,
  exporterDonnees
}: FiltresProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtres de Recherche
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode(viewMode === "grouped" ? "list" : "grouped")}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Vue {viewMode === "grouped" ? "Liste" : "Groupée"}</span>
          </button>
          <button
            onClick={exporterDonnees}
            disabled={isPending || loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>{isPending ? "Exportation..." : "Exporter"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date de début */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de début
          </label>
          <div className="relative">
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Date de fin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de fin
          </label>
          <div className="relative">
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Recherche par nom/téléphone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom / Téléphone
          </label>
          <div className="relative">
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher..."
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Recherche par plaque */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numéro de plaque
          </label>
          <input
            type="text"
            value={selectedPlaque}
            onChange={(e) => setSelectedPlaque(e.target.value)}
            placeholder="Ex: AA001, CD500..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={reinitialiserFiltres}
          disabled={isPending || loading}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Réinitialisation..." : "Réinitialiser"}
        </button>
        <button
          onClick={appliquerFiltres}
          disabled={isPending || loading}
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Application..." : "Appliquer les filtres"}
        </button>
      </div>
    </div>
  );
}