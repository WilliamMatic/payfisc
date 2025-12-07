'use client';
import { useState, useEffect } from 'react';
import { 
  Car, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Users, 
  FileText,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getStatistiquesImmatriculation, 
  getDetailsImmatriculation,
  exporterStatistiquesPDF,
  exporterStatistiquesExcel,
  type StatistiquesImmatriculation,
  type DetailImmatriculation,
  type FiltresStatistiques
} from '@/services/immatriculation/statistiquesService';

interface DashboardClientProps {
  statsData: any;
  utilisateur: any;
}

export default function DashboardImmatriculationClient({ statsData, utilisateur }: DashboardClientProps) {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [statistiques, setStatistiques] = useState<StatistiquesImmatriculation | null>(null);
  const [details, setDetails] = useState<DetailImmatriculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filtres, setFiltres] = useState<FiltresStatistiques>({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Charger les statistiques initiales
  useEffect(() => {
    chargerStatistiques();
    chargerDetails();
  }, [filtres]);

  const chargerStatistiques = async () => {
    setLoading(true);
    try {
      const result = await getStatistiquesImmatriculation(filtres);
      if (result.status === 'success' && result.data) {
        setStatistiques(result.data);
      } else {
        setError(result.message || 'Erreur lors du chargement des statistiques');
      }
    } catch (error) {
      setError('Erreur réseau lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const chargerDetails = async (page = 1) => {
    const offset = (page - 1) * pagination.limit;
    try {
      const result = await getDetailsImmatriculation({
        ...filtres,
        limit: pagination.limit,
        offset: offset
      });
      if (result.status === 'success' && result.data) {
        setDetails(result.data.immatriculations);
        setPagination({
          ...pagination,
          currentPage: page,
          totalPages: result.data.total_pages,
          totalCount: result.data.total_count
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const result = await exporterStatistiquesPDF(filtres);
      if (result.status === 'success' && result.data) {
        // Télécharger le PDF
        window.open(`${process.env.NEXT_PUBLIC_API_URL}${result.data.url}`, '_blank');
        setSuccessMessage('PDF exporté avec succès');
      } else {
        setError(result.message || 'Erreur lors de l\'export PDF');
      }
    } catch (error) {
      setError('Erreur lors de l\'export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const result = await exporterStatistiquesExcel(filtres);
      if (result.status === 'success' && result.data) {
        // Télécharger l'Excel
        window.open(`${process.env.NEXT_PUBLIC_API_URL}${result.data.url}`, '_blank');
        setSuccessMessage('Excel exporté avec succès');
      } else {
        setError(result.message || 'Erreur lors de l\'export Excel');
      }
    } catch (error) {
      setError('Erreur lors de l\'export Excel');
    } finally {
      setExporting(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      chargerDetails(page);
    }
  };

  const CardStatistique = ({ title, value, icon: Icon, color, suffix = '' }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value} {suffix}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const renderStatistiquesGlobale = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <CardStatistique
        title="Total Immatriculations"
        value={statistiques?.total_immatriculations || 0}
        icon={Car}
        color="bg-blue-500"
      />
      <CardStatistique
        title="Montant Total"
        value={(statistiques?.total_montant || 0).toLocaleString()}
        icon={DollarSign}
        color="bg-green-500"
        suffix="$"
      />
      <CardStatistique
        title="Aujourd'hui"
        value={statistiques?.immatriculations_jour || 0}
        icon={Calendar}
        color="bg-orange-500"
      />
      <CardStatistique
        title="Ce Mois"
        value={statistiques?.immatriculations_mois || 0}
        icon={TrendingUp}
        color="bg-purple-500"
      />
    </div>
  );

  const renderGraphiques = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Types d'engins */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Types d'Engins</h3>
          <PieChart className="w-5 h-5 text-gray-500" />
        </div>
        <div className="space-y-3">
          {statistiques?.top_types_engins?.map((type, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{type.type_engin}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{type.count}</span>
                <span className="text-xs text-gray-500">({type.pourcentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modes de paiement */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Modes de Paiement</h3>
          <BarChart3 className="w-5 h-5 text-gray-500" />
        </div>
        <div className="space-y-3">
          {statistiques?.repartition_mode_paiement?.map((mode, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{mode.mode_paiement}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{mode.count}</span>
                <span className="text-xs text-gray-500">({mode.pourcentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTableDetails = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Dernières Immatriculations</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => chargerStatistiques()}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plaque
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Propriétaire
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {details.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.numero_plaque}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.nom_proprietaire} {item.prenom_proprietaire}</div>
                  <div className="text-xs text-gray-500">{item.telephone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.type_engin}</div>
                  <div className="text-xs text-gray-500">{item.marque}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.montant.toLocaleString()} $
                  </div>
                  <div className="text-xs text-gray-500">{item.mode_paiement}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.date_paiement}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Affichage de {((pagination.currentPage - 1) * pagination.limit) + 1} à{' '}
          {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} sur{' '}
          {pagination.totalCount} résultats
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-700">
            Page {pagination.currentPage} sur {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );

  const renderFiltres = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
        <Filter className="w-5 h-5 text-gray-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de début
          </label>
          <input
            type="date"
            value={filtres.date_debut || ''}
            onChange={(e) => setFiltres({ ...filtres, date_debut: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de fin
          </label>
          <input
            type="date"
            value={filtres.date_fin || ''}
            onChange={(e) => setFiltres({ ...filtres, date_fin: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type d'engin
          </label>
          <select
            value={filtres.type_engin || ''}
            onChange={(e) => setFiltres({ ...filtres, type_engin: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tous les types</option>
            <option value="Voiture">Voiture</option>
            <option value="Moto">Moto</option>
            <option value="Camion">Camion</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end space-x-3">
        <button
          onClick={() => setFiltres({})}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Réinitialiser
        </button>
        <button
          onClick={() => chargerStatistiques()}
          className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Appliquer
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Messages d'alerte */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{successMessage}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Immatriculation</h1>
            <p className="text-gray-600 mt-1">
              Statistiques et détails des immatriculations de véhicules
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{exporting ? 'Export...' : 'PDF'}</span>
            </button>
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Export...' : 'Excel'}</span>
            </button>
          </div>
        </div>

        {/* Statistiques globales */}
        {renderStatistiquesGlobale()}

        {/* Filtres */}
        {renderFiltres()}

        {/* Graphiques */}
        {renderGraphiques()}

        {/* Détails */}
        {renderTableDetails()}
      </div>
    </div>
  );
}