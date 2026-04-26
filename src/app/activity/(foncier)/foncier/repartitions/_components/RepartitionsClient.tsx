"use client";
import { useEffect, useState, useCallback } from "react";
import { Users, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getRepartitionGlobale } from "@/services/foncier/foncierService";
import { RepartitionGlobale } from "@/services/foncier/types";
import { formatMontant } from "../../_shared/format";

export default function RepartitionsClient() {
  const { utilisateur } = useAuth();
  const [data, setData] = useState<RepartitionGlobale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const r = await getRepartitionGlobale(utilisateur.site_id, dateDebut, dateFin);
    if (r.status === "success" && r.data) setData(r.data);
    setLoading(false);
  }, [utilisateur?.site_id, dateDebut, dateFin]);

  useEffect(() => { load(); }, [load]);

  const total = data.reduce((s, d) => s + Number(d.total_recu), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">💸 Répartitions globales</h1>
        <p className="text-sm text-gray-500">Totaux reversés à chaque bénéficiaire</p>
      </div>

      <div className="flex gap-2 items-end flex-wrap">
        <div>
          <label className="block text-xs mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Début</label>
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
            className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
        </div>
        <div>
          <label className="block text-xs mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Fin</label>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
            className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
        </div>
        {(dateDebut || dateFin) && (
          <button onClick={() => { setDateDebut(""); setDateFin(""); }} className="px-3 py-2 text-sm hover:bg-gray-100 rounded">Réinitialiser</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-[#153258] to-[#23A974] text-white p-5 rounded-xl">
          <div className="text-xs opacity-80">Total reversé</div>
          <div className="text-3xl font-bold">{formatMontant(total)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border rounded-xl p-5 flex items-center gap-3">
          <Users className="w-10 h-10 text-[#23A974]" />
          <div>
            <div className="text-xs text-gray-500">Bénéficiaires actifs</div>
            <div className="text-2xl font-bold">{data.length}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border rounded-xl p-5">
          <div className="text-xs text-gray-500">Nb paiements distribués</div>
          <div className="text-2xl font-bold">{data.reduce((s, d) => s + Number(d.nb_paiements), 0)}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Chargement...</div>
        : data.length === 0 ? <div className="p-8 text-center text-gray-500">Aucune répartition</div>
        : <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900"><tr>
              <th className="text-left px-4 py-3">Bénéficiaire</th>
              <th className="text-left px-4 py-3">N° compte</th>
              <th className="text-right px-4 py-3">Nb paiements</th>
              <th className="text-right px-4 py-3">Total reçu</th>
              <th className="text-right px-4 py-3">% du total</th>
            </tr></thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 font-medium">{d.beneficiaire_nom}</td>
                  <td className="px-4 py-3 font-mono text-xs">{d.numero_compte || "—"}</td>
                  <td className="px-4 py-3 text-right">{d.nb_paiements}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#23A974]">{formatMontant(Number(d.total_recu))}</td>
                  <td className="px-4 py-3 text-right">{total > 0 ? ((Number(d.total_recu) / total) * 100).toFixed(1) : "0"}%</td>
                </tr>
              ))}
            </tbody>
          </table>}
      </div>
    </div>
  );
}
