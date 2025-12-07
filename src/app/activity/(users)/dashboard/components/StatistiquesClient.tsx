'use client';
import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { 
  getStatistiquesBase, 
  getStatistiquesDetails,
  getEnginsListe,
  exporterStatistiquesExcel,
  type StatistiquesBase,
  type StatistiquesDetails,
  type EnginDetails,
  type FiltresStatistiques
} from '@/services/immatriculation/statistiquesService';
import { getTauxActif, type Taux } from '@/services/taux/tauxService';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Car, 
  Download,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Printer,
  Eye,
  FileText,
  PieChart,
  Users,
  Building,
  CreditCard,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import FactureA4 from './FactureA4';

interface StatistiquesClientProps {
  initialData: {
    taux: Taux | null;
    stats: StatistiquesBase | null;
  };
}

export default function StatistiquesClient({ initialData }: StatistiquesClientProps) {
  const { utilisateur, isLoading: authLoading } = useAuth();
  const [statistiquesBase, setStatistiquesBase] = useState<StatistiquesBase | null>(initialData.stats);
  const [statistiquesDetails, setStatistiquesDetails] = useState<StatistiquesDetails | null>(null);
  const [enginsListe, setEnginsListe] = useState<EnginDetails[]>([]);
  const [totalEngins, setTotalEngins] = useState(0);
  const [taux, setTaux] = useState<Taux | null>(initialData.taux);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingEngins, setLoadingEngins] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFacture, setShowFacture] = useState(false);
  const [selectedEngin, setSelectedEngin] = useState<EnginDetails | null>(null);

  // Filtres
  const [filtres, setFiltres] = useState<FiltresStatistiques>({
    date_debut: '',
    date_fin: '',
    type_engin: '',
    mode_paiement: '',
    limit: 10,
    offset: 0
  });

  // Charger le taux au démarrage
  useEffect(() => {
    const chargerTaux = async () => {
      if (!taux) {
        try {
          const tauxResponse = await getTauxActif();
          if (tauxResponse.status === "success" && tauxResponse.data) {
            setTaux(tauxResponse.data);
          }
        } catch (error) {
          console.error("Erreur lors du chargement du taux:", error);
        }
      }
    };

    chargerTaux();
  }, [taux]);

  // Charger les statistiques de base quand l'utilisateur est disponible
  useEffect(() => {
    if (utilisateur && !statistiquesBase) {
      chargerStatistiquesBase();
    }
  }, [utilisateur, statistiquesBase]);

  // Charger les statistiques de base
  const chargerStatistiquesBase = async () => {
    if (!utilisateur) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getStatistiquesBase(utilisateur);
      if (result.status === "success" && result.data) {
        setStatistiquesBase(result.data);
        // Charger également les détails
        chargerStatistiquesDetails();
        chargerEnginsListe();
      } else {
        setError(result.message || "Erreur lors du chargement des statistiques");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError("Erreur réseau lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques détaillées
  const chargerStatistiquesDetails = async () => {
    if (!utilisateur) return;

    setLoadingDetails(true);
    try {
      const result = await getStatistiquesDetails(filtres, utilisateur);
      if (result.status === "success" && result.data) {
        setStatistiquesDetails(result.data);
      }
    } catch (error) {
      console.error("Erreur détails:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Charger la liste des engins
  const chargerEnginsListe = async () => {
    if (!utilisateur) return;

    setLoadingEngins(true);
    try {
      const result = await getEnginsListe({
        ...filtres,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage
      }, utilisateur);
      
      if (result.status === "success" && result.data) {
        setEnginsListe(result.data);
        setTotalEngins(result.total || 0);
      }
    } catch (error) {
      console.error("Erreur liste engins:", error);
    } finally {
      setLoadingEngins(false);
    }
  };

  // Appliquer les filtres
  const appliquerFiltres = () => {
    setCurrentPage(1);
    chargerStatistiquesDetails();
    chargerEnginsListe();
    setShowFilters(false);
  };

  // Réinitialiser les filtres
  const reinitialiserFiltres = () => {
    setFiltres({
      date_debut: '',
      date_fin: '',
      type_engin: '',
      mode_paiement: '',
      limit: 10,
      offset: 0
    });
    setCurrentPage(1);
    chargerStatistiquesDetails();
    chargerEnginsListe();
    setShowFilters(false);
  };

  // Exporter en Excel
  const exporterExcel = async () => {
    if (!utilisateur) return;

    setLoading(true);
    try {
      const result = await exporterStatistiquesExcel(filtres, utilisateur);
      if (result.status === "success" && result.data) {
        // Télécharger le fichier
        window.open(result.data.url, '_blank');
        setSuccessMessage("Exportation réussie !");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.message || "Erreur lors de l'exportation");
      }
    } catch (error) {
      console.error("Erreur export:", error);
      setError("Erreur lors de l'exportation");
    } finally {
      setLoading(false);
    }
  };

  // Afficher la facture pour un engin
  const afficherFacture = (engin: EnginDetails) => {
    setSelectedEngin(engin);
    setShowFacture(true);
  };

  // Calculer les montants en francs
  const calculerMontantFrancs = (montantDollars: number) => {
    if (!taux) return 'N/A';
    return (montantDollars * taux.valeur).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' CDF';
  };

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(totalEngins / itemsPerPage);

  // Afficher un écran de chargement pendant l'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Chargement...
          </h2>
          <p className="text-gray-600">
            Veuillez patienter pendant que nous vérifions vos accès.
          </p>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur connecté
  if (!utilisateur) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Session expirée
          </h2>
          <p className="text-gray-600 mb-6">
            Veuillez vous reconnecter pour accéder aux statistiques.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Tableau de Bord - Statistiques
                </h1>
                <p className="text-gray-600 mt-1">
                  Suivez les performances et les tendances des immatriculations
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exporterExcel}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Exporter Excel</span>
              </button>
              <button
                onClick={chargerStatistiquesBase}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filtres</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date début
                    </label>
                    <input
                      type="date"
                      value={filtres.date_debut}
                      onChange={(e) => setFiltres({ ...filtres, date_debut: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date fin
                    </label>
                    <input
                      type="date"
                      value={filtres.date_fin}
                      onChange={(e) => setFiltres({ ...filtres, date_fin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type d'engin
                    </label>
                    <select
                      value={filtres.type_engin}
                      onChange={(e) => setFiltres({ ...filtres, type_engin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tous les types</option>
                      <option value="Voiture">Voiture</option>
                      <option value="Moto">Moto</option>
                      <option value="Camion">Camion</option>
                      <option value="Bus">Bus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mode paiement
                    </label>
                    <select
                      value={filtres.mode_paiement}
                      onChange={(e) => setFiltres({ ...filtres, mode_paiement: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tous les modes</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="espece">Espèce</option>
                      <option value="cheque">Chèque</option>
                      <option value="banque">Banque</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={reinitialiserFiltres}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Réinitialiser
                  </button>
                  <button
                    onClick={appliquerFiltres}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Messages d'erreur/succès */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-red-600">⚠️</div>
                <div>
                  <h4 className="font-semibold text-red-800">Erreur</h4>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-green-600">✅</div>
                <div>
                  <h4 className="font-semibold text-green-800">Succès</h4>
                  <p className="text-green-700 text-sm mt-1">{successMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistiques de base */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : statistiquesBase && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Carte 1: Total des immatriculations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Car className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm text-green-600 font-medium">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  +12%
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {statistiquesBase.total_immatriculations.toLocaleString()}
              </h3>
              <p className="text-gray-600 text-sm">Total des immatriculations</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Ce mois: {statistiquesBase.immatriculations_mois.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Carte 2: Total des revenus */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-sm text-green-600 font-medium">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  +8%
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {statistiquesBase.total_revenus.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} $
              </h3>
              <p className="text-gray-600 text-sm">Total des revenus</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Ce mois: {statistiquesBase.revenus_mois.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} $
                </div>
                {taux && (
                  <div className="text-xs text-gray-500 mt-1">
                    ≈ {calculerMontantFrancs(statistiquesBase.revenus_mois)}
                  </div>
                )}
              </div>
            </div>

            {/* Carte 3: Taux de croissance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div className={`text-sm font-medium ${
                  statistiquesDetails?.statistiques_generales.taux_croissance >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {statistiquesDetails?.statistiques_generales.taux_croissance >= 0 ? '↑' : '↓'}
                  {Math.abs(statistiquesDetails?.statistiques_generales.taux_croissance || 0)}%
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {statistiquesDetails?.statistiques_generales.taux_croissance || 0}%
              </h3>
              <p className="text-gray-600 text-sm">Taux de croissance mensuel</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Par rapport au mois dernier
                </div>
              </div>
            </div>

            {/* Carte 4: Moyenne par transaction */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-sm text-green-600 font-medium">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  +5%
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {statistiquesDetails?.statistiques_generales.moyenne_revenus.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} $
              </h3>
              <p className="text-gray-600 text-sm">Moyenne par transaction</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Montant moyen par immatriculation
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques détaillées */}
        {loadingDetails ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : statistiquesDetails && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Graphique des tendances */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tendances des 7 derniers jours
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Immatriculations</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Revenus ($)</span>
                  </div>
                </div>
              </div>
              <div className="h-64">
                {/* Simple bar chart - vous pouvez utiliser une bibliothèque comme recharts */}
                <div className="flex items-end justify-between h-48 px-4">
                  {statistiquesDetails.tendances.map((tendance, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="flex items-end space-x-1 mb-2">
                        <div 
                          className="w-6 bg-blue-500 rounded-t"
                          style={{ height: `${Math.min(tendance.immatriculations * 10, 100)}px` }}
                        ></div>
                        <div 
                          className="w-6 bg-green-500 rounded-t"
                          style={{ height: `${Math.min(tendance.revenus / 10, 100)}px` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 rotate-45 origin-left">
                        {tendance.periode}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Répartition par type d'engin */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Répartition par type d'engin
                </h3>
                <PieChart className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {statistiquesDetails.statistiques_par_type.map((type, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                        }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">
                        {type.type_engin}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {type.count} ({type.pourcentage}%)
                      </div>
                      <div className="text-xs text-gray-500">
                        {type.revenus.toLocaleString('fr-FR')} $
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistiques par mode de paiement */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Mode de paiement
                </h3>
                <CreditCard className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {statistiquesDetails.statistiques_par_mode_paiement.map((mode, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {mode.mode_paiement}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {mode.count} ({mode.pourcentage}%)
                      </div>
                      <div className="text-xs text-gray-500">
                        {mode.montant_total.toLocaleString('fr-FR')} $
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistiques par site (admin seulement) */}
            {statistiquesDetails.statistiques_par_site.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Performance par site
                  </h3>
                  <Building className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  {statistiquesDetails.statistiques_par_site.map((site, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Building className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            {site.site_nom}
                          </span>
                          <div className="text-xs text-gray-500">
                            {site.pourcentage}% du total
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {site.count}
                        </div>
                        <div className="text-xs text-gray-500">
                          {site.revenus.toLocaleString('fr-FR')} $
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Liste des engins */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Dernières immatriculations
            </h3>
            <div className="text-sm text-gray-500">
              Total: {totalEngins} engins
            </div>
          </div>

          {loadingEngins ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plaque
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Propriétaire
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enginsListe.map((engin) => (
                      <tr key={engin.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-blue-700">
                            {engin.numero_plaque}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{engin.type_engin}</div>
                          <div className="text-xs text-gray-500">{engin.marque}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {engin.particulier_nom} {engin.particulier_prenom}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(engin.date_immatriculation).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(engin.date_immatriculation).toLocaleTimeString('fr-FR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {engin.montant_paiement.toLocaleString('fr-FR')} $
                          </div>
                          {taux && (
                            <div className="text-xs text-gray-500">
                              {calculerMontantFrancs(engin.montant_paiement)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            engin.mode_paiement === 'mobile_money' 
                              ? 'bg-purple-100 text-purple-800'
                              : engin.mode_paiement === 'espece'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {engin.mode_paiement.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => afficherFacture(engin)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Voir facture"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Imprimer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} sur {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Section informations */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900">Informations</h4>
            </div>
            <p className="text-sm text-blue-800">
              Les statistiques sont mises à jour en temps réel. Utilisez les filtres pour affiner votre analyse.
            </p>
          </div>

          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-green-900">Performance</h4>
            </div>
            <p className="text-sm text-green-800">
              Suivez les tendances pour optimiser vos stratégies d'immatriculation.
            </p>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Download className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-purple-900">Export</h4>
            </div>
            <p className="text-sm text-purple-800">
              Exportez vos données en format Excel pour des analyses approfondies.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Facture */}
      {showFacture && selectedEngin && (
        <FactureA4
          factureData={{
            nom: selectedEngin.particulier_nom,
            prenom: selectedEngin.particulier_prenom,
            telephone: '',
            email: '',
            adresse: '',
            montant: selectedEngin.montant_paiement,
            montant_initial: selectedEngin.montant_paiement,
            mode_paiement: selectedEngin.mode_paiement,
            operateur: '',
            numero_transaction: '',
            date_paiement: selectedEngin.date_immatriculation,
            nombre_plaques: 1,
            site_nom: selectedEngin.site_nom,
            caissier: '',
            numeros_plaques: [selectedEngin.numero_plaque],
            montant_francs: calculerMontantFrancs(selectedEngin.montant_paiement),
            nif: ''
          }}
          onClose={() => {
            setShowFacture(false);
            setSelectedEngin(null);
          }}
        />
      )}
    </div>
  );
}

// Composant Info pour l'icône
const Info = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);