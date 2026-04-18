"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getStationnements, enregistrerStationnement, terminerStationnement, getZones,
  searchVehiculeByPlaque, addVehicule, enregistrerPaiement,
} from "@/services/stationnement/stationnementService";
import { SessionStationnement, ZoneStationnement, Pagination } from "@/services/stationnement/types";
import {
  Search, Plus, X, Check, Save, Loader2, Clock, StopCircle, CreditCard, Car,
  Calendar, Filter, AlertTriangle, ChevronLeft, ChevronRight, ParkingCircle, Wallet, Printer,
} from "lucide-react";
import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

const formatMontant = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF" }).format(n);

const STATUT_BADGES: Record<string, string> = {
  actif: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  termine: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  paye: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};
const STATUT_LABELS: Record<string, string> = { actif: "En cours", termine: "Terminé", paye: "Payé" };

export default function StationnementsClient() {
  const { utilisateur } = useAuth();
  const [stationnements, setStationnements] = useState<SessionStationnement[]>([]);
  const [zones, setZones] = useState<ZoneStationnement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showTerminate, setShowTerminate] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [selected, setSelected] = useState<SessionStationnement | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [payMode, setPayMode] = useState("especes");
  const [payNumeroMobile, setPayNumeroMobile] = useState("");
  const [payNomBanque, setPayNomBanque] = useState("");
  const [payNumeroCarte, setPayNumeroCarte] = useState("");
  const [payTitulaireCarte, setPayTitulaireCarte] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    reference: string; recu_numero: string; montant: number;
    plaque: string; zone_nom: string; duree: string; mode: string;
    date: string; agent: string; vehicule_type: string;
  } | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const MODE_LABELS: Record<string, string> = { especes: "Espèces", mobile_money: "Mobile Money", banque: "Banque" };

  const emptyForm = {
    zone_id: "", plaque: "", type_vehicule: "voiture_privee" as const,
    marque_modele: "", couleur: "", notes: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [vehiculeFound, setVehiculeFound] = useState<{ id: number } | null>(null);
  const [plaqueSearched, setPlaqueSearched] = useState("");

  const load = useCallback(async (page = 1) => {
    if (!utilisateur?.site_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getStationnements(utilisateur.site_id, page, 20, search, filterZone, filterStatut, dateDebut, dateFin);
      if (res.status === "success" && res.data) {
        setStationnements(res.data.stationnements);
        setPagination(res.data.pagination);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [utilisateur?.site_id, search, filterZone, filterStatut, dateDebut, dateFin]);

  useEffect(() => { load(); }, [load]);

  const loadZones = useCallback(() => {
    if (utilisateur?.site_id) {
      getZones(utilisateur.site_id, 1, 100).then((res) => {
        if (res.status === "success" && res.data) setZones(res.data.zones);
      });
    }
  }, [utilisateur?.site_id]);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(1); };

  // Search vehicle by plate when user leaves the plate field
  const handlePlaqueBlur = async () => {
    const plaque = form.plaque.trim().toUpperCase();
    if (!plaque || plaque === plaqueSearched || !utilisateur?.site_id) return;
    setPlaqueSearched(plaque);
    try {
      const vRes = await searchVehiculeByPlaque(utilisateur.site_id, plaque);
      if (vRes.status === "success" && vRes.found && vRes.data && Array.isArray(vRes.data) && vRes.data.length > 0) {
        const v = vRes.data[0];
        setVehiculeFound({ id: v.id });
        setForm(prev => ({
          ...prev,
          marque_modele: v.marque_modele || prev.marque_modele,
          type_vehicule: (v.type as typeof prev.type_vehicule) || prev.type_vehicule,
          couleur: v.couleur || prev.couleur,
        }));
      } else {
        setVehiculeFound(null);
      }
    } catch { setVehiculeFound(null); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setError("");
    try {
      const plaque = form.plaque.trim().toUpperCase();
      if (!plaque) { setError("La plaque est requise."); setFormLoading(false); return; }
      if (!form.zone_id) { setError("Sélectionnez une zone."); setFormLoading(false); return; }

      let vehiculeId: number | null = null;

      // Try to find existing vehicle
      if (utilisateur?.site_id) {
        const vRes = await searchVehiculeByPlaque(utilisateur.site_id, plaque);
        if (vRes.status === "success" && vRes.found && vRes.data && Array.isArray(vRes.data) && vRes.data.length > 0) {
          vehiculeId = vRes.data[0].id;
        }
      }

      // If vehicle not found, create it automatically
      if (!vehiculeId && utilisateur?.site_id) {
        const createRes = await addVehicule({
          plaque, type: form.type_vehicule,
          marque_modele: form.marque_modele || null,
          couleur: form.couleur || null,
          site_id: utilisateur.site_id,
          utilisateur_id: utilisateur.id,
        });
        if (createRes.status === "success" && (createRes.data as Record<string, unknown>)?.id) {
          vehiculeId = (createRes.data as Record<string, unknown>).id as number;
        } else {
          setError(createRes.message || "Impossible de créer le véhicule."); setFormLoading(false); return;
        }
      }

      if (!vehiculeId) { setError("Impossible de trouver ou créer le véhicule."); setFormLoading(false); return; }

      const res = await enregistrerStationnement({
        zone_id: parseInt(form.zone_id),
        vehicule_id: vehiculeId,
        notes: form.notes || null,
        site_id: utilisateur?.site_id,
        utilisateur_id: utilisateur?.id,
      });
      if (res.status === "success") {
        setSuccess("Stationnement enregistré."); setShowAdd(false); setForm(emptyForm);
        setVehiculeFound(null); setPlaqueSearched(""); load(1); loadZones();
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur serveur"); }
    setFormLoading(false);
  };

  const handleTerminate = async () => {
    if (!selected) return;
    setFormLoading(true);
    try {
      const res = await terminerStationnement(selected.id);
      if (res.status === "success") {
        setSuccess("Stationnement terminé."); setShowTerminate(false); load(pagination.page);
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur"); }
    setFormLoading(false);
  };

  const handlePay = async () => {
    if (!selected) return;
    if (payMode === "mobile_money" && !payNumeroMobile.trim()) { setError("Le numéro mobile est requis."); return; }
    if (payMode === "banque" && !payNomBanque.trim()) { setError("Le nom de la banque est requis."); return; }
    setFormLoading(true); setError("");
    try {
      const res = await enregistrerPaiement({
        stationnement_id: selected.id,
        montant: Number(selected.montant),
        mode_paiement: payMode,
        ...(payMode === "mobile_money" && { numero_mobile: payNumeroMobile }),
        ...(payMode === "banque" && { nom_banque: payNomBanque, numero_carte: payNumeroCarte, titulaire_carte: payTitulaireCarte }),
        site_id: utilisateur?.site_id,
        utilisateur_id: utilisateur?.id,
      });
      if (res.status === "success") {
        const d = res.data as Record<string, unknown> | undefined;
        setReceiptData({
          reference: (d?.reference as string) || "—",
          recu_numero: (d?.recu_numero as string) || "—",
          montant: Number(selected.montant),
          plaque: selected.plaque || "—",
          zone_nom: selected.zone_nom || "—",
          duree: selected.duree_heures ? `${selected.duree_heures} h` : "—",
          mode: MODE_LABELS[payMode] || payMode,
          date: new Date().toLocaleString("fr-FR"),
          agent: utilisateur?.nom_complet || "—",
          vehicule_type: selected.vehicule_type?.replace("_", " ") || "—",
        });
        setShowPay(false); setShowReceipt(true); load(pagination.page); loadZones();
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur serveur"); }
    setFormLoading(false);
  };

  const selectedZone = zones.find(z => String(z.id) === form.zone_id);

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ParkingCircle className="w-6 h-6 text-[#153258]" /> Sessions de stationnement
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Suivi des entrées/sorties</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(""); setVehiculeFound(null); setPlaqueSearched(""); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
          <Plus className="w-4 h-4" /> Nouveau stationnement
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
          <Check className="w-4 h-4" />{success}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par plaque..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153258]/30" />
        </form>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none">
            <option value="">Toutes zones</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.nom}</option>)}
          </select>
        </div>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300">
          <option value="">Tous statuts</option>
          <option value="actif">En cours</option>
          <option value="termine">Terminé</option>
          <option value="paye">Payé</option>
        </select>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" />
          <span className="text-gray-400">→</span>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#153258]" /></div>
        ) : stationnements.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><ParkingCircle className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucune session trouvée</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Plaque</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Zone</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Entrée</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Sortie</th>
                  <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Durée</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Montant</th>
                  <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Statut</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stationnements.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.plaque || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize text-xs">{s.vehicule_type?.replace("_", " ") || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{s.zone_nom || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {s.heure_entree ? new Date(s.heure_entree).toLocaleString("fr-FR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {s.heure_sortie ? new Date(s.heure_sortie).toLocaleString("fr-FR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                      {s.duree_heures ? `${s.duree_heures} h` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#23A974]">
                      {s.montant ? formatMontant(Number(s.montant)) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_BADGES[s.statut] || "bg-gray-100 text-gray-700"}`}>
                        {STATUT_LABELS[s.statut] || s.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.statut === "actif" && (
                          <button onClick={() => { setSelected(s); setShowTerminate(true); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-xs font-medium transition-colors">
                            <StopCircle className="w-3.5 h-3.5" /> Terminer
                          </button>
                        )}
                        {s.statut === "termine" && (
                          <button onClick={() => { setSelected(s); setPayMode("especes"); setPayNumeroMobile(""); setPayNomBanque(""); setPayNumeroCarte(""); setPayTitulaireCarte(""); setError(""); setShowPay(true); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium transition-colors">
                            <Wallet className="w-3.5 h-3.5" /> Payer
                          </button>
                        )}
                        {s.statut === "paye" && (
                          <span className="text-xs text-gray-400 italic">Soldé</span>
                        )}
                      </div>
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

      {/* Modal Nouveau stationnement */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ParkingCircle className="w-5 h-5 text-[#153258]" /> Nouveau stationnement
              </h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="space-y-5 p-5">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />{error}
                  </div>
                )}

                {/* Section Véhicule */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Car className="w-4 h-4 text-[#153258]" /> Informations de l&apos;engin
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Plaque <span className="text-red-500">*</span></label>
                        <input required value={form.plaque}
                          onChange={(e) => setForm({ ...form, plaque: e.target.value })}
                          onBlur={handlePlaqueBlur}
                          className={inputClass} placeholder="Ex: KN-1234-AB" />
                        {vehiculeFound && (
                          <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Véhicule existant trouvé
                          </p>
                        )}
                        {plaqueSearched && !vehiculeFound && form.plaque.trim() && (
                          <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Nouveau véhicule — sera créé automatiquement
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type d&apos;engin <span className="text-red-500">*</span></label>
                        <select value={form.type_vehicule} onChange={(e) => setForm({ ...form, type_vehicule: e.target.value as typeof form.type_vehicule })} className={inputClass}>
                          <option value="voiture_privee">Voiture privée</option>
                          <option value="taxi">Taxi</option>
                          <option value="bus">Bus</option>
                          <option value="moto">Moto</option>
                          <option value="camion">Camion</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Marque / Modèle</label>
                        <input value={form.marque_modele} onChange={(e) => setForm({ ...form, marque_modele: e.target.value })} className={inputClass} placeholder="Toyota Corolla..." />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Couleur</label>
                        <input value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })} className={inputClass} placeholder="Noir, Blanc..." />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Zone */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <ParkingCircle className="w-4 h-4 text-[#23A974]" /> Zone de stationnement
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-gray-700">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Zone <span className="text-red-500">*</span></label>
                      <select required value={form.zone_id} onChange={(e) => setForm({ ...form, zone_id: e.target.value })} className={inputClass}>
                        <option value="">Sélectionner une zone</option>
                        {zones.map((z) => {
                          const cap = z.capacite ? Number(z.capacite) : null;
                          const occ = Number(z.occupation || 0);
                          const dispo = cap !== null ? cap - occ : null;
                          const plein = dispo !== null && dispo <= 0;
                          return (
                            <option key={z.id} value={z.id} disabled={plein}>
                              {z.nom} — {z.type} ({z.mode_tarification}, {formatMontant(Number(z.tarif))}){dispo !== null ? ` • ${plein ? "COMPLET" : `${dispo} place${dispo > 1 ? "s" : ""} dispo`}` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    {selectedZone && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full font-medium capitalize">{selectedZone.type}</span>
                        <span className="px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full font-medium">
                          Tarif : {formatMontant(Number(selectedZone.tarif))} / {selectedZone.mode_tarification}
                        </span>
                        {selectedZone.capacite != null && (() => {
                          const cap = Number(selectedZone.capacite);
                          const occ = Number(selectedZone.occupation || 0);
                          const dispo = cap - occ;
                          const plein = dispo <= 0;
                          return (
                            <span className={`px-2.5 py-1 rounded-full font-medium ${
                              plein ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" :
                              dispo <= 3 ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" :
                              "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                            }`}>
                              {plein ? `⚠ COMPLET (${occ}/${cap})` : `${dispo}/${cap} places dispo`}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
                      <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} rows={2} placeholder="Notes optionnelles..." />
                    </div>
                  </div>
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

      {/* Modal Terminer */}
      {showTerminate && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Terminer ce stationnement ?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Véhicule: <strong>{selected.plaque}</strong><br />
              Zone: {selected.zone_nom}
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowTerminate(false)} className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium">Annuler</button>
              <button onClick={handleTerminate} disabled={formLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />} Terminer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quittance POS */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[360px]">
            {/* Receipt content */}
            <div ref={receiptRef} className="bg-white text-gray-900 p-6" id="receipt-pos">
              {/* Header */}
              <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                <div className="text-xs font-bold tracking-[0.3em] uppercase text-gray-500 mb-1">République Démocratique du Congo</div>
                <h2 className="text-lg font-black tracking-tight">Taxe de stationnement</h2>
                <p className="text-[10px] text-gray-400 mt-0.5">Système de gestion fiscale</p>
                <div className="mt-3 inline-block px-3 py-1 bg-gray-900 text-white text-xs font-bold rounded-full tracking-wider">QUITTANCE DE PAIEMENT</div>
              </div>

              {/* Reference */}
              <div className="text-center border-b border-dashed border-gray-200 pb-3 mb-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">N° Reçu</p>
                <p className="text-sm font-mono font-bold">{receiptData.recu_numero}</p>
                <p className="text-[10px] text-gray-400 mt-1">Réf: {receiptData.reference}</p>
              </div>

              {/* Details */}
              <div className="space-y-2 text-xs border-b border-dashed border-gray-200 pb-3 mb-3">
                <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{receiptData.date}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Agent</span><span className="font-medium">{receiptData.agent}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Plaque</span><span className="font-bold">{receiptData.plaque}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Type engin</span><span className="font-medium capitalize">{receiptData.vehicule_type}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Zone</span><span className="font-medium">{receiptData.zone_nom}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Durée</span><span className="font-medium">{receiptData.duree}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Mode paiement</span><span className="font-medium">{receiptData.mode}</span></div>
              </div>

              {/* Total */}
              <div className="text-center py-3 border-b-2 border-dashed border-gray-300 mb-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Montant payé</p>
                <p className="text-2xl font-black">{formatMontant(receiptData.montant)}</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center py-3 border-b border-dashed border-gray-200 mb-3">
                <QRCodeSVG
                  value={JSON.stringify({
                    type: "QUITTANCE_STATIONNEMENT",
                    recu: receiptData.recu_numero,
                    ref: receiptData.reference,
                    plaque: receiptData.plaque,
                    zone: receiptData.zone_nom,
                    vehicule: receiptData.vehicule_type,
                    duree: receiptData.duree,
                    montant: receiptData.montant,
                    mode: receiptData.mode,
                    date: receiptData.date,
                    agent: receiptData.agent,
                  })}
                  size={120}
                  level="M"
                  id="receipt-qr"
                />
              </div>

              {/* Footer */}
              <div className="text-center text-[10px] text-gray-400 space-y-0.5">
                <p>Stationnement — Taxe municipale</p>
                <p className="font-medium">Merci pour votre paiement</p>
                <p className="mt-2">••••••••••••••••••••••••••</p>
              </div>
            </div>

            {/* Actions (not printed) */}
            <div className="flex justify-center gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => { setShowReceipt(false); setReceiptData(null); setSuccess("Paiement effectué."); setTimeout(() => setSuccess(""), 3000); }}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium">Fermer</button>
              <button onClick={() => {
                const content = receiptRef.current;
                if (!content) return;
                const win = window.open("", "_blank", "width=400,height=650");
                if (!win) return;
                win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Quittance</title><style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 8px; }
                  .text-center { text-align: center; }
                  .flex { display: flex; justify-content: space-between; }
                  .border-dash { border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 8px; }
                  .border-dash-thick { border-bottom: 2px dashed #999; padding-bottom: 10px; margin-bottom: 10px; }
                  .header-tag { display: inline-block; background: #000; color: #fff; padding: 3px 10px; border-radius: 20px; font-size: 9px; letter-spacing: 1px; font-weight: bold; }
                  .text-xs { font-size: 10px; }
                  .text-sm { font-size: 12px; }
                  .text-lg { font-size: 16px; }
                  .text-2xl { font-size: 22px; }
                  .font-bold { font-weight: bold; }
                  .font-black { font-weight: 900; }
                  .font-mono { font-family: 'Courier New', monospace; }
                  .text-gray { color: #888; }
                  .tracking { letter-spacing: 2px; }
                  .uppercase { text-transform: uppercase; }
                  .capitalize { text-transform: capitalize; }
                  .mt-1 { margin-top: 4px; } .mt-2 { margin-top: 8px; } .mt-3 { margin-top: 12px; }
                  .mb-1 { margin-bottom: 4px; } .mb-3 { margin-bottom: 12px; }
                  .py-3 { padding: 10px 0; }
                  .space-y > div { margin-bottom: 6px; }
                  @media print { body { width: 80mm; } }
                </style></head><body>`);
                win.document.write('<div class="text-center border-dash-thick">');
                win.document.write('<div class="text-xs font-bold tracking uppercase text-gray mb-1">République Démocratique du Congo</div>');
                win.document.write('<div class="text-lg font-black">Taxe de stationnement</div>');
                win.document.write('<div class="text-xs text-gray mt-1">Système de gestion fiscale</div>');
                win.document.write('<div class="mt-3"><span class="header-tag">QUITTANCE DE PAIEMENT</span></div>');
                win.document.write('</div>');
                win.document.write('<div class="text-center border-dash">');
                win.document.write('<div class="text-xs text-gray uppercase tracking">N° Reçu</div>');
                win.document.write(`<div class="text-sm font-mono font-bold">${receiptData.recu_numero}</div>`);
                win.document.write(`<div class="text-xs text-gray mt-1">Réf: ${receiptData.reference}</div>`);
                win.document.write('</div>');
                win.document.write('<div class="space-y border-dash">');
                win.document.write(`<div class="flex text-xs"><span class="text-gray">Date</span><span class="font-bold">${receiptData.date}</span></div>`);
                win.document.write(`<div class="flex text-xs"><span class="text-gray">Agent</span><span class="font-bold">${receiptData.agent}</span></div>`);
                win.document.write(`<div class="flex text-xs"><span class="text-gray">Plaque</span><span class="font-bold">${receiptData.plaque}</span></div>`);
                win.document.write(`<div class="flex text-xs"><span class="text-gray">Type engin</span><span class="font-bold capitalize">${receiptData.vehicule_type}</span></div>`);
                win.document.write(`<div class="flex text-xs"><span class="text-gray">Zone</span><span class="font-bold">${receiptData.zone_nom}</span></div>`);
                win.document.write(`<div class="flex text-xs"><span class="text-gray">Durée</span><span class="font-bold">${receiptData.duree}</span></div>`);
                win.document.write(`<div class="flex text-xs"><span class="text-gray">Mode paiement</span><span class="font-bold">${receiptData.mode}</span></div>`);
                win.document.write('</div>');
                win.document.write('<div class="text-center py-3 border-dash-thick">');
                win.document.write('<div class="text-xs text-gray uppercase tracking mb-1">Montant payé</div>');
                win.document.write(`<div class="text-2xl font-black">${formatMontant(receiptData.montant)}</div>`);
                win.document.write('</div>');
                // QR Code
                const svgEl = document.getElementById('receipt-qr');
                if (svgEl) {
                  const svgData = new XMLSerializer().serializeToString(svgEl);
                  const svgB64 = btoa(unescape(encodeURIComponent(svgData)));
                  win.document.write('<div class="text-center" style="padding:10px 0;border-bottom:1px dashed #ccc;margin-bottom:8px">');
                  win.document.write(`<img src="data:image/svg+xml;base64,${svgB64}" width="120" height="120" style="margin:0 auto;display:block" />`);
                  win.document.write('</div>');
                }
                win.document.write('<div class="text-center text-xs text-gray">');
                win.document.write('<div>Stationnement — Taxe municipale</div>');
                win.document.write('<div class="font-bold">Merci pour votre paiement</div>');
                win.document.write('<div class="mt-2">••••••••••••••••••••••••••</div>');
                win.document.write('</div>');
                win.document.write('</body></html>');
                win.document.close();
                setTimeout(() => { win.print(); }, 400);
              }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg text-sm font-medium">
                <Printer className="w-4 h-4" /> Imprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Payer */}
      {showPay && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Paiement du stationnement</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Véhicule : <strong>{selected.plaque}</strong> — Zone : {selected.zone_nom}
              </p>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Durée</span>
                <span className="font-medium text-gray-900 dark:text-white">{selected.duree_heures ? `${selected.duree_heures} h` : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Montant à payer</span>
                <span className="text-lg font-bold text-[#23A974]">{formatMontant(Number(selected.montant))}</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mode de paiement</label>
              <select value={payMode} onChange={(e) => setPayMode(e.target.value)} className={inputClass}>
                <option value="especes">Espèces</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="banque">Banque</option>
              </select>
            </div>
            {payMode === "mobile_money" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Numéro mobile <span className="text-red-500">*</span></label>
                <input type="tel" value={payNumeroMobile} onChange={(e) => setPayNumeroMobile(e.target.value)}
                  className={inputClass} placeholder="Ex: +243 8XX XXX XXX" required />
              </div>
            )}
            {payMode === "banque" && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom de la banque <span className="text-red-500">*</span></label>
                  <input value={payNomBanque} onChange={(e) => setPayNomBanque(e.target.value)}
                    className={inputClass} placeholder="Ex: Rawbank, Equity BCDC..." required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">N° carte bancaire</label>
                  <input value={payNumeroCarte} onChange={(e) => setPayNumeroCarte(e.target.value)}
                    className={inputClass} placeholder="XXXX XXXX XXXX XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Titulaire de la carte</label>
                  <input value={payTitulaireCarte} onChange={(e) => setPayTitulaireCarte(e.target.value)}
                    className={inputClass} placeholder="Nom du titulaire" />
                </div>
              </div>
            )}
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowPay(false)} className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium">Annuler</button>
              <button onClick={handlePay} disabled={formLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg disabled:opacity-50 text-sm font-medium">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} Confirmer le paiement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
