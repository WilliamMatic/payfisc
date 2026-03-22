import { Car, Search, Plus, FileText, RefreshCw } from 'lucide-react';

export default function SeriesLoading() {
  return (
    <div className="h-full flex flex-col">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <div className="bg-[#2D5B7A] p-2.5 rounded-lg mr-3">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Gestion des Plaques</h2>
            <p className="text-sm text-gray-500">Gérez les séries de plaques d&apos;immatriculation</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <div className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 w-full h-[42px]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2 px-4 py-2.5 bg-gray-100 rounded-lg opacity-50">
              <RefreshCw className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-sm text-gray-400 hidden sm:inline">Rafraîchir</span>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2.5 bg-green-600/50 rounded-lg">
              <FileText className="w-4 h-4 text-white/50" />
              <span className="font-medium text-sm text-white/50">Rapport</span>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2.5 bg-[#2D5B7A]/50 rounded-lg">
              <Plus className="w-4 h-4 text-white/50" />
              <span className="font-medium text-sm text-white/50">Nouvelle Série</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Série &amp; Province</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plage Numérique</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Disponibilité</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Création</th>
                <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-5 py-4">
                    <div className="flex items-center">
                      <div className="bg-blue-50 p-2 rounded-lg mr-3 w-8 h-8" />
                      <div className="space-y-2">
                        <div className="h-5 w-12 bg-gray-200 rounded" />
                        <div className="h-3 w-24 bg-gray-100 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><div className="h-4 w-32 bg-gray-100 rounded" /></td>
                  <td className="px-5 py-4"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                  <td className="px-5 py-4"><div className="h-6 w-28 bg-gray-100 rounded-full" /></td>
                  <td className="px-5 py-4"><div className="h-6 w-16 bg-gray-100 rounded-full" /></td>
                  <td className="px-5 py-4"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                  <td className="px-5 py-4"><div className="flex justify-center space-x-1"><div className="h-8 w-8 bg-gray-100 rounded-lg" /><div className="h-8 w-8 bg-gray-100 rounded-lg" /><div className="h-8 w-8 bg-gray-100 rounded-lg" /><div className="h-8 w-8 bg-gray-100 rounded-lg" /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
