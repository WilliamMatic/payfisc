"use server";

import {
  ApiResponse, Pagination, Ville, Commune, Quartier, Avenue,
  RangFiscal, TypeConcession, Affectation, Tarif, Penalite,
  AgentTerrain, Bien, Facture, Paiement,
  Repartition, RepartitionGlobale, CalculImpot,
  StatistiquesFoncier, RevenuMensuel, AuditLog,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:80/Impot/backend/calls";

const getJson = async (url: string) => {
  const r = await fetch(url, { cache: "no-store" });
  return r.json();
};
const postJson = async (url: string, body: unknown) => {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
};

// ===========================================================
// VILLES
// ===========================================================
export async function getVilles(siteId: number, page = 1, limit = 50, search = ""): Promise<ApiResponse<{ villes: Ville[]; pagination: Pagination }>> {
  const p = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search });
  return getJson(`${API_BASE_URL}/foncier/lister_villes.php?${p}`);
}
export async function addVille(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/ajouter_ville.php`, data); }
export async function updateVille(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/modifier_ville.php`, data); }
export async function deleteVille(id: number): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/supprimer_ville.php`, { id }); }

// ===========================================================
// COMMUNES
// ===========================================================
export async function getCommunes(siteId: number, villeId?: number): Promise<ApiResponse<Commune[]>> {
  const p = new URLSearchParams({ site_id: String(siteId) });
  if (villeId) p.set("ville_id", String(villeId));
  return getJson(`${API_BASE_URL}/foncier/lister_communes.php?${p}`);
}
export async function addCommune(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/ajouter_commune.php`, data); }
export async function updateCommune(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/modifier_commune.php`, data); }
export async function deleteCommune(id: number): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/supprimer_commune.php`, { id }); }

// ===========================================================
// QUARTIERS
// ===========================================================
export async function getQuartiers(siteId: number, communeId?: number): Promise<ApiResponse<Quartier[]>> {
  const p = new URLSearchParams({ site_id: String(siteId) });
  if (communeId) p.set("commune_id", String(communeId));
  return getJson(`${API_BASE_URL}/foncier/lister_quartiers.php?${p}`);
}
export async function addQuartier(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/ajouter_quartier.php`, data); }
export async function updateQuartier(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/modifier_quartier.php`, data); }
export async function deleteQuartier(id: number): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/supprimer_quartier.php`, { id }); }

// ===========================================================
// AVENUES
// ===========================================================
export async function getAvenues(siteId: number, quartierId?: number): Promise<ApiResponse<Avenue[]>> {
  const p = new URLSearchParams({ site_id: String(siteId) });
  if (quartierId) p.set("quartier_id", String(quartierId));
  return getJson(`${API_BASE_URL}/foncier/lister_avenues.php?${p}`);
}
export async function addAvenue(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/ajouter_avenue.php`, data); }
export async function updateAvenue(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/modifier_avenue.php`, data); }
export async function deleteAvenue(id: number): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/supprimer_avenue.php`, { id }); }

// ===========================================================
// RANGS FISCAUX
// ===========================================================
export async function getRangs(siteId: number): Promise<ApiResponse<RangFiscal[]>> {
  return getJson(`${API_BASE_URL}/foncier/lister_rangs.php?site_id=${siteId}`);
}
export async function addRang(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/ajouter_rang.php`, data); }
export async function updateRang(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/modifier_rang.php`, data); }
export async function deleteRang(id: number): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/supprimer_rang.php`, { id }); }

// ===========================================================
// TYPES CONCESSION
// ===========================================================
export async function getTypesConcession(siteId: number): Promise<ApiResponse<TypeConcession[]>> {
  return getJson(`${API_BASE_URL}/foncier/lister_types_concession.php?site_id=${siteId}`);
}
export async function addTypeConcession(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/ajouter_type_concession.php`, data); }
export async function updateTypeConcession(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/modifier_type_concession.php`, data); }
export async function deleteTypeConcession(id: number): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/supprimer_type_concession.php`, { id }); }

