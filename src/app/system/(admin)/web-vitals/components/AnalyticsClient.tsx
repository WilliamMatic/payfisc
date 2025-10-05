"use client";

import { useState } from "react";

interface GlobalStats {
  total_metrics: number;
  total_sessions: number;
  total_pages: number;
  total_problems: number;
  average_performance: number;
  worst_performance: number;
}

interface MetricDetail {
  metric_name: string;
  occurrences: number;
  average_value: number;
  max_value: number;
  min_value: number;
  problems_count: number;
}

interface RecurrentProblem {
  metric_name: string;
  description: string;
  problem_count: number;
  average_value: number;
}

interface AnalyticsStats {
  global_stats: GlobalStats;
  metrics_details: MetricDetail[];
  recurrent_problems: RecurrentProblem[];
  performance_score: number;
  performance_status: string;
}

interface AnalyticsClientProps {
  statsData: AnalyticsStats;
}

export default function AnalyticsClient({ statsData }: AnalyticsClientProps) {
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const handleDateFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (dateRange.startDate && dateRange.endDate) {
      const url = new URL(window.location.href);
      url.searchParams.set("start_date", dateRange.startDate);
      url.searchParams.set("end_date", dateRange.endDate);
      window.location.href = url.toString();
    }
  };

  const clearFilters = () => {
    window.location.href = "/web-vitals";
  };

  const {
    global_stats,
    metrics_details,
    recurrent_problems,
    performance_score,
    performance_status,
  } = statsData;

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-500 text-white";
    if (score >= 80) return "from-blue-500 to-cyan-500 text-white";
    if (score >= 70) return "from-yellow-500 to-amber-500 text-white";
    if (score >= 50) return "from-orange-500 to-red-500 text-white";
    return "from-red-600 to-rose-600 text-white";
  };

  const getStatusColor = (problems: number) => {
    if (problems === 0)
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (problems <= 5) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-rose-100 text-rose-800 border-rose-200";
  };

  const getStatusIcon = (problems: number) => {
    if (problems === 0) return "✅";
    if (problems <= 5) return "⚠️";
    return "❌";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 lg:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Analytics Performance
              </h1>
            </div>
            <p className="text-slate-600 text-sm lg:text-base ml-11">
              Surveillance des Web Vitals et détection proactive des problèmes
            </p>
          </div>

          {/* Performance Score Badge */}
          <div
            className={`bg-gradient-to-r ${getPerformanceColor(
              performance_score
            )} px-6 py-4 rounded-2xl shadow-lg border border-white/20 backdrop-blur-sm`}
          >
            <div className="text-center">
              <p className="text-sm font-medium opacity-90">Score Global</p>
              <p className="text-3xl font-bold mt-1">
                {performance_score}
                <span className="text-lg opacity-90">/100</span>
              </p>
              <p className="text-xs font-medium opacity-90 mt-1">
                {performance_status}
              </p>
            </div>
          </div>
        </div>

        {/* Date Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Filtrer par période
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50"
                  />
                </div>
                <span className="self-center text-slate-500 text-sm hidden sm:block">
                  au
                </span>
                <div className="flex-1">
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                onClick={handleDateFilter}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Appliquer
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="px-6 py-3 bg-white text-slate-700 border border-slate-300 rounded-xl font-semibold shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-200"
              >
                Effacer
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">📈</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Métriques Total
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  {global_stats.total_metrics}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {global_stats.total_sessions} sessions
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 rounded-xl">
                <div className="w-6 h-6 bg-gradient-to-br from-rose-600 to-red-700 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">⚠️</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Problèmes Détectés
                </p>
                <p className="text-2xl font-bold text-rose-600">
                  {global_stats.total_problems}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {global_stats.total_pages} pages analysées
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <div className="w-6 h-6 bg-gradient-to-br from-emerald-600 to-green-700 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">⚡</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Performance Moyenne
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {global_stats.average_performance != null
                    ? Number(global_stats.average_performance).toFixed(3)
                    : "0.00"}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Pire: {global_stats.worst_performance}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Metrics Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200/60">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 p-1.5 rounded-lg">
                  📋
                </span>
                Détail des Métriques
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200/60">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Métrique
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Occurrences
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Moyenne
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {metrics_details.map((metric, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-50/50 transition-colors duration-150"
                    >
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-800">
                          {metric.metric_name}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-slate-700 font-medium">
                          {metric.occurrences}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-slate-700 font-medium">
                          {metric.average_value ? metric.average_value : "0"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(
                            metric.problems_count
                          )}`}
                        >
                          {getStatusIcon(metric.problems_count)}
                          {metric.problems_count > 10
                            ? "Critique"
                            : metric.problems_count > 5
                            ? "Attention"
                            : "Optimal"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {metrics_details.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 px-6 text-center text-slate-500"
                      >
                        Aucune donnée disponible
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recurrent Problems */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200/60">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <span className="bg-rose-100 text-rose-800 p-1.5 rounded-lg">
                  🚨
                </span>
                Problèmes Récurrents
              </h2>
            </div>
            <div className="p-6">
              {recurrent_problems.length > 0 ? (
                <div className="space-y-4">
                  {recurrent_problems.map((problem, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200/60 rounded-xl p-4 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                            <h4 className="font-semibold text-rose-800">
                              {problem.metric_name}
                            </h4>
                          </div>
                          <p className="text-rose-700 text-sm leading-relaxed">
                            {problem.description}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <span className="inline-block bg-rose-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                            {problem.problem_count} occ.
                          </span>
                          <p className="text-rose-600 text-xs mt-2 font-medium">
                            Moyenne:{" "}
                            {problem.average_value
                              ? problem.average_value
                              : "0"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✅</span>
                  </div>
                  <p className="text-slate-600 font-medium">
                    Aucun problème récurrent détecté
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    Tous les systèmes fonctionnent optimalement
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
