"use server";

import {
  ApiResponse,
  TypeEnginEmbarquement,
  EnginEmbarquement,
  ContribuableEmbarquement,
  PaiementEmbarquement,
  RepartitionEmbarquement,
  StatistiquesEmbarquement,
  RepartitionGlobale,
  Pagination,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/Impot/backend/calls";

// ============================================================
// TYPES D'ENGINS
// ============================================================

export async function getTypeEngins(
  siteId: number, page = 1, limit = 20, search = ""
): Promise<ApiResponse<{ type_engins: TypeEnginEmbarquement[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search });
  const res = await fetch(`${API_BASE_URL}/embarquement/lister_type_engins.php?${params}`, { cache: "no-store" });
  return res.json();
}

export async function addTypeEngin(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/embarquement/ajouter_type_engin.php`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateTypeEngin(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/embarquement/modifier_type_engin.php`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteTypeEngin(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/embarquement/supprimer_type_engin.php`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
  });
  return res.json();
}

export async function searchTypeEngins(
  siteId: number, search: string
): Promise<ApiResponse<{ id: number; nom: string; prix: number }[]>> {
  const params = new URLSearchParams({ site_id: String(siteId), search });
  const res = await fetch(`${API_BASE_URL}/embarquement/rechercher_type_engins.php?${params}`, { cache: "no-store" });
  return res.json();
}

// ============================================================
// ENGINS
// ============================================================

export async function getEngins(
  siteId: number, page = 1, limit = 20, search = ""
): Promise<ApiResponse<{ engins: EnginEmbarquement[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search });
  const res = await fetch(`${API_BASE_URL}/embarquement/lister_engins.php?${params}`, { cache: "no-store" });
  return res.json();
}

export async function addEngin(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/embarquement/ajouter_engin.php`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateEngin(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/embarquement/modifier_engin.php`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteEngin(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/embarquement/supprimer_engin.php`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
  });
  return res.json();
}

export async function searchEnginByPlaque(
  siteId: number, plaque: string
): Promise<ApiResponse<EnginEmbarquement | null> & { found?: boolean }> {
  const params = new URLSearchParams({ site_id: String(siteId), plaque });
  const res = await fetch(`${API_BASE_URL}/embarquement/rechercher_engin_plaque.php?${params}`, { cache: "no-store" });
  return res.json();
}

// ============================================================
// CONTRIBUABLES
// ============================================================

export async function getContribuables(
  siteId: number, page = 1, limit = 20, search = ""
): Promise<ApiResponse<{ contribuables: ContribuableEmbarquement[]; pagination: Pagination }>> {
  const params = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search });
  const res = await fetch(`${API_BASE_URL}/embarquement/lister_contribuables.php?${params}`, { cache: "no-store" });
  return res.json();
}

export async function addContribuable(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/embarquement/ajouter_contribuable.php`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateContribuable(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/embarquement/modifier_contribuable.php`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteContribuable(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/embarquement/supprimer_contribuable.php`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
  });
  return res.json();
}

// ============================================================
// PAIEMENTS
// ============================================================

export async function enregistrerPaiement(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/embarquement/enregistrer_paiement.php`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  return res.json();
}

export async function getPaiements(
  siteId: number, page = 1, limit = 20, search = "", statut = "", mode = "", dateDebut = "", dateFin = ""
): Promise<ApiResponse<{ paiements: PaiementEmbarquement[]; pagination: Pagination }>> {
  const params = new URLSearchParams({
    site_id: String(siteId), page: String(page), limit: String(limit),
    search, statut, mode, date_debut: dateDebut, date_fin: dateFin,
  });
  const res = await fetch(`${API_BASE_URL}/embarquement/lister_paiements.php?${params}`, { cache: "no-store" });
  return res.json();
}

export async function getPaiementById(
  id: number
): Promise<ApiResponse<PaiementEmbarquement>> {
  const params = new URLSearchParams({ id: String(id) });
  const res = await fetch(`${API_BASE_URL}/embarquement/get_paiement.php?${params}`, { cache: "no-store" });
  return res.json();
}

export async function getRepartitionPaiement(
  paiementId: number
): Promise<ApiResponse<RepartitionEmbarquement[]>> {
  const params = new URLSearchParams({ paiement_id: String(paiementId) });
  const res = await fetch(`${API_BASE_URL}/embarquement/get_repartition.php?${params}`, { cache: "no-store" });
  return res.json();
}

// ============================================================
// STATISTIQUES
// ============================================================

export async function getStatistiques(
  siteId: number, dateDebut?: string, dateFin?: string, typeEnginId?: string
): Promise<ApiResponse<StatistiquesEmbarquement>> {
  const params = new URLSearchParams({ site_id: String(siteId) });
  if (dateDebut) params.set("date_debut", dateDebut);
  if (dateFin) params.set("date_fin", dateFin);
  if (typeEnginId) params.set("type_engin_id", typeEnginId);
  const res = await fetch(`${API_BASE_URL}/embarquement/get_statistiques.php?${params}`, { cache: "no-store" });
  return res.json();
}

export async function getEnginsAvecContribuables(
  siteId: number, dateDebut?: string, dateFin?: string, typeEnginId?: string
): Promise<ApiResponse<Record<string, unknown>[]>> {
  const params = new URLSearchParams({ site_id: String(siteId) });
  if (dateDebut) params.set("date_debut", dateDebut);
  if (dateFin) params.set("date_fin", dateFin);
  if (typeEnginId) params.set("type_engin_id", typeEnginId);
  const res = await fetch(`${API_BASE_URL}/embarquement/get_engins_contribuables.php?${params}`, { cache: "no-store" });
  return res.json();
}

export async function getRepartitionGlobale(
  siteId: number, dateDebut?: string, dateFin?: string
): Promise<ApiResponse<RepartitionGlobale[]>> {
  const params = new URLSearchParams({ site_id: String(siteId) });
  if (dateDebut) params.set("date_debut", dateDebut);
  if (dateFin) params.set("date_fin", dateFin);
  const res = await fetch(`${API_BASE_URL}/embarquement/get_repartition_globale.php?${params}`, { cache: "no-store" });
  return res.json();
}
