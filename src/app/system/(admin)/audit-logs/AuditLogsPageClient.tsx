"use client";

import { useState, useEffect, Suspense } from "react";
import AuditStatsCards from './components/AuditStatsCards';
import AuditLogsList from './components/AuditLogsList';
import AuditStatsCardsSkeleton from './components/AuditStatsCardsSkeleton';
import AuditLogsListSkeleton from './components/AuditLogsListSkeleton';

interface AuditLog {
  id: number;
  user_id: string;
  user_type: string;
  action: string;
  timestamp: string;
}

interface AuditStatsData {
  total: number;
  today: number;
  admin: number;
  agent: number;
  system: number;
}

interface AuditLogsPageClientProps {
  initialStats: AuditStatsData | null;
  initialAuditLogs: AuditLog[];
}

export default function AuditLogsPageClient({ 
  initialStats, 
  initialAuditLogs 
}: AuditLogsPageClientProps) {
  const [stats, setStats] = useState<AuditStatsData | null>(initialStats);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Fonction pour obtenir l'emoji par type d'utilisateur
  const getUserTypeEmoji = (userType: string): string => {
    const emojiMap: { [key: string]: string } = {
      admin: "👑",
      agent: "👤",
      utilisateur: "👥",
      system: "⚙️",
      default: "🔔",
    };
    return emojiMap[userType] || emojiMap["default"];
  };

  // Fonction pour obtenir la couleur par type d'utilisateur
  const getUserTypeColor = (userType: string): string => {
    const colorMap: { [key: string]: string } = {
      admin: "bg-purple-100 text-purple-800 border-purple-200",
      agent: "bg-blue-100 text-blue-800 border-blue-200",
      utilisateur: "bg-green-100 text-green-800 border-green-200",
      system: "bg-gray-100 text-gray-800 border-gray-200",
      default: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colorMap[userType] || colorMap["default"];
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} h`;
    } else if (diffDays === 1) {
      return "Hier";
    } else {
      return `Il y a ${diffDays} j`;
    }
  };

  // Fonction pour formater la date complète
  const formatFullDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrer les logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesFilter = filter === 'all' || log.user_type === filter;
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Statistiques en temps réel
  const realTimeStats = {
    total: auditLogs.length,
    today: auditLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length,
    admin: auditLogs.filter(log => log.user_type === 'admin').length,
    agent: auditLogs.filter(log => log.user_type === 'agent').length,
    system: auditLogs.filter(log => log.user_type === 'system').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📜 Historique des activités
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Suivez l'ensemble des activités et actions effectuées sur le système
          </p>
        </div>

        {/* Statistiques avec Suspense */}
        <Suspense fallback={<AuditStatsCardsSkeleton />}>
          <AuditStatsCards stats={stats || realTimeStats} />
        </Suspense>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  filter === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilter('admin')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  filter === 'admin' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👑 Administrateurs
              </button>
              <button
                onClick={() => setFilter('agent')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  filter === 'agent' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👤 Agents
              </button>
              <button
                onClick={() => setFilter('system')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  filter === 'system' 
                    ? 'bg-gray-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⚙️ Système
              </button>
            </div>
            
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Rechercher une action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
            </div>
          </div>
        </div>

        {/* En-tête de la liste */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Journal des activités
            {filter !== 'all' && (
              <span className="text-lg font-normal text-gray-600 ml-2">
                ({filteredLogs.length} résultats)
              </span>
            )}
          </h2>
          <div className="text-sm text-gray-500">
            {auditLogs.length} activités au total
          </div>
        </div>

        {/* Liste des logs avec Suspense */}
        <Suspense fallback={<AuditLogsListSkeleton />}>
          <AuditLogsList
            auditLogs={filteredLogs}
            getUserTypeEmoji={getUserTypeEmoji}
            getUserTypeColor={getUserTypeColor}
            formatDate={formatDate}
            formatFullDate={formatFullDate}
          />
        </Suspense>
      </div>
    </div>
  );
}