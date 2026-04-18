"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAmendes, enregistrerAmende, payerAmende, searchVehiculeByPlaque } from "@/services/stationnement/stationnementService";
import { AmendeStationnement, Pagination } from "@/services/stationnement/types";
import {
  Search, Plus, X, Check, Save, Loader2, CreditCard,
  Calendar, AlertTriangle, ChevronLeft, ChevronRight, DollarSign,
} from "lucide-react";

const formatMontant = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF" }).format(n);

const STATUT_BADGES: Record<string, string> = {
  impayee: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  payee: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  annulee: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};
const STATUT_LABELS: Record<string, string> = { impayee: "Impayée", payee: "Payée", annulee: "Annulée" };

export default function AmendesClient() {
  const { utilisateur } = useAuth();
  const [amendes, setAmendes] = useState<AmendeStationnement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [selected, setSelected] = useState<AmendeStationnement | null>(null);
  const [payMode, setPayMode] = useState("especes");
  const [payDetails, setPayDetails] = useState({ numero_mobile: "", nom_banque: "", numero_carte: "", titulaire_carte: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const emptyForm = { vehicule_plaque: "", motif: "", montant: "", zone_id: "" };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async (page = 1) => {
    if (!utilisateur?.site_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getAmendes(utilisateur.site_id, page, 20, search, filterStatut, dateDebut, dateFin);
      if (res.status === "success" && res.data) {
        setAmendes(res.data.amendes);
        setPagination(res.data.pagination);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [utilisateur?.site_id, search, filterStatut, dateDebut, dateFin]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(1); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setError("");
    try {
      // Search vehicle by plate to get vehicule_id
      let vehiculeId: number | null = null;
      if (form.vehicule_plaque && utilisateur?.site_id) {
        const vRes = await searchVehiculeByPlaque(utilisateur.site_id, form.vehicule_plaque);
        if (vRes.status === "success" && vRes.found && vRes.data && Array.isArray(vRes.data) && vRes.data.length > 0) {
          vehiculeId = vRes.data[0].id;
        } else {
          setError("Véhicule non trouvé avec cette plaque."); setFormLoading(false); return;
        }
      } else {
        setError("Plaque requise."); setFormLoading(false); return;
      }
      const res = await enregistrerAmende({
        vehicule_id: vehiculeId,
        motif: form.motif,
        montant: parseFloat(form.montant),
        site_id: utilisateur?.site_id,
        utilisateur_id: utilisateur?.id,
      });
      if (res.status === "success") {
        setSuccess("Amende enregistrée."); setShowAdd(false); setForm(emptyForm); load(1);
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur serveur"); }
    setFormLoading(false);
  };

  const handlePay = async () => {
    if (!selected) return;
    setFormLoading(true);
    try {
      const res = await payerAmende(selected.id, payMode, payDetails);
      if (res.status === "success") {
        setSuccess("Amende payée."); setShowPay(false); load(pagination.page);
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur"); }
    setFormLoading(false);
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-[#153258]" /> Amendes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des amendes de stationnement</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(""); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
          <Plus className="w-4 h-4" /> Nouvelle amende
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
          <Check className="w-4 h-4" />{success}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par plaque..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153258]/30" />
        </form>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300">
          <option value="">Tous statuts</option>
          <option value="impayee">Impayée</option>
          <option value="payee">Payée</option>
          <option value="annulee">Annulée</option>
        </select>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" />
          <span className="text-gray-400">→</span>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#153258]" /></div>
        ) : amendes.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucune amende trouvée</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Plaque</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Motif</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Montant</th>
                  <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Statut</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Date</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {amendes.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{a.plaque || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">{a.motif || "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600">{formatMontant(Number(a.montant))}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_BADGES[a.statut] || "bg-gray-100 text-gray-700"}`}>
                        {STATUT_LABELS[a.statut] || a.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {a.date_amende ? new Date(a.date_amende).toLocaleString("fr-FR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.statut === "impayee" && (
                        <button onClick={() => { setSelected(a); setPayMode("especes"); setPayDetails({ numero_mobile: "", nom_banque: "", numero_carte: "", titulaire_carte: "" }); setShowPay(true); }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-medium transition-colors">
                          <CreditCard className="w-3.5 h-3.5" /> Payer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} résultat(s)</span>
            <div className="flex items-center gap-1">
              <button onClick={() => load(pagination.page - 1)} disabled={pagination.page <= 1} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-gray-700 dark:text-gray-300 px-2">{pagination.page} / {pagination.totalPages}</span>
              <button onClick={() => load(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Ajouter */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nouvelle amende</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="space-y-4 p-5">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    <AlertTriangle className="w-4 h-4" />{error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Plaque du véhicule <span className="text-red-500">*</span></label>
                  <input required value={form.vehicule_plaque} onChange={(e) => setForm({ ...form, vehicule_plaque: e.target.value })} className={inputClass} placeholder="KN-1234-AB" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Motif <span className="text-red-500">*</span></label>
                  <textarea required value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} className={inputClass} rows={2} placeholder="Motif de l'amende..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Montant (FC) <span className="text-red-500">*</span></label>
                  <input required type="number" step="0.01" min="0" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} className={inputClass} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ID Zone (optionnel)</label>
                  <input value={form.zone_id} onChange={(e) => setForm({ ...form, zone_id: e.target.value })} className={inputClass} placeholder="ID de la zone" />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2.5 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium" disabled={formLoading}>Annuler</button>
                <button type="submit" disabled={formLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg disabled:opacity-50 text-sm font-medium">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Payer */}
      {showPay && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Payer cette amende ?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Véhicule: <strong>{selected.plaque}</strong><br />
              Montant: <strong className="text-amber-600">{formatMontant(Number(selected.montant))}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 text-left">Mode de paiement</label>
              <select value={payMode} onChange={(e) => setPayMode(e.target.value)} className={inputClass}>
                <option value="especes">Espèces</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="banque">Banque</option>
              </select>
            </div>
            {payMode === "mobile_money" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 text-left">Numéro mobile</label>
                <input value={payDetails.numero_mobile} onChange={(e) => setPayDetails({ ...payDetails, numero_mobile: e.target.value })} className={inputClass} placeholder="+243 ..." />
              </div>
            )}
            {payMode === "banque" && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 text-left">Nom de la banque</label>
                  <input value={payDetails.nom_banque} onChange={(e) => setPayDetails({ ...payDetails, nom_banque: e.target.value })} className={inputClass} placeholder="Ex: Rawbank, Equity..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 text-left">Numéro de carte</label>
                  <input value={payDetails.numero_carte} onChange={(e) => setPayDetails({ ...payDetails, numero_carte: e.target.value })} className={inputClass} placeholder="XXXX-XXXX-XXXX-XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 text-left">Titulaire de la carte</label>
                  <input value={payDetails.titulaire_carte} onChange={(e) => setPayDetails({ ...payDetails, titulaire_carte: e.target.value })} className={inputClass} placeholder="Nom complet" />
                </div>
              </div>
            )}
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowPay(false)} className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium">Annuler</button>
              <button onClick={handlePay} disabled={formLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} Payer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
