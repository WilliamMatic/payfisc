'use client';
import { useState, useEffect } from 'react';
import { 
  Home, Bell, CreditCard, FileText, Download, 
  Calendar, Filter, Search, PieChart, BarChart3,
  TrendingUp, AlertTriangle, CheckCircle, Clock,
  LogOut, Settings, User, Eye, EyeOff
} from 'lucide-react';

// Données simulées pour la démonstration
const mockTaxData = [
  {
    id: 1,
    name: "Impôt sur le revenu",
    type: "Revenu",
    amountDue: 3500,
    amountPaid: 2500,
    dueDate: "2023-12-15",
    status: "partially_paid",
    declarationStatus: "declared",
    penalties: 0
  },
  {
    id: 2,
    name: "Taxe foncière",
    type: "Propriété",
    amountDue: 1200,
    amountPaid: 0,
    dueDate: "2023-11-30",
    status: "overdue",
    declarationStatus: "not_declared",
    penalties: 75
  },
  {
    id: 3,
    name: "Contribution sociale",
    type: "Social",
    amountDue: 850,
    amountPaid: 850,
    dueDate: "2023-10-15",
    status: "paid",
    declarationStatus: "declared",
    penalties: 0
  },
  {
    id: 4,
    name: "Taxe d'habitation",
    type: "Propriété",
    amountDue: 650,
    amountPaid: 0,
    dueDate: "2024-01-15",
    status: "to_declare",
    declarationStatus: "not_declared",
    penalties: 0
  },
  {
    id: 5,
    name: "Impôt sur les sociétés",
    type: "Entreprise",
    amountDue: 5200,
    amountPaid: 5200,
    dueDate: "2023-09-30",
    status: "paid",
    declarationStatus: "declared",
    penalties: 0
  }
];

const mockHistoryData = [
  {
    id: 1,
    taxName: "Impôt sur le revenu",
    amountDeclared: 3500,
    amountPaid: 1000,
    declarationDate: "2023-10-05",
    paymentDate: "2023-10-10",
    paymentMethod: "Carte bancaire"
  },
  {
    id: 2,
    taxName: "Impôt sur le revenu",
    amountDeclared: 3500,
    amountPaid: 1500,
    declarationDate: "2023-10-05",
    paymentDate: "2023-11-05",
    paymentMethod: "Virement"
  },
  {
    id: 3,
    taxName: "Contribution sociale",
    amountDeclared: 850,
    amountPaid: 850,
    declarationDate: "2023-09-20",
    paymentDate: "2023-09-20",
    paymentMethod: "Prélèvement"
  },
  {
    id: 4,
    taxName: "Impôt sur les sociétés",
    amountDeclared: 5200,
    amountPaid: 5200,
    declarationDate: "2023-09-15",
    paymentDate: "2023-09-15",
    paymentMethod: "Virement"
  }
];

