"use server";

import {
  ContribuablePatente,
  DeclarationPatente,
  PatenteDoc,
  PaiementPatente,
  ControlePatente,
  BaremePatente,
  StatistiquesPatente,
  TypeActivitePatente,
  SecteurActivitePatente,
  Pagination,
  ApiResponse,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/Impot/backend/calls";

// ============================================================
// CONTRIBUABLES
// ============================================================

export async function getContribuables(
  siteId: number,
  page = 1,
  limit = 20,
  search = ""
): Promise<ApiResponse<{ contribuables: ContribuablePatente[]; pagination: Pagination }>> {
  const params = new URLSearchParams({
    site_id: String(siteId),
    page: String(page),
    limit: String(limit),
    ...(search && { search }),
  });
  const res = await fetch(`${API_BASE_URL}/patente/lister_contribuables.php?${params}`, {
    cache: "no-store",
  });
  return res.json();
}

export async function addContribuable(
  data: Record<string, any>
): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/patente/ajouter_contribuable.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateContribuable(
  data: Record<string, any>
): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/patente/modifier_contribuable.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteContribuable(id: number): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/patente/supprimer_contribuable.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  return res.json();
}

// ============================================================
// DECLARATIONS
// ============================================================

export async function getDeclarations(
  siteId: number,
  page = 1,
  limit = 20,
  statut = "",
  search = ""
): Promise<ApiResponse<{ declarations: DeclarationPatente[]; pagination: Pagination }>> {
  const params = new URLSearchParams({
    site_id: String(siteId),
    page: String(page),
    limit: String(limit),
    ...(statut && { statut }),
    ...(search && { search }),
  });
  const res = await fetch(`${API_BASE_URL}/patente/lister_declarations.php?${params}`, {
    cache: "no-store",
  });
  return res.json();
}

export async function addDeclaration(
  data: Record<string, any>
): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/patente/ajouter_declaration.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getDeclarationById(
  id: number
): Promise<ApiResponse<DeclarationPatente>> {
  const res = await fetch(`${API_BASE_URL}/patente/get_declaration.php?id=${id}`, {
    cache: "no-store",
  });
  return res.json();
}

// ============================================================
// CLASSIFICATION (AGENT MERI)
// ============================================================

export async function classifierDeclaration(
  data: Record<string, any>
): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/patente/classifier_declaration.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function validerClassification(
  classificationId: number,
  agentId: number
): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/patente/valider_classification.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ classification_id: classificationId, agent_id: agentId }),
  });
  return res.json();
}

export async function getBaremes(
  secteur?: string
): Promise<ApiResponse<BaremePatente[]>> {
  const params = secteur ? `?secteur=${secteur}` : "";
  const res = await fetch(`${API_BASE_URL}/patente/get_baremes.php${params}`, {
    cache: "no-store",
  });
  return res.json();
}

// ============================================================
// PATENTES
// ============================================================

export async function getPatentes(
  siteId: number,
  page = 1,
  limit = 20,
  statut = "",
  search = "",
  annee?: number
): Promise<ApiResponse<{ patentes: PatenteDoc[]; pagination: Pagination }>> {
  const params = new URLSearchParams({
    site_id: String(siteId),
    page: String(page),
    limit: String(limit),
    ...(statut && { statut }),
    ...(search && { search }),
    ...(annee && { annee: String(annee) }),
  });
  const res = await fetch(`${API_BASE_URL}/patente/lister_patentes.php?${params}`, {
    cache: "no-store",
  });
  return res.json();
}

export async function getPatenteById(
  id: number
): Promise<ApiResponse<PatenteDoc>> {
  const res = await fetch(`${API_BASE_URL}/patente/get_patente.php?id=${id}`, {
    cache: "no-store",
  });
  return res.json();
}

export async function actionPatente(
  data: Record<string, any>
): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/patente/action_patente.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getPatentesExpirant(
  siteId: number,
  jours = 30
): Promise<ApiResponse> {
  const res = await fetch(
    `${API_BASE_URL}/patente/get_expirations.php?site_id=${siteId}&jours=${jours}`,
    { cache: "no-store" }
  );
  return res.json();
}

// ============================================================
// PAIEMENTS
// ============================================================

export async function enregistrerPaiement(
  data: Record<string, any>
): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/patente/enregistrer_paiement.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getPaiements(
  siteId: number,
  page = 1,
  limit = 20,
  search = ""
): Promise<ApiResponse<{ paiements: PaiementPatente[]; pagination: Pagination }>> {
  const params = new URLSearchParams({
    site_id: String(siteId),
    page: String(page),
    limit: String(limit),
    ...(search && { search }),
  });
  const res = await fetch(`${API_BASE_URL}/patente/lister_paiements.php?${params}`, {
    cache: "no-store",
  });
  return res.json();
}

