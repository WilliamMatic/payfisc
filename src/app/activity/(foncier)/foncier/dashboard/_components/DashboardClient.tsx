"use client";
import { useEffect, useState, useCallback } from "react";
import { Home, FileText, DollarSign, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getStatistiques, getRevenusMensuels } from "@/services/foncier/foncierService";
import { StatistiquesFoncier, RevenuMensuel } from "@/services/foncier/types";
import { formatMontant } from "../../_shared/format";

const MOIS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export default function DashboardClient() {
  const { utilisateur } = useAuth();
  const [stats, setStats] = useState<StatistiquesFoncier | null>(null);
  const [revenus, setRevenus] = useState<RevenuMensuel[]>([]);
  const [annee, setAnnee] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const [s, r] = await Promise.all([
      getStatistiques(utilisateur.site_id, annee),
      getRevenusMensuels(utilisateur.site_id, annee),
    ]);
    if (s.status === "success" && s.data) setStats(s.data);
    if (r.status === "success" && r.data) setRevenus(r.data);
    setLoading(false);
  }, [utilisateur?.site_id, annee]);

  useEffect(() => { load(); }, [load]);

  const maxRevenu = Math.max(1, ...revenus.map(r => Number(r.total)));
  const maxCommune = Math.max(1, ...(stats?.par_commune || []).map(c => Number(c.total_paye)));

  if (loading || !stats) {
    return <div className="p-8 text-center text-gray-500">Chargement du dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">📊 Dashboard Foncier</h1>
          <p className="text-sm text-gray-500">Vue d&apos;ensemble — {annee}</p>
        </div>
        <select value={annee} onChange={(e) => setAnnee(Number(e.target.value))}
          className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
          {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={<Home className="w-6 h-6" />} label="Biens recensés" value={stats.total_biens} color="from-blue-500 to-blue-600" />
        <Card icon={<Clock className="w-6 h-6" />} label="En attente" value={stats.biens_en_attente} color="from-yellow-500 to-orange-500" />
        <Card icon={<CheckCircle className="w-6 h-6" />} label="Validés" value={stats.biens_valides} color="from-green-500 to-[#23A974]" />
        <Card icon={<FileText className="w-6 h-6" />} label={`Factures ${annee}`} value={stats.total_factures} color="from-indigo-500 to-[#153258]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 border rounded-xl p-5">
          <div className="text-xs text-gray-500 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Montant facturé</div>
          <div className="text-2xl font-bold">{formatMontant(Number(stats.montant_facture))}</div>
        </div>
        <div className="bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-xl p-5">
          <div className="text-xs opacity-80 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Montant recouvré</div>
          <div className="text-2xl font-bold">{formatMontant(Number(stats.montant_recouvre))}</div>
          <div className="text-xs opacity-80 mt-1">{stats.total_paiements} paiement(s)</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border rounded-xl p-5">
          <div className="text-xs text-gray-500">Taux de recouvrement</div>
          <div className="text-2xl font-bold">{Number(stats.taux_recouvrement).toFixed(1)}%</div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div className="bg-gradient-to-r from-[#153258] to-[#23A974] h-2 rounded-full"
              style={{ width: `${Math.min(100, Number(stats.taux_recouvrement))}%` }} />
          </div>
          <div className="text-xs text-red-600 mt-2 flex items-center gap-1"><XCircle className="w-3 h-3" /> Impayés: {formatMontant(Number(stats.montant_impaye))}</div>
        </div>
      </div>

      {/* Revenus mensuels */}
      <div className="bg-white dark:bg-gray-800 border rounded-xl p-5">
        <h3 className="font-semibold mb-3">Revenus mensuels {annee}</h3>
        <div className="flex items-end gap-2 h-48">
          {MOIS.map((m, i) => {
            const r = revenus.find(x => x.mois === i + 1);
            const v = r ? Number(r.total) : 0;
            const h = (v / maxRevenu) * 100;
            return (
              <div key={m} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs font-medium">{v > 0 ? formatMontant(v) : ""}</div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded relative" style={{ height: "100%" }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#153258] to-[#23A974] rounded"
                    style={{ height: `${h}%`, minHeight: v > 0 ? "4px" : "0" }} />
                </div>
                <div className="text-xs text-gray-500">{m}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Par commune + répartition bénéficiaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 border rounded-xl p-5">
          <h3 className="font-semibold mb-3">🏘️ Performance par commune</h3>
          {stats.par_commune.length === 0 ? <div className="text-sm text-gray-500">Aucune donnée</div>
          : <div className="space-y-3">
              {stats.par_commune.map((c, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{c.commune_nom || "Non spécifié"} <span className="text-gray-500">({c.nb_biens} biens)</span></span>
                    <span className="font-semibold text-[#23A974]">{formatMontant(Number(c.total_paye))}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-[#153258] to-[#23A974] h-2 rounded-full"
                      style={{ width: `${(Number(c.total_paye) / maxCommune) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>}
        </div>

        <div className="bg-white dark:bg-gray-800 border rounded-xl p-5">
          <h3 className="font-semibold mb-3">💸 Répartition aux bénéficiaires</h3>
          {stats.repartition_beneficiaires.length === 0 ? <div className="text-sm text-gray-500">Aucune répartition</div>
          : <table className="w-full text-sm">
              <thead><tr className="text-gray-500 text-xs">
                <th className="text-left py-2">Bénéficiaire</th>
                <th className="text-right py-2">Paiements</th>
                <th className="text-right py-2">Total reçu</th>
              </tr></thead>
              <tbody>
                {stats.repartition_beneficiaires.map((b, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2">{b.beneficiaire_nom}</td>
                    <td className="py-2 text-right">{b.nb_paiements}</td>
                    <td className="py-2 text-right font-semibold text-[#23A974]">{formatMontant(Number(b.total_recu))}</td>
                  </tr>
                ))}
              </tbody>
            </table>}
        </div>
      </div>
    </div>
  );
}

function Card({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className={`bg-gradient-to-r ${color} text-white rounded-xl p-4 shadow`}>
      <div className="flex items-center justify-between mb-2 opacity-90">
        {icon}
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs opacity-90 mt-1">{label}</div>
    </div>
  );
}
