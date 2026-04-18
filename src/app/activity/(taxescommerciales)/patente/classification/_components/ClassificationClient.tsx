"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getDeclarations,
  getBaremes,
  classifierDeclaration,
  validerClassification,
} from "@/services/patente/patenteService";
import { DeclarationPatente, BaremePatente, Pagination, CategoriePatente } from "@/services/patente/types";
import {
  Search, Eye, X, Scale, ChevronLeft, ChevronRight, Check, AlertTriangle, Calculator, CheckCircle2, Zap,
} from "lucide-react";

const CAT_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  petite: { label: "Petite", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: "🏪" },
  moyenne: { label: "Moyenne", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: "🏬" },
  grande: { label: "Grande", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: "🏢" },
};

export default function ClassificationClient() {
  const { utilisateur } = useAuth();
  const [declarations, setDeclarations] = useState<DeclarationPatente[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [baremes, setBaremes] = useState<BaremePatente[]>([]);
  const [showClassify, setShowClassify] = useState(false);
  const [selected, setSelected] = useState<DeclarationPatente | null>(null);
  const [calcResult, setCalcResult] = useState<{ categorie: CategoriePatente; montant: number } | null>(null);
  const [montantFinal, setMontantFinal] = useState("");
  const [motifAjustement, setMotifAjustement] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const load = useCallback(async (page = 1) => {
    if (!utilisateur?.site_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getDeclarations(utilisateur.site_id, page, 20, "soumise");
      if (res.status === "success" && res.data) {
        setDeclarations(res.data.declarations);
        setPagination(res.data.pagination);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [utilisateur?.site_id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const loadBaremes = async () => {
      const res = await getBaremes();
      if (res.status === "success" && res.data) setBaremes(res.data);
    };
    loadBaremes();
  }, []);

  const openClassify = (d: DeclarationPatente) => {
    setSelected(d);
    setError("");
    // Auto-calculate
    const secteur = d.secteur_activite;
    const ca = d.chiffre_affaires_estime;
    const bareme = baremes.find(
      (b) => b.secteur_activite === secteur && b.ca_min <= ca && (b.ca_max === null || b.ca_max >= ca)
    );

    if (bareme) {
      setCalcResult({ categorie: bareme.categorie, montant: bareme.montant_patente });
      setMontantFinal(String(bareme.montant_patente));
    } else {
      setCalcResult({ categorie: "petite", montant: 50 });
      setMontantFinal("50");
    }
    setMotifAjustement("");
    setShowClassify(true);
  };

  const handleClassify = async () => {
    if (!selected || !calcResult || !utilisateur) return;
    setFormLoading(true);
    setError("");
    try {
      const res = await classifierDeclaration({
        declaration_id: selected.id,
        categorie: calcResult.categorie,
        montant_calcule: calcResult.montant,
        montant_final: Number(montantFinal),
        motif_ajustement: montantFinal !== String(calcResult.montant) ? motifAjustement : null,
        criteres: {
          secteur: selected.secteur_activite,
          ca: selected.chiffre_affaires_estime,
          categorie: calcResult.categorie,
        },
        agent_id: utilisateur.id,
        agent_nom: utilisateur.nom_complet,
      });

      if (res.status === "success") {
        // Auto-validate
        if (res.data?.classification_id) {
          await validerClassification(res.data.classification_id, utilisateur.id);
        }
        setSuccess("Déclaration classifiée et patente générée !");
        setShowClassify(false);
        load(pagination.page);
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.message || "Erreur");
      }
    } catch { setError("Erreur serveur"); }
    setFormLoading(false);
  };

  const formatCA = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(v);

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="w-4 h-4" />{success}
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="bg-[#153258] p-1.5 rounded-lg">
            <Scale className="w-5 h-5 text-white" />
          </div>
          Classification — Agent MERI
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Classez les déclarations soumises et générez les patentes</p>
      </div>

      {/* Barèmes preview */}
      <div className="bg-gradient-to-r from-[#153258]/10 to-[#23A974]/10 dark:from-[#153258]/20 dark:to-[#23A974]/20 rounded-xl p-4 border border-[#153258]/20 dark:border-[#153258]/40">
        <h3 className="text-sm font-semibold text-[#153258] dark:text-blue-300 mb-2 flex items-center gap-2">
          <Calculator className="w-4 h-4" /> Barèmes en vigueur
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {(["petite", "moyenne", "grande"] as CategoriePatente[]).map((cat) => {
            const cl = CAT_LABELS[cat];
            const exBareme = baremes.find((b) => b.categorie === cat && b.secteur_activite === "commerce");
            return (
              <div key={cat} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <span>{cl.icon}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${cl.color}`}>{cl.label}</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCA(exBareme?.montant_patente || 0)}</p>
                <p className="text-xs text-gray-400">Commerce (base)</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Déclarations en attente de classification ({pagination.total})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#153258]/5 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Contribuable</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Activité</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Secteur</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">CA estimé</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Année</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto" />
                </td></tr>
              ) : declarations.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  Toutes les déclarations sont traitées
                </td></tr>
              ) : (
                declarations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{d.nom_complet}</p>
                      <p className="text-xs text-gray-400">{d.numero_fiscal}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{d.type_activite}</td>
                    <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-400">{d.secteur_activite}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{formatCA(d.chiffre_affaires_estime)}</td>
                    <td className="px-4 py-3 text-gray-600">{d.annee_fiscale}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openClassify(d)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#153258] to-[#23A974] hover:shadow-lg text-white rounded-lg text-xs font-medium transition-all duration-200">
                        <Zap className="w-3 h-3" /> Classifier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500">Page {pagination.page}/{pagination.totalPages}</span>
            <div className="flex gap-1">
              <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)} className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => load(pagination.page + 1)} className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Classify */}
      {showClassify && selected && calcResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowClassify(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="bg-[#153258] p-2 rounded-lg mr-3">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Classifier la déclaration</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selected.nom_complet}</p>
                </div>
              </div>
              <button onClick={() => setShowClassify(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-4">
              {error && <div className="p-2 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

              {/* Info contribuable */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selected.nom_complet}</p>
                <p className="text-xs text-gray-500">{selected.type_activite} — {selected.secteur_activite}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">CA: {formatCA(selected.chiffre_affaires_estime)}</p>
              </div>

              {/* Résultat calcul auto */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-2">Calcul automatique</p>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${CAT_LABELS[calcResult.categorie]?.color}`}>
                  {CAT_LABELS[calcResult.categorie]?.icon} {CAT_LABELS[calcResult.categorie]?.label} activité
                </span>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCA(calcResult.montant)}</p>
              </div>

              {/* Montant final (modifiable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant final ($)</label>
                <input type="number" min="0" step="0.01" value={montantFinal}
                  onChange={(e) => setMontantFinal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-lg" />
              </div>

              {montantFinal !== String(calcResult.montant) && (
                <div>
                  <label className="block text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">Motif de l&apos;ajustement *</label>
                  <textarea rows={2} value={motifAjustement} onChange={(e) => setMotifAjustement(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-600 bg-white dark:bg-gray-700 text-sm" />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => setShowClassify(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
                <button onClick={handleClassify} disabled={formLoading}
                  className="px-5 py-2.5 text-sm bg-gradient-to-r from-[#153258] to-[#23A974] hover:shadow-lg text-white rounded-lg disabled:opacity-50 flex items-center gap-2 transition-all duration-200">
                  <CheckCircle2 className="w-4 h-4" />
                  {formLoading ? "..." : "Classifier & Générer patente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
