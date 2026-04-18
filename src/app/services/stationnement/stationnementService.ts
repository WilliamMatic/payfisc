"use server";

import {
  ApiResponse, ZoneStationnement, VehiculeStationnement, ProprietaireStationnement,
  SessionStationnement, PaiementStationnement, ControleStationnement, AmendeStationnement,
  RepartitionStationnement, StatistiquesStationnement, RepartitionGlobale, Pagination,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:80/Impot/backend/calls";

// ============================================================
// ZONES
// ============================================================
export async function getTypesZones(siteId: number): Promise<ApiResponse<{ nom: string; id: number }[]>> {
  const res = await fetch(`${API_BASE_URL}/stationnement/lister_types_zones.php?site_id=${siteId}`, { cache: "no-store" });
  return res.json();
}
export async function addTypeZone(data: Record<string, unknown>): Promise<ApiResponse<{ id: number; nom: string }>> {
  const res = await fetch(`${API_BASE_URL}/stationnement/ajouter_type_zone.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function getZones(siteId: number, page = 1, limit = 20, search = ""): Promise<ApiResponse<{ zones: ZoneStationnement[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search });
  const res = await fetch(`${API_BASE_URL}/stationnement/lister_zones.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addZone(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/stationnement/ajouter_zone.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateZone(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/stationnement/modifier_zone.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteZone(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/stationnement/supprimer_zone.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// VÉHICULES
// ============================================================
export async function getVehicules(siteId: number, page = 1, limit = 20, search = ""): Promise<ApiResponse<{ vehicules: VehiculeStationnement[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search });
  const res = await fetch(`${API_BASE_URL}/stationnement/lister_vehicules.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addVehicule(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/stationnement/ajouter_vehicule.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateVehicule(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/stationnement/modifier_vehicule.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteVehicule(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/stationnement/supprimer_vehicule.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}
export async function searchVehiculeByPlaque(siteId: number, plaque: string): Promise<ApiResponse<VehiculeStationnement[]> & { found?: boolean }> {
  const params = new URLSearchParams({ site_id: String(siteId), plaque });
  const res = await fetch(`${API_BASE_URL}/stationnement/rechercher_vehicule.php?${params}`, { cache: "no-store" });
  return res.json();
}

// ============================================================
// PROPRIÉTAIRES
// ============================================================
export async function getProprietaires(siteId: number, page = 1, limit = 20, search = ""): Promise<ApiResponse<{ proprietaires: ProprietaireStationnement[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search });
  const res = await fetch(`${API_BASE_URL}/stationnement/lister_proprietaires.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function addProprietaire(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/stationnement/ajouter_proprietaire.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function updateProprietaire(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/stationnement/modifier_proprietaire.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function deleteProprietaire(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/stationnement/supprimer_proprietaire.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// STATIONNEMENTS
// ============================================================
export async function enregistrerStationnement(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/stationnement/enregistrer_stationnement.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function getStationnements(siteId: number, page = 1, limit = 20, search = "", zoneId = "", statut = "", dateDebut = "", dateFin = ""): Promise<ApiResponse<{ stationnements: SessionStationnement[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, zone_id: zoneId, statut, date_debut: dateDebut, date_fin: dateFin });
  const res = await fetch(`${API_BASE_URL}/stationnement/lister_stationnements.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function terminerStationnement(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/stationnement/terminer_stationnement.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  return res.json();
}

// ============================================================
// PAIEMENTS
// ============================================================
export async function enregistrerPaiement(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/stationnement/enregistrer_paiement.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function getPaiements(siteId: number, page = 1, limit = 20, search = "", statut = "", mode = "", dateDebut = "", dateFin = ""): Promise<ApiResponse<{ paiements: PaiementStationnement[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, statut, mode, date_debut: dateDebut, date_fin: dateFin });
  const res = await fetch(`${API_BASE_URL}/stationnement/lister_paiements.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function getPaiementById(id: number): Promise<ApiResponse<PaiementStationnement>> {
  const res = await fetch(`${API_BASE_URL}/stationnement/get_paiement.php?id=${id}`, { cache: "no-store" });
  return res.json();
}
export async function getRepartitionPaiement(paiementId: number): Promise<ApiResponse<RepartitionStationnement[]>> {
  const res = await fetch(`${API_BASE_URL}/stationnement/get_repartition.php?paiement_id=${paiementId}`, { cache: "no-store" });
  return res.json();
}

// ============================================================
// CONTRÔLES
// ============================================================
export async function enregistrerControle(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/stationnement/enregistrer_controle.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function getControles(siteId: number, page = 1, limit = 20, search = "", statut = "", dateDebut = "", dateFin = ""): Promise<ApiResponse<{ controles: ControleStationnement[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, statut, date_debut: dateDebut, date_fin: dateFin });
  const res = await fetch(`${API_BASE_URL}/stationnement/lister_controles.php?${params}`, { cache: "no-store" });
  return res.json();
}

// ============================================================
// AMENDES
// ============================================================
export async function enregistrerAmende(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/stationnement/enregistrer_amende.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}
export async function getAmendes(siteId: number, page = 1, limit = 20, search = "", statut = "", dateDebut = "", dateFin = ""): Promise<ApiResponse<{ amendes: AmendeStationnement[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, statut, date_debut: dateDebut, date_fin: dateFin });
  const res = await fetch(`${API_BASE_URL}/stationnement/lister_amendes.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function payerAmende(id: number, modePaiement = "especes", details: { numero_mobile?: string; nom_banque?: string; numero_carte?: string; titulaire_carte?: string } = {}): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/stationnement/payer_amende.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, mode_paiement: modePaiement, ...details }) });
  return res.json();
}

// ============================================================
// STATISTIQUES
// ============================================================
export async function getStatistiques(siteId: number, dateDebut?: string, dateFin?: string, zoneId?: string): Promise<ApiResponse<StatistiquesStationnement>> {
  const params = new URLSearchParams({ site_id: String(siteId) });
  if (dateDebut) params.set("date_debut", dateDebut);
  if (dateFin) params.set("date_fin", dateFin);
  if (zoneId) params.set("zone_id", zoneId);
  const res = await fetch(`${API_BASE_URL}/stationnement/get_statistiques.php?${params}`, { cache: "no-store" });
  return res.json();
}
export async function getRepartitionGlobale(siteId: number, dateDebut?: string, dateFin?: string): Promise<ApiResponse<RepartitionGlobale[]>> {
  const params = new URLSearchParams({ site_id: String(siteId) });
  if (dateDebut) params.set("date_debut", dateDebut);
  if (dateFin) params.set("date_fin", dateFin);
  const res = await fetch(`${API_BASE_URL}/stationnement/get_repartition_globale.php?${params}`, { cache: "no-store" });
  return res.json();
}