// ===========================================================
// AFFECTATIONS
// ===========================================================
export async function getAffectations(siteId: number): Promise<ApiResponse<Affectation[]>> {
  return getJson(`${API_BASE_URL}/foncier/lister_affectations.php?site_id=${siteId}`);
}
export async function addAffectation(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/ajouter_affectation.php`, data); }
export async function updateAffectation(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/modifier_affectation.php`, data); }
export async function deleteAffectation(id: number): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/supprimer_affectation.php`, { id }); }

// ===========================================================
// TARIFS
// ===========================================================
export async function getTarifs(siteId: number): Promise<ApiResponse<Tarif[]>> {
  return getJson(`${API_BASE_URL}/foncier/lister_tarifs.php?site_id=${siteId}`);
}
export async function addTarif(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/ajouter_tarif.php`, data); }
export async function updateTarif(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/modifier_tarif.php`, data); }
export async function deleteTarif(id: number): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/supprimer_tarif.php`, { id }); }

// ===========================================================
// PÉNALITÉS
// ===========================================================
export async function getPenalites(siteId: number): Promise<ApiResponse<Penalite[]>> {
  return getJson(`${API_BASE_URL}/foncier/lister_penalites.php?site_id=${siteId}`);
}
export async function addPenalite(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/ajouter_penalite.php`, data); }
export async function updatePenalite(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/modifier_penalite.php`, data); }
export async function deletePenalite(id: number): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/supprimer_penalite.php`, { id }); }

// ===========================================================
// AGENTS TERRAIN
// ===========================================================
export async function getAgentsTerrain(siteId: number, page = 1, limit = 20, search = ""): Promise<ApiResponse<{ agents: AgentTerrain[]; pagination: Pagination }>> {
  const p = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search });
  return getJson(`${API_BASE_URL}/foncier/lister_agents_terrain.php?${p}`);
}
export async function addAgentTerrain(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/ajouter_agent_terrain.php`, data); }
export async function updateAgentTerrain(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/modifier_agent_terrain.php`, data); }
export async function deleteAgentTerrain(id: number): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/supprimer_agent_terrain.php`, { id }); }
export async function loginAgentTerrain(matricule: string, password: string): Promise<ApiResponse<AgentTerrain>> { return postJson(`${API_BASE_URL}/foncier/login_agent_terrain.php`, { matricule, password }); }

// ===========================================================
// BIENS
// ===========================================================
export async function getBiens(siteId: number, page = 1, limit = 20, search = "", statut = "", communeId = "", quartierId = ""): Promise<ApiResponse<{ biens: Bien[]; pagination: Pagination }>> {
  const p = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, statut, commune_id: communeId, quartier_id: quartierId });
  return getJson(`${API_BASE_URL}/foncier/lister_biens.php?${p}`);
}
export async function getBien(id: number): Promise<ApiResponse<Bien>> {
  return getJson(`${API_BASE_URL}/foncier/get_bien.php?id=${id}`);
}
export async function addBien(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/ajouter_bien.php`, data); }
export async function updateBien(data: Record<string, unknown>): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/modifier_bien.php`, data); }
export async function validerBien(id: number, utilisateurId: number): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/valider_bien.php`, { id, utilisateur_id: utilisateurId }); }
export async function rejeterBien(id: number, motif: string, utilisateurId: number): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/rejeter_bien.php`, { id, motif, utilisateur_id: utilisateurId }); }
export async function deleteBien(id: number): Promise<ApiResponse> { return postJson(`${API_BASE_URL}/foncier/supprimer_bien.php`, { id }); }

// ===========================================================
// CALCUL
// ===========================================================
export async function calculerImpot(bienId: number): Promise<ApiResponse<CalculImpot>> {
  return getJson(`${API_BASE_URL}/foncier/calculer_impot.php?bien_id=${bienId}`);
}