const mockNotifications = [
  {
    id: 1,
    title: "Échéance proche",
    message: "Votre taxe foncière est due le 30/11/2023",
    type: "warning",
    read: false,
    date: "2023-11-20"
  },
  {
    id: 2,
    title: "Pénalité appliquée",
    message: "Une pénalité de 75€ a été appliquée pour retard de paiement",
    type: "alert",
    read: false,
    date: "2023-11-15"
  },
  {
    id: 3,
    title: "Paiement confirmé",
    message: "Votre paiement de 1500€ pour l'impôt sur le revenu a été accepté",
    type: "success",
    read: true,
    date: "2023-11-05"
  }
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [taxData, setTaxData] = useState(mockTaxData);
  const [historyData, setHistoryData] = useState(mockHistoryData);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  
  // Calcul des statistiques
  const totalDue = taxData.reduce((sum, tax) => sum + tax.amountDue, 0);
  const totalPaid = taxData.reduce((sum, tax) => sum + tax.amountPaid, 0);
  const totalPenalties = taxData.reduce((sum, tax) => sum + tax.penalties, 0);
  const taxesToDeclare = taxData.filter(tax => tax.declarationStatus === "not_declared").length;
  
  // Correction des erreurs arithmétiques avec vérification de type Date
  const upcomingDeadlines = taxData.filter(tax => {
    const dueDate = new Date(tax.dueDate);
    const today = new Date();
    // Vérification que les deux sont des dates valides
    if (isNaN(dueDate.getTime()) || isNaN(today.getTime())) return false;
    
    const diffTime = Math.abs(dueDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && tax.status !== "paid";
  }).length;

  // Filtrer les données
  const filteredTaxData = taxData.filter(tax => {
    const matchesSearch = tax.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tax.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tax.status === filterStatus;
    const matchesType = filterType === 'all' || tax.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Marquer une notification comme lue
  const markAsRead = (id: number) => {
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    setNotifications(updatedNotifications);
    setUnreadNotifications(updatedNotifications.filter(n => !n.read).length);
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));
    setNotifications(updatedNotifications);
    setUnreadNotifications(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header avec nom du contribuable */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-bold text-[#153258]">Tableau de bord fiscal</h1>
              <p className="text-sm text-gray-600">Jean Dupont - N° fiscal: 12345678901</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              <button className="flex items-center space-x-2 text-gray-700">
                <User size={20} />
                <span>Mon compte</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              className={`py-3 font-medium text-sm border-b-2 ${
                activeTab === 'overview'
                  ? 'border-[#23A974] text-[#153258]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Tableau de bord
            </button>
            <button
              className={`py-3 font-medium text-sm border-b-2 ${
                activeTab === 'taxes'
                  ? 'border-[#23A974] text-[#153258]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('taxes')}
            >
              💰 Impôts et taxes
            </button>
            <button
              className={`py-3 font-medium text-sm border-b-2 ${
                activeTab === 'history'
                  ? 'border-[#23A974] text-[#153258]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('history')}
            >
              📅 Historique
            </button>
            <button
              className={`py-3 font-medium text-sm border-b-2 ${
                activeTab === 'stats'
                  ? 'border-[#23A974] text-[#153258]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('stats')}
            >
              📈 Statistiques
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content avec défilement vertical */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 overflow-y-auto">
        {/* Section Overview */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Résumé de ma situation fiscale</h2>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-700">Total dû</h3>
                  <AlertTriangle className="text-red-500" size={20} />
                </div>
                <p className="text-2xl font-bold text-red-600 mt-2">{totalDue.toLocaleString()} €</p>
                <p className="text-sm text-gray-500 mt-1">Montant total des impôts à payer</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-700">Total payé</h3>
                  <CheckCircle className="text-green-500" size={20} />
                </div>
                <p className="text-2xl font-bold text-green-600 mt-2">{totalPaid.toLocaleString()} €</p>
                <p className="text-sm text-gray-500 mt-1">Montant déjà réglé</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-700">À déclarer</h3>
                  <FileText className="text-orange-500" size={20} />
                </div>
                <p className="text-2xl font-bold text-orange-600 mt-2">{taxesToDeclare}</p>
                <p className="text-sm text-gray-500 mt-1">Impôts nécessitant une déclaration</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-700">Échéances proches</h3>
                  <Clock className="text-blue-500" size={20} />
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-2">{upcomingDeadlines}</p>
                <p className="text-sm text-gray-500 mt-1">Échéances dans les 30 jours</p>
              </div>
            </div>
            
            {/* Alertes importantes */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">⚠️ Alertes importantes</h3>
              </div>
              <div className="p-6">
                {taxData.filter(tax => tax.status === "overdue" || (new Date(tax.dueDate).getTime() < new Date().getTime() && tax.status !== "paid")).length > 0 ? (
                  <div className="space-y-4">
                    {taxData.filter(tax => tax.status === "overdue" || (new Date(tax.dueDate).getTime() < new Date().getTime() && tax.status !== "paid")).map(tax => (
                      <div key={tax.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="text-red-500" size={20} />
                          <div>
                            <p className="font-medium text-red-700">{tax.name} en retard</p>
                            <p className="text-sm text-red-600">Échéance: {new Date(tax.dueDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button className="text-sm bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700">
                          Payer maintenant
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-green-600 font-medium">✅ Aucune alerte importante. Votre situation est à jour.</p>
                )}
              </div>
            </div>
            
            {/* Impôts à déclarer rapidement */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">📋 Impôts à déclarer</h3>
              </div>
              <div className="p-6">
                {taxData.filter(tax => tax.declarationStatus === "not_declared").length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Impôt
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Échéance
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {taxData.filter(tax => tax.declarationStatus === "not_declared").map((tax) => (
                          <tr key={tax.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{tax.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{tax.type}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{new Date(tax.dueDate).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-[#23A974] hover:text-[#1c875d]">
                                Déclarer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-green-600 font-medium">✅ Toutes vos déclarations sont à jour.</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Section Taxes */}
        {activeTab === 'taxes' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">💰 Mes impôts et taxes</h2>
            
            {/* Filtres et recherche */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Rechercher un impôt..."
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#23A974] focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex space-x-4">
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#23A974] focus:border-transparent"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="to_declare">À déclarer</option>
                    <option value="partially_paid">Partiellement payé</option>
                    <option value="paid">Payé</option>
                    <option value="overdue">En retard</option>
                  </select>
                  
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#23A974] focus:border-transparent"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">Tous les types</option>
                    <option value="Revenu">Revenu</option>
                    <option value="Propriété">Propriété</option>
                    <option value="Social">Social</option>
                    <option value="Entreprise">Entreprise</option>
                  </select>
                  
                  <button className="flex items-center space-x-1 text-gray-600 border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50">
                    <Filter size={16} />
                    <span>Filtrer</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Tableau des impôts */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Impôt
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant dû
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant payé
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Échéance
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTaxData.map((tax) => (
                      <tr key={tax.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{tax.name}</div>
                              <div className="text-sm text-gray-500">{tax.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{tax.amountDue.toLocaleString()} €</div>
                          {tax.penalties > 0 && (
                            <div className="text-xs text-red-600">dont {tax.penalties} € de pénalités</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{tax.amountPaid.toLocaleString()} €</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{new Date(tax.dueDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(tax.dueDate).getTime() < new Date().getTime() ? (
                              <span className="text-red-600">Dépassée</span>
                            ) : (
                              `J-${Math.ceil((new Date(tax.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}`
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tax.status === "paid" ? "bg-green-100 text-green-800" :
                            tax.status === "partially_paid" ? "bg-blue-100 text-blue-800" :
                            tax.status === "overdue" ? "bg-red-100 text-red-800" :
                            "bg-orange-100 text-orange-800"
                          }`}>
                            {tax.status === "paid" ? "Payé" :
                             tax.status === "partially_paid" ? "Partiellement payé" :
                             tax.status === "overdue" ? "En retard" : "À déclarer"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {tax.declarationStatus === "not_declared" ? (
                              <button className="text-[#23A974] hover:text-[#1c875d]">
                                Déclarer
                              </button>
                            ) : tax.amountDue > tax.amountPaid ? (
                              <button className="text-blue-600 hover:text-blue-900">
                                Payer
                              </button>
                            ) : (
                              <button className="text-gray-600 hover:text-gray-900">
                                Reçu
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredTaxData.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Aucun impôt ne correspond à vos critères de recherche.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Section Historique */}
        {activeTab === 'history' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📅 Historique des déclarations et paiements</h2>
            
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800">Filtrer par année</h3>
                <select className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#23A974] focus:border-transparent">
                  <option>2023</option>
                  <option>2022</option>
                  <option>2021</option>
                </select>
              </div>
              
              <div className="divide-y divide-gray-200">
                {historyData.map((item) => (
                  <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-md font-medium text-gray-900">{item.taxName}</h4>
                        <p className="text-sm text-gray-500">
                          Déclaré le {new Date(item.declarationDate).toLocaleDateString()} | 
                          Payé le {new Date(item.paymentDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-md font-medium text-gray-900">{item.amountPaid.toLocaleString()} €</p>
                        <p className="text-sm text-gray-500">{item.paymentMethod}</p>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex justify-end">
                      <button className="flex items-center text-sm text-[#153258] hover:text-[#1e4377]">
                        <Download size={16} className="mr-1" />
                        Télécharger le reçu
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">📆 Calendrier des échéances</h3>
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <Calendar className="mx-auto text-gray-400" size={40} />
                  <p className="mt-2 text-gray-500">Intégration calendrier à venir</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">📊 Répartition des paiements</h3>
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <PieChart className="mx-auto text-gray-400" size={40} />
                  <p className="mt-2 text-gray-500">Graphique à venir</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Section Statistiques */}
        {activeTab === 'stats' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📈 Mes statistiques fiscales</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Répartition par type d'impôt</h3>
                  <PieChart className="text-[#23A974]" size={20} />
                </div>
                <div className="bg-gray-100 rounded-lg p-4 text-center h-64 flex items-center justify-center">
                  <div>
                    <PieChart className="mx-auto text-gray-400" size={40} />
                    <p className="mt-2 text-gray-500">Graphique camembert à venir</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Évolution des paiements</h3>
                  <TrendingUp className="text-[#23A974]" size={20} />
                </div>
                <div className="bg-gray-100 rounded-lg p-4 text-center h-64 flex items-center justify-center">
                  <div>
                    <BarChart3 className="mx-auto text-gray-400" size={40} />
                    <p className="mt-2 text-gray-500">Graphique historique à venir</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Comparatif montants payés vs en retard</h3>
                <BarChart3 className="text-[#23A974]" size={20} />
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center h-64 flex items-center justify-center">
                <div>
                  <BarChart3 className="mx-auto text-gray-400" size={40} />
                  <p className="mt-2 text-gray-500">Graphique comparatif à venir</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}