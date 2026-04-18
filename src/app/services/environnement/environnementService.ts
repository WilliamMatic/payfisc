"use server";

import {
  ApiResponse, Pagination, Commune, Quartier, Avenue, TypeActivite, TypePollution,
  NiveauRisque, CategorieTaxe, Contribuable, Evaluation, Facture, Paiement,
  Controle, Sanction, Repartition, RepartitionGlobale, Statistiques,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:80/Impot/backend/calls";

// ============================================================
// COMMUNES
// ============================================================
export async function getCommunes(siteId: number, page = 1, limit = 50, search = ""): Promise<ApiResponse<{ communes: Commune[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search });
  const res = await fetch(`${API_BASE_URL}/environnement/lister_communes.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addCommune(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/ajouter_commune.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateCommune(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/modifier_commune.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteCommune(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/supprimer_commune.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// QUARTIERS
// ============================================================
export async function getQuartiers(siteId: number, communeId?: number, page = 1, limit = 50, search = ""): Promise<ApiResponse<{ quartiers: Quartier[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search });
  if (communeId) params.set("commune_id", String(communeId));
  const res = await fetch(`${API_BASE_URL}/environnement/lister_quartiers.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addQuartier(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/ajouter_quartier.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateQuartier(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/modifier_quartier.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteQuartier(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/supprimer_quartier.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// AVENUES
// ============================================================
export async function getAvenues(siteId: number, quartierId?: number, page = 1, limit = 50, search = ""): Promise<ApiResponse<{ avenues: Avenue[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search });
  if (quartierId) params.set("quartier_id", String(quartierId));
  const res = await fetch(`${API_BASE_URL}/environnement/lister_avenues.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addAvenue(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/ajouter_avenue.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateAvenue(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/modifier_avenue.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteAvenue(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/supprimer_avenue.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// TYPES ACTIVITÉ
// ============================================================
export async function getTypesActivite(siteId: number): Promise<ApiResponse<TypeActivite[]>> {
  const res = await fetch(`${API_BASE_URL}/environnement/lister_types_activite.php?site_id=${siteId}`, { cache: "no-store" });
  return res.json();
}
export async function addTypeActivite(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/ajouter_type_activite.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateTypeActivite(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/modifier_type_activite.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteTypeActivite(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/supprimer_type_activite.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// TYPES POLLUTION
// ============================================================
export async function getTypesPollution(siteId: number): Promise<ApiResponse<TypePollution[]>> {
  const res = await fetch(`${API_BASE_URL}/environnement/lister_types_pollution.php?site_id=${siteId}`, { cache: "no-store" });
  return res.json();
}
export async function addTypePollution(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/ajouter_type_pollution.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateTypePollution(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/modifier_type_pollution.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteTypePollution(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/supprimer_type_pollution.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// NIVEAUX RISQUE
// ============================================================
export async function getNiveauxRisque(siteId: number): Promise<ApiResponse<NiveauRisque[]>> {
  const res = await fetch(`${API_BASE_URL}/environnement/lister_niveaux_risque.php?site_id=${siteId}`, { cache: "no-store" });
  return res.json();
}
export async function addNiveauRisque(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/ajouter_niveau_risque.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateNiveauRisque(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/modifier_niveau_risque.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteNiveauRisque(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/supprimer_niveau_risque.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// CATÉGORIES TAXE
// ============================================================
export async function getCategoriesTaxe(siteId: number): Promise<ApiResponse<CategorieTaxe[]>> {
  const res = await fetch(`${API_BASE_URL}/environnement/lister_categories_taxe.php?site_id=${siteId}`, { cache: "no-store" });
  return res.json();
}
export async function addCategorieTaxe(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/ajouter_categorie_taxe.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateCategorieTaxe(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/modifier_categorie_taxe.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteCategorieTaxe(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/supprimer_categorie_taxe.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// CONTRIBUABLES
// ============================================================
export async function getContribuables(siteId: number, page = 1, limit = 20, search = "", communeId = "", typeActivite = "", niveauRisque = ""): Promise<ApiResponse<{ contribuables: Contribuable[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, commune_id: communeId, type_activite: typeActivite, niveau_risque: niveauRisque });
  const res = await fetch(`${API_BASE_URL}/environnement/lister_contribuables.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addContribuable(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/ajouter_contribuable.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateContribuable(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/modifier_contribuable.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteContribuable(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/supprimer_contribuable.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// ÉVALUATIONS
// ============================================================
export async function getEvaluations(siteId: number, page = 1, limit = 20, search = "", classification = "", communeId = ""): Promise<ApiResponse<{ evaluations: Evaluation[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, classification, commune_id: communeId });
  const res = await fetch(`${API_BASE_URL}/environnement/lister_evaluations.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addEvaluation(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/ajouter_evaluation.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}

// ============================================================
// FACTURES
// ============================================================
export async function getFactures(siteId: number, page = 1, limit = 20, search = "", statut = "", communeId = ""): Promise<ApiResponse<{ factures: Facture[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, statut, commune_id: communeId });
  const res = await fetch(`${API_BASE_URL}/environnement/lister_factures.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addFacture(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/ajouter_facture.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateFacture(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/modifier_facture.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteFacture(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/supprimer_facture.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// PAIEMENTS
// ============================================================
export async function getPaiements(siteId: number, page = 1, limit = 20, search = "", mode = "", communeId = "", dateDebut = "", dateFin = ""): Promise<ApiResponse<{ paiements: Paiement[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, mode, commune_id: communeId, date_debut: dateDebut, date_fin: dateFin });
  const res = await fetch(`${API_BASE_URL}/environnement/lister_paiements.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function enregistrerPaiement(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/enregistrer_paiement.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}

// ============================================================
// RÉPARTITIONS
// ============================================================
export async function getRepartitionPaiement(paiementId: number): Promise<ApiResponse<Repartition[]>> {
  const res = await fetch(`${API_BASE_URL}/environnement/repartition_paiement.php?paiement_id=${paiementId}`, { cache: "no-store" });
  return res.json();
}
export async function getRepartitionGlobale(siteId: number, dateDebut = "", dateFin = ""): Promise<ApiResponse<RepartitionGlobale[]>> {
  const params = new URLSearchParams({ site_id: String(siteId), date_debut: dateDebut, date_fin: dateFin });
  const res = await fetch(`${API_BASE_URL}/environnement/repartition_globale.php?${params}`, { cache: "no-store" });
  return res.json();
}

// ============================================================
// CONTRÔLES
// ============================================================
export async function getControles(siteId: number, page = 1, limit = 20, search = "", typeControle = "", resultat = "", communeId = ""): Promise<ApiResponse<{ controles: Controle[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, type_controle: typeControle, resultat, commune_id: communeId });
  const res = await fetch(`${API_BASE_URL}/environnement/lister_controles.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addControle(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/ajouter_controle.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}

// ============================================================
// SANCTIONS
// ============================================================
export async function getSanctions(siteId: number, page = 1, limit = 20, search = "", type = "", statut = "", communeId = ""): Promise<ApiResponse<{ sanctions: Sanction[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, type, statut, commune_id: communeId });
  const res = await fetch(`${API_BASE_URL}/environnement/lister_sanctions.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addSanction(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/ajouter_sanction.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateStatutSanction(id: number, statut: string): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/modifier_statut_sanction.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, statut }) });
  return res.json();
}
export async function payerSanctionAmende(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/environnement/payer_sanction.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function getRepartitionPaiementSanction(paiementSanctionId: number): Promise<ApiResponse<Repartition[]>> {
  const res = await fetch(`${API_BASE_URL}/environnement/repartition_paiement_sanction.php?paiement_sanction_id=${paiementSanctionId}`, { cache: "no-store" });
  return res.json();
}

// ============================================================
// STATISTIQUES
// ============================================================
export async function getStatistiques(siteId: number, dateDebut = "", dateFin = "", communeId = ""): Promise<ApiResponse<Statistiques>> {
  const params = new URLSearchParams({ site_id: String(siteId), date_debut: dateDebut, date_fin: dateFin, commune_id: communeId });
  const res = await fetch(`${API_BASE_URL}/environnement/statistiques.php?${params}`, { cache: "no-store" });
  return res.json();
}
