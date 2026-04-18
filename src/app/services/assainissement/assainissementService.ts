"use server";

import {
  ApiResponse, Pagination, Axe, TypeTaxe,
  Contribuable, Facture, Paiement, Controle, Sanction, Passage,
  Repartition, RepartitionGlobale, Statistiques, TypeContribuableItem, TypeServiceItem,
  RevenuMensuel, AgentTerrain,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:80/Impot/backend/calls";

// ============================================================
// AXES (anciennement Communes)
// ============================================================
export async function getAxes(siteId: number, page = 1, limit = 50, search = ""): Promise<ApiResponse<{ communes: Axe[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search });
  const res = await fetch(`${API_BASE_URL}/assainissement/lister_communes.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addAxe(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/ajouter_commune.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateAxe(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/modifier_commune.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteAxe(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/supprimer_commune.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// TYPES DE TAXE
// ============================================================
export async function getTypesTaxe(siteId: number): Promise<ApiResponse<TypeTaxe[]>> {
  const res = await fetch(`${API_BASE_URL}/assainissement/lister_types_taxe.php?site_id=${siteId}`, { cache: "no-store" });
  return res.json();
}
export async function addTypeTaxe(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/ajouter_type_taxe.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateTypeTaxe(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/modifier_type_taxe.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteTypeTaxe(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/supprimer_type_taxe.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// TYPES CONTRIBUABLE
// ============================================================
export async function getTypesContribuable(siteId: number): Promise<ApiResponse<TypeContribuableItem[]>> {
  const params = new URLSearchParams({ site_id: String(siteId) });
  const res = await fetch(`${API_BASE_URL}/assainissement/lister_types_contribuable.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addTypeContribuable(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/ajouter_type_contribuable.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateTypeContribuable(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/modifier_type_contribuable.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteTypeContribuable(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/supprimer_type_contribuable.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// CONTRIBUABLES
// ============================================================
export async function getContribuables(siteId: number, page = 1, limit = 20, search = "", axeId = "", type = "", typeTaxeId = ""): Promise<ApiResponse<{ contribuables: Contribuable[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, commune_id: axeId, type, type_taxe_id: typeTaxeId });
  const res = await fetch(`${API_BASE_URL}/assainissement/lister_contribuables.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addContribuable(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/ajouter_contribuable.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateContribuable(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/modifier_contribuable.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteContribuable(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/supprimer_contribuable.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// FACTURES
// ============================================================
export async function getFactures(siteId: number, page = 1, limit = 20, search = "", statut = "", communeId = "", dateDebut = "", dateFin = ""): Promise<ApiResponse<{ factures: Facture[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, statut, commune_id: communeId, date_debut: dateDebut, date_fin: dateFin });
  const res = await fetch(`${API_BASE_URL}/assainissement/lister_factures.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function genererFactures(siteId: number, utilisateurId: number, mois?: string, annee?: string): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/generer_factures.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site_id: siteId, utilisateur_id: utilisateurId, mois, annee }) });
  return res.json();
}
export async function getFacture(id: number): Promise<ApiResponse<Facture>> {
  const res = await fetch(`${API_BASE_URL}/assainissement/get_facture.php?id=${id}`, { cache: "no-store" });
  return res.json();
}
export async function annulerFacture(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/annuler_facture.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// PAIEMENTS
// ============================================================
export async function enregistrerPaiement(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/enregistrer_paiement.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function getPaiements(siteId: number, page = 1, limit = 20, search = "", mode = "", communeId = "", dateDebut = "", dateFin = ""): Promise<ApiResponse<{ paiements: Paiement[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, mode, commune_id: communeId, date_debut: dateDebut, date_fin: dateFin });
  const res = await fetch(`${API_BASE_URL}/assainissement/lister_paiements.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function getPaiement(id: number): Promise<ApiResponse<Paiement>> {
  const res = await fetch(`${API_BASE_URL}/assainissement/get_paiement.php?id=${id}`, { cache: "no-store" });
  return res.json();
}

// Lister tous les paiements (tous sites) pour admin suppression
export async function listerPaiementsAll(page = 1, limit = 20, search = "", mode = "", dateDebut = "", dateFin = ""): Promise<ApiResponse<{ paiements: Paiement[]; sites: { id: number; nom: string; code: string }[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), search, mode, date_debut: dateDebut, date_fin: dateFin });
  const res = await fetch(`${API_BASE_URL}/assainissement/lister_paiements_all.php?${params}`, { cache: "no-store" });
  return res.json();
}

// Supprimer un paiement assainissement
export async function supprimerPaiementAssainissement(id: number): Promise<ApiResponse<{ id: number; reference: string; montant: number; date_suppression: string }>> {
  const res = await fetch(`${API_BASE_URL}/assainissement/supprimer_paiement.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  return res.json();
}

// ============================================================
// CONTROLES
// ============================================================
export async function getControles(siteId: number, page = 1, limit = 20, search = "", resultat = "", dateDebut = "", dateFin = ""): Promise<ApiResponse<{ controles: Controle[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, resultat, date_debut: dateDebut, date_fin: dateFin });
  const res = await fetch(`${API_BASE_URL}/assainissement/lister_controles.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addControle(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/ajouter_controle.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}

// ============================================================
// SANCTIONS
// ============================================================
export async function getSanctions(siteId: number, page = 1, limit = 20, search = "", statut = "", type = ""): Promise<ApiResponse<{ sanctions: Sanction[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, statut, type });
  const res = await fetch(`${API_BASE_URL}/assainissement/lister_sanctions.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addSanction(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/ajouter_sanction.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateStatutSanction(id: number, statut: string): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/modifier_statut_sanction.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, statut }) });
  return res.json();
}