export async function getPaiementById(
  id: number
): Promise<ApiResponse<PaiementPatente>> {
  const res = await fetch(`${API_BASE_URL}/patente/get_paiement.php?id=${id}`, {
    cache: "no-store",
  });
  return res.json();
}

export async function getRepartitionPaiement(
  paiementId: number
): Promise<ApiResponse> {
  const res = await fetch(
    `${API_BASE_URL}/patente/get_repartition_paiement.php?paiement_id=${paiementId}`,
    { cache: "no-store" }
  );
  return res.json();
}

export async function getRecettes(
  siteId: number,
  dateDebut?: string,
  dateFin?: string
): Promise<ApiResponse> {
  const params = new URLSearchParams({ site_id: String(siteId) });
  if (dateDebut) params.append("date_debut", dateDebut);
  if (dateFin) params.append("date_fin", dateFin);
  const res = await fetch(
    `${API_BASE_URL}/patente/get_recettes.php?${params}`,
    { cache: "no-store" }
  );
  return res.json();
}

// ============================================================
// CONTROLES
// ============================================================

export async function ajouterControle(
  data: Record<string, any>
): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/patente/ajouter_controle.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getControles(
  siteId: number,
  page = 1,
  limit = 20,
  resultat = "",
  search = ""
): Promise<ApiResponse<{ controles: ControlePatente[]; pagination: Pagination }>> {
  const params = new URLSearchParams({
    site_id: String(siteId),
    page: String(page),
    limit: String(limit),
    ...(resultat && { resultat }),
    ...(search && { search }),
  });
  const res = await fetch(`${API_BASE_URL}/patente/lister_controles.php?${params}`, {
    cache: "no-store",
  });
  return res.json();
}

export async function verifierQR(qrData: string): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/patente/verifier_qr.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ qr_data: qrData }),
  });
  return res.json();
}

export async function genererPV(
  controleId: number,
  agentId: number,
  agentNom: string
): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/patente/generer_pv.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ controle_id: controleId, agent_id: agentId, agent_nom: agentNom }),
  });
  return res.json();
}

// ============================================================
// DASHBOARD / STATISTIQUES
// ============================================================

export async function getStatistiques(
  siteId: number,
  annee?: number
): Promise<ApiResponse<StatistiquesPatente>> {
  const params = new URLSearchParams({
    site_id: String(siteId),
    ...(annee && { annee: String(annee) }),
  });
  const res = await fetch(`${API_BASE_URL}/patente/get_statistiques.php?${params}`, {
    cache: "no-store",
  });
  return res.json();
}

export async function getDashboardContribuable(
  contribuableId: number
): Promise<ApiResponse> {
  const res = await fetch(
    `${API_BASE_URL}/patente/dashboard_contribuable.php?contribuable_id=${contribuableId}`,
    { cache: "no-store" }
  );
  return res.json();
}

export async function getDossierContribuable(
  contribuableId: number,
  annee?: number
): Promise<ApiResponse> {
  const params = new URLSearchParams({
    contribuable_id: String(contribuableId),
    ...(annee && { annee: String(annee) }),
  });
  const res = await fetch(`${API_BASE_URL}/patente/get_dossier_contribuable.php?${params}`, {
    cache: "no-store",
  });
  return res.json();
}

export async function getListeGlobale(
  siteId: number,
  annee?: number,
  filtre = "",
  search = "",
  page = 1,
  limit = 20
): Promise<ApiResponse> {
  const params = new URLSearchParams({
    site_id: String(siteId),
    page: String(page),
    limit: String(limit),
    ...(annee && { annee: String(annee) }),
    ...(filtre && { filtre }),
    ...(search && { search }),
  });
  const res = await fetch(`${API_BASE_URL}/patente/get_liste_globale.php?${params}`, {
    cache: "no-store",
  });
  return res.json();
}

// ============================================================
// TYPES D'ACTIVITE
// ============================================================

export async function getTypesActivite(): Promise<ApiResponse<TypeActivitePatente[]>> {
  const res = await fetch(`${API_BASE_URL}/patente/lister_types_activite.php`, {
    cache: "no-store",
  });
  return res.json();
}

export async function addTypeActivite(
  libelle: string
): Promise<ApiResponse<TypeActivitePatente>> {
  const res = await fetch(`${API_BASE_URL}/patente/ajouter_type_activite.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ libelle }),
  });
  return res.json();
}

// ============================================================
// SECTEURS D'ACTIVITE
// ============================================================

export async function getSecteursActivite(): Promise<ApiResponse<SecteurActivitePatente[]>> {
  const res = await fetch(`${API_BASE_URL}/patente/lister_secteurs_activite.php`, {
    cache: "no-store",
  });
  return res.json();
}

export async function addSecteurActivite(
  code: string,
  libelle: string,
  icone = "📦"
): Promise<ApiResponse<SecteurActivitePatente>> {
  const res = await fetch(`${API_BASE_URL}/patente/ajouter_secteur_activite.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, libelle, icone }),
  });
  return res.json();
}
