'use client';
import { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { RapportSeries, Province } from '@/services/plaques/plaqueService';

interface RapportSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  provinces: Province[];
  onGenererRapport: (params: { date_debut: string; date_fin: string; province_id?: number }) => Promise<void>;
  rapportData: any; // Changé de RapportSeries | null à any pour gérer la structure API
  loading: boolean;
}

export default function RapportSeriesModal({ 
  isOpen, 
  onClose, 
  provinces, 
  onGenererRapport, 
  rapportData, 
  loading 
}: RapportSeriesModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState({
    date_debut: '',
    date_fin: '',
    province_id: ''
  });

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Rapport-Series-${new Date().toISOString().split('T')[0]}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body * {
          visibility: hidden;
        }
        .rapport-content, .rapport-content * {
          visibility: visible;
        }
        .rapport-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenererRapport({
      date_debut: filters.date_debut,
      date_fin: filters.date_fin,
      province_id: filters.province_id ? parseInt(filters.province_id) : undefined
    });
  };

  // Extraction des données réelles depuis la structure API
  const realRapportData = rapportData?.data?.data || rapportData?.data || rapportData;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-6xl mx-auto my-8 p-6 shadow-2xl border border-gray-100">
        {/* En-tête avec boutons */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Rapport des Séries de Plaques</h3>
          <div className="flex space-x-2">
            {realRapportData && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors no-print"
              >
                Imprimer
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors no-print"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 no-print">
          <h4 className="font-semibold text-gray-800 mb-3">Filtres du Rapport</h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Début
              </label>
              <input
                type="date"
                value={filters.date_debut}
                onChange={(e) => setFilters({...filters, date_debut: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Fin
              </label>
              <input
                type="date"
                value={filters.date_fin}
                onChange={(e) => setFilters({...filters, date_fin: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province
              </label>
              <select
                value={filters.province_id}
                onChange={(e) => setFilters({...filters, province_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                <option value="">Toutes les provinces</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Génération...' : 'Générer Rapport'}
              </button>
            </div>
          </form>
        </div>

        {/* Contenu du rapport */}
        {realRapportData && (
          <div 
            ref={contentRef} 
            className="rapport-content bg-white p-6 mx-auto border border-gray-200"
            style={{ 
              width: '210mm',
              minHeight: '297mm',
            }}
          >
            {/* En-tête du rapport */}
            <div className="text-center border-b border-gray-300 pb-4 mb-6">
              <h1 className="text-xl font-bold text-gray-900">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h1>
              <h2 className="text-lg font-semibold text-gray-800 mt-1">TSC-NPS</h2>
              <p className="text-sm text-gray-600 mt-1">RAPPORT DES SÉRIES DE PLAQUES</p>
              <p className="text-xs text-gray-500 mt-2">
                Période du {new Date(realRapportData.periode_debut).toLocaleDateString('fr-FR')} 
                au {new Date(realRapportData.periode_fin).toLocaleDateString('fr-FR')}
                {realRapportData.province_nom && ` - Province: ${realRapportData.province_nom}`}
              </p>
            </div>

            {/* Statistiques principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{realRapportData.total_series}</div>
                <div className="text-blue-600 text-sm">Séries totales</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{realRapportData.series_actives}</div>
                <div className="text-green-600 text-sm">Séries actives</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-700">{realRapportData.total_plaques}</div>
                <div className="text-orange-600 text-sm">Plaques totales</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">{realRapportData.plaques_utilisees}</div>
                <div className="text-purple-600 text-sm">Plaques utilisées</div>
              </div>
            </div>

            {/* Répartition par province */}
            {realRapportData.series_par_province && realRapportData.series_par_province.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-3 border-b pb-2">
                  RÉPARTITION PAR PROVINCE
                </h3>
                <table className="w-full border-collapse border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left">Province</th>
                      <th className="border border-gray-300 p-2 text-center">Séries</th>
                      <th className="border border-gray-300 p-2 text-center">Plaques</th>
                    </tr>
                  </thead>
                  <tbody>
                    {realRapportData.series_par_province.map((province: any, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 p-2">{province.province_nom} ({province.province_code})</td>
                        <td className="border border-gray-300 p-2 text-center">{province.total_series}</td>
                        <td className="border border-gray-300 p-2 text-center">{province.total_plaques}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Détails des séries */}
            <div className="mb-6">
              <h3 className="font-bold text-lg text-gray-900 mb-3 border-b pb-2">
                DÉTAILS DES SÉRIES ({realRapportData.details_series ? realRapportData.details_series.length : 0})
              </h3>
              {realRapportData.details_series && realRapportData.details_series.length > 0 ? (
                <table className="w-full border-collapse border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left">Série</th>
                      <th className="border border-gray-300 p-2 text-left">Province</th>
                      <th className="border border-gray-300 p-2 text-center">Date Création</th>
                      <th className="border border-gray-300 p-2 text-center">Statut</th>
                      <th className="border border-gray-300 p-2 text-center">Plaques Total</th>
                      <th className="border border-gray-300 p-2 text-center">Disponibles</th>
                      <th className="border border-gray-300 p-2 text-center">Utilisées</th>
                    </tr>
                  </thead>
                  <tbody>
                    {realRapportData.details_series.map((serie: any, index: number) => (
                      <tr key={serie.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 p-2 font-mono font-bold">{serie.nom_serie}</td>
                        <td className="border border-gray-300 p-2">{serie.province_nom}</td>
                        <td className="border border-gray-300 p-2 text-center">
                          {new Date(serie.date_creation).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            serie.actif 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {serie.actif ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="border border-gray-300 p-2 text-center">{serie.total_items}</td>
                        <td className="border border-gray-300 p-2 text-center text-green-600">{serie.items_disponibles}</td>
                        <td className="border border-gray-300 p-2 text-center text-red-600">{serie.items_utilises}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500 py-4">Aucune série trouvée pour cette période</p>
              )}
            </div>

            {/* Pied de page */}
            <div className="border-t border-gray-300 pt-4 text-center text-xs text-gray-600">
              <p className="font-semibold">Document généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
              <div className="mt-4 flex justify-between items-start">
                <div className="text-left">
                  <p className="font-semibold">Cachet et signature</p>
                  <div className="mt-8 border-t border-gray-400 w-32"></div>
                  <p className="text-xs mt-1">TSC-NPS</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Responsable</p>
                  <div className="mt-8 border-t border-gray-400 w-32 ml-auto"></div>
                  <p className="text-xs mt-1">Service des Plaques</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Génération du rapport en cours...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}