// ===========================================================
// FACTURES
// ===========================================================
export async function getFactures(siteId: number, page = 1, limit = 20, search = "", statut = "", annee = "", communeId = ""): Promise<ApiResponse<{ factures: Facture[]; pagination: Pagination }>> {
  const p = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, statut, annee, commune_id: communeId });
  return getJson(`${API_BASE_URL}/foncier/lister_factures.php?${p}`);
}
export async function getFacture(id: number): Promise<ApiResponse<Facture>> {
  return getJson(`${API_BASE_URL}/foncier/get_facture.php?id=${id}`);
}
export async function genererFacturesAnnuelles(siteId: number, annee: number, utilisateurId: number): Promise<ApiResponse> {
  return postJson(`${API_BASE_URL}/foncier/generer_factures_annuelles.php`, { site_id: siteId, annee, utilisateur_id: utilisateurId });
}
export async function genererFactureBien(bienId: number, annee: number, utilisateurId: number): Promise<ApiResponse> {
  return postJson(`${API_BASE_URL}/foncier/generer_facture_bien.php`, { bien_id: bienId, annee, utilisateur_id: utilisateurId });
}
export async function annulerFacture(id: number): Promise<ApiResponse> {
  return postJson(`${API_BASE_URL}/foncier/annuler_facture.php`, { id });
}

// ===========================================================
// PAIEMENTS
// ===========================================================
export async function enregistrerPaiement(data: Record<string, unknown>): Promise<ApiResponse> {
  return postJson(`${API_BASE_URL}/foncier/enregistrer_paiement.php`, data);
}
export async function getPaiements(siteId: number, page = 1, limit = 20, search = "", mode = "", dateDebut = "", dateFin = ""): Promise<ApiResponse<{ paiements: Paiement[]; pagination: Pagination }>> {
  const p = new URLSearchParams({ site_id: String(siteId), page: String(page), limit: String(limit), search, mode, date_debut: dateDebut, date_fin: dateFin });
  return getJson(`${API_BASE_URL}/foncier/lister_paiements.php?${p}`);
}
export async function getPaiement(id: number): Promise<ApiResponse<Paiement>> {
  return getJson(`${API_BASE_URL}/foncier/get_paiement.php?id=${id}`);
}

// ===========================================================
// RÉPARTITIONS
// ===========================================================
export async function getRepartitionPaiement(paiementId: number): Promise<ApiResponse<Repartition[]>> {
  return getJson(`${API_BASE_URL}/foncier/repartition_paiement.php?paiement_id=${paiementId}`);
}
export async function getRepartitionGlobale(siteId: number, dateDebut = "", dateFin = ""): Promise<ApiResponse<RepartitionGlobale[]>> {
  const p = new URLSearchParams({ site_id: String(siteId), date_debut: dateDebut, date_fin: dateFin });
  return getJson(`${API_BASE_URL}/foncier/repartition_globale.php?${p}`);
}

// ===========================================================
// DASHBOARD
// ===========================================================
export async function getStatistiques(siteId: number, annee?: number): Promise<ApiResponse<StatistiquesFoncier>> {
  const p = new URLSearchParams({ site_id: String(siteId) });
  if (annee) p.set("annee", String(annee));
  return getJson(`${API_BASE_URL}/foncier/statistiques.php?${p}`);
}
export async function getRevenusMensuels(siteId: number, annee: number): Promise<ApiResponse<RevenuMensuel[]>> {
  return getJson(`${API_BASE_URL}/foncier/revenus_mensuels.php?site_id=${siteId}&annee=${annee}`);
}

// ===========================================================
// AUDIT
// ===========================================================
export async function getAuditLogs(siteId: number, page = 1, limit = 30): Promise<ApiResponse<{ logs: AuditLog[]; pagination: Pagination }>> {
  return getJson(`${API_BASE_URL}/foncier/lister_audit.php?site_id=${siteId}&page=${page}&limit=${limit}`);
}
