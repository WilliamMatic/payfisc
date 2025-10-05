'use client';
import { useState, useEffect } from 'react';
import { 
  DashboardStats,
  VerificationData,
  VerificationFilters,
  DeclarationDetails,
  getDashboardStats,
  getVerificationData,
  getDeclarationDetails
} from '@/services/dashboard/dashboardService';
import { analyzeTaxDataWithGemini } from '@/services/ia/geminiService';
import { getIAData } from '@/services/dashboard/iaService';

import DashboardHeader from './DashboardHeader';
import DashboardChiffre from './DashboardChiffre';
import VerificationTable from './VerificationTable';
import AISearch from './AISearch';
import AlertMessage from './AlertMessage';
import DashboardModals from './DashboardModals';

interface DashboardClientProps {
  initialStats: DashboardStats | null;
  initialTaxNames: string[];
  initialError: string | null;
}

export default function DashboardClient({ 
  initialStats, 
  initialTaxNames, 
  initialError 
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(initialStats);
  const [taxData, setTaxData] = useState<VerificationData[]>([]);
  const [uniqueTaxNames, setUniqueTaxNames] = useState<string[]>(initialTaxNames);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTaxType, setFilterTaxType] = useState('all');
  const [filterTaxpayerType, setFilterTaxpayerType] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [filterPaymentPlace, setFilterPaymentPlace] = useState('all');
  const [filterDeclaration, setFilterDeclaration] = useState('all');
  
  // IA
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  
  // Modals
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState<DeclarationDetails | null>(null);

  // Charger les données lorsque les filtres changent
  useEffect(() => {
    if (activeTab === 'checking') {
      loadVerificationData();
    }
  }, [activeTab, searchTerm, filterStatus, filterTaxType, filterTaxpayerType, 
      filterPaymentMethod, filterPaymentPlace, filterDeclaration, startDate, endDate]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const statsResult = await getDashboardStats(startDate || undefined, endDate || undefined);
      if (statsResult.status === 'success') {
        setStats(statsResult.data);
      } else {
        setError(statsResult.message || 'Erreur lors du chargement des statistiques');
      }
      
      setError(null);
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors du chargement des données:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVerificationData = async () => {
    try {
      setLoading(true);
      
      const filters: VerificationFilters = {
        search: searchTerm,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        tax_type: filterTaxType !== 'all' ? filterTaxType : undefined,
        taxpayer_type: filterTaxpayerType !== 'all' ? filterTaxpayerType : undefined,
        payment_method: filterPaymentMethod !== 'all' ? filterPaymentMethod : undefined,
        payment_place: filterPaymentPlace !== 'all' ? filterPaymentPlace : undefined,
        declaration_status: filterDeclaration !== 'all' ? filterDeclaration : undefined,
        start_date: startDate,
        end_date: endDate
      };
      
      const result = await getVerificationData(filters);
      
      if (result.status === 'success') {
        setTaxData(result.data);
      } else {
        setError(result.message || 'Erreur lors du chargement des données de vérification');
      }
      
      setError(null);
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors du chargement des données de vérification:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDeclarationDetails = async (declarationId: number) => {
    try {
      const result = await getDeclarationDetails(declarationId);
      if (result.status === 'success') {
        setSelectedDeclaration(result.data);
        setShowDetailsModal(true);
      } else {
        setError(result.message || 'Erreur lors du chargement des détails');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors du chargement des détails:', err);
    }
  };

  const applyDateFilter = () => {
    loadInitialData();
    if (activeTab === 'checking') {
      loadVerificationData();
    }
  };

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    
    setIsLoadingAi(true);
    setAiResponse('');
    
    try {
      const dataResult = await getIAData();
      
      if (dataResult.status === 'error') {
        setError(dataResult.message || 'Erreur lors de la récupération des données');
        setIsLoadingAi(false);
        return;
      }
      
      const geminiResult = await analyzeTaxDataWithGemini(aiQuery, dataResult.data);
      
      if (geminiResult.status === 'success') {
        setAiResponse(geminiResult.data);
      } else {
        setError(geminiResult.message || 'Erreur lors de l\'analyse par l\'IA');
      }
    } catch (error: any) {
      setError('Erreur lors de la recherche IA: ' + error.message);
      console.error('Erreur lors de la recherche IA:', error);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const resetFilters = () => {
    setFilterStatus('all');
    setFilterTaxType('all');
    setFilterTaxpayerType('all');
    setFilterPaymentMethod('all');
    setFilterPaymentPlace('all');
    setFilterDeclaration('all');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  // Effacer les messages après un délai
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex flex-col">
      <AlertMessage error={error} successMessage={successMessage} />
      
      <DashboardHeader 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFilterClick={() => setShowFilterModal(true)}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApplyDateFilter={applyDateFilter}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <DashboardChiffre 
            stats={stats}
            loading={loading}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onApplyDateFilter={applyDateFilter}
          />
        )}
        
        {activeTab === 'checking' && (
          <VerificationTable
            taxData={taxData}
            loading={loading}
            onViewDetails={loadDeclarationDetails}
          />
        )}
        
        {activeTab === 'ai-search' && (
          <AISearch
            aiQuery={aiQuery}
            aiResponse={aiResponse}
            isLoadingAi={isLoadingAi}
            onQueryChange={setAiQuery}
            onAiSearch={handleAiSearch}
          />
        )}
      </main>

      <DashboardModals
        showFilterModal={showFilterModal}
        showDetailsModal={showDetailsModal}
        selectedDeclaration={selectedDeclaration}
        uniqueTaxNames={uniqueTaxNames}
        filters={{
          status: filterStatus,
          taxType: filterTaxType,
          taxpayerType: filterTaxpayerType,
          paymentMethod: filterPaymentMethod,
          paymentPlace: filterPaymentPlace,
          declaration: filterDeclaration,
          startDate,
          endDate
        }}
        onFilterClose={() => setShowFilterModal(false)}
        onDetailsClose={() => {
          setShowDetailsModal(false);
          setSelectedDeclaration(null);
        }}
        onFilterChange={(filters) => {
          setFilterStatus(filters.status);
          setFilterTaxType(filters.taxType);
          setFilterTaxpayerType(filters.taxpayerType);
          setFilterPaymentMethod(filters.paymentMethod);
          setFilterPaymentPlace(filters.paymentPlace);
          setFilterDeclaration(filters.declaration);
          setStartDate(filters.startDate);
          setEndDate(filters.endDate);
        }}
        onResetFilters={resetFilters}
        onApplyFilters={() => {
          loadVerificationData();
          setShowFilterModal(false);
        }}
      />
    </div>
  );
}