// ============================================================
// TYPES SERVICE
// ============================================================
export async function getTypesService(siteId: number): Promise<ApiResponse<TypeServiceItem[]>> {
  const params = new URLSearchParams({ site_id: String(siteId) });
  const res = await fetch(`${API_BASE_URL}/assainissement/lister_types_service.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addTypeService(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/ajouter_type_service.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateTypeService(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/modifier_type_service.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteTypeService(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/supprimer_type_service.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// PASSAGES
// ============================================================
export async function getPassages(siteId: number, page = 1, limit = 20, search = "", typeService = "", communeId = "", dateDebut = "", dateFin = ""): Promise<ApiResponse<{ passages: Passage[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, type_service: typeService, commune_id: communeId, date_debut: dateDebut, date_fin: dateFin });
  const res = await fetch(`${API_BASE_URL}/assainissement/lister_passages.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addPassage(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/ajouter_passage.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function terminerPassage(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/terminer_passage.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}

// ============================================================
// REPARTITION
// ============================================================
export async function getRepartitionPaiement(paiementId: number): Promise<ApiResponse<Repartition[]>> {
  const res = await fetch(`${API_BASE_URL}/assainissement/repartition_paiement.php?paiement_id=${paiementId}`, { cache: "no-store" });
  return res.json();
}
export async function getRepartitionGlobale(siteId: number, dateDebut = "", dateFin = ""): Promise<ApiResponse<RepartitionGlobale[]>> {
  const params = new URLSearchParams({ site_id: String(siteId), date_debut: dateDebut, date_fin: dateFin });
  const res = await fetch(`${API_BASE_URL}/assainissement/repartition_globale.php?${params}`, { cache: "no-store" });
  return res.json();
}

// ============================================================
// STATISTIQUES
// ============================================================
export async function getStatistiques(siteId: number, dateDebut = "", dateFin = "", axeId = "", type = "", typeTaxeId = ""): Promise<ApiResponse<Statistiques>> {
  const params = new URLSearchParams({ site_id: String(siteId), date_debut: dateDebut, date_fin: dateFin, commune_id: axeId, type, type_taxe_id: typeTaxeId });
  const res = await fetch(`${API_BASE_URL}/assainissement/statistiques.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function getRevenusMensuels(siteId: number, annee: number): Promise<ApiResponse<RevenuMensuel[]>> {
  const params = new URLSearchParams({ site_id: String(siteId), annee: String(annee) });
  const res = await fetch(`${API_BASE_URL}/assainissement/revenus_mensuels.php?${params}`, { cache: "no-store" });
  return res.json();
}

// ============================================================
// AGENTS TERRAIN
// ============================================================
export async function getAgentsTerrain(siteId: number, page = 1, limit = 20, search = ""): Promise<ApiResponse<{ agents: AgentTerrain[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search });
  const res = await fetch(`${API_BASE_URL}/assainissement/lister_agents_terrain.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addAgentTerrain(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/ajouter_agent_terrain.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateAgentTerrain(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/modifier_agent_terrain.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteAgentTerrain(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/supprimer_agent_terrain.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}
export async function toggleAgentTerrain(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/assainissement/toggle_agent_terrain.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}
