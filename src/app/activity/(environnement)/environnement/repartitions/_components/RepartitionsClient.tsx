"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getRepartitionGlobale } from "@/services/environnement/environnementService";
import { RepartitionGlobale } from "@/services/environnement/types";
import { Calendar, ArrowUpRight, DollarSign } from "lucide-react";

const formatMontant = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF", maximumFractionDigits: 0 }).format(n);

export default function RepartitionsClient() {
  const { utilisateur } = useAuth();
  const [repartitions, setRepartitions] = useState<RepartitionGlobale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getRepartitionGlobale(utilisateur.site_id, dateDebut, dateFin);
    if (res.status === "success" && res.data) setRepartitions(res.data);
    setLoading(false);
  }, [utilisateur?.site_id, dateDebut, dateFin]);
  useEffect(() => { load(); }, [load]);

  const total = repartitions.reduce((s, r) => s + Number(r.total_montant), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Répartitions</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Répartition globale des paiements par bénéficiaire</p></div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" />
          <span className="text-gray-400">→</span>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" />
        </div>
      </div>

      {loading ? <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />)}</div> : repartitions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center"><DollarSign className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" /><p className="text-gray-500">Aucune répartition pour la période sélectionnée</p></div>
      ) : (
        <>
          <div className="grid gap-4">
            {repartitions.map((r, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#153258] to-[#23A974] rounded-xl flex items-center justify-center"><ArrowUpRight className="w-5 h-5 text-white" /></div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{r.beneficiaire_nom}</h3>
                      <p className="text-xs text-gray-500">{r.numero_compte || "Pas de numéro de compte"} · {r.nb_repartitions} paiement(s)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#23A974]">{formatMontant(Number(r.total_montant))}</p>
                    <p className="text-xs text-gray-500">{total > 0 ? ((Number(r.total_montant) / total) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-[#153258] to-[#23A974] rounded-xl p-5 text-white flex items-center justify-between">
            <div><p className="text-sm opacity-80">Total réparti</p><p className="text-2xl font-bold">{formatMontant(total)}</p></div>
            <div className="text-right"><p className="text-sm opacity-80">Bénéficiaires</p><p className="text-2xl font-bold">{repartitions.length}</p></div>
          </div>
        </>
      )}
    </div>
  );
}
