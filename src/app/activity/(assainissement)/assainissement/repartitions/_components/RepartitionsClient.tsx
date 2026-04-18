"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getRepartitionGlobale } from "@/services/assainissement/assainissementService";
import { RepartitionGlobale } from "@/services/assainissement/types";
import { Calendar, ArrowUpRight, AlertTriangle } from "lucide-react";

const formatMontant = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF" }).format(n);

export default function RepartitionsClient() {
  const { utilisateur } = useAuth();
  const [repartition, setRepartition] = useState<RepartitionGlobale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split("T")[0]);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getRepartitionGlobale(utilisateur.site_id, dateDebut, dateFin);
    if (res.status === "success" && res.data) setRepartition(res.data);
    setLoading(false);
  }, [utilisateur?.site_id, dateDebut, dateFin]);

  useEffect(() => { load(); }, [load]);

  const total = repartition.reduce((s, r) => s + Number(r.total_montant), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Répartitions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Répartition des paiements par bénéficiaire</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" />
          <span className="text-gray-400">→</span>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" />
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}
        </div>
      ) : repartition.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500" />
          <p className="text-gray-600 dark:text-gray-400">Aucune répartition pour cette période.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {repartition.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#153258] to-[#23A974] rounded-lg flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{r.beneficiaire_nom}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{r.numero_compte || "Pas de compte"} · {r.nb_repartitions} paiement(s)</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-[#23A974]">{formatMontant(Number(r.total_montant))}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-5 bg-[#153258]/5 dark:bg-[#153258]/20 rounded-xl border-2 border-[#153258]/20">
            <p className="font-bold text-gray-900 dark:text-white text-lg">Total réparti</p>
            <p className="text-2xl font-bold text-[#153258]">{formatMontant(total)}</p>
          </div>
        </>
      )}
    </div>
  );
}
