'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

// Interface pour les données d'un partenaire
export interface Partenaire {
  id: number;
  nom: string;
  type_partenaire: 'banque' | 'fintech' | 'institution_financiere' | 'operateur_mobile';
  code_banque: string;
  code_swift: string;
  pays: string;
  ville: string;
  adresse: string;
  telephone: string;
  email: string;
  site_web: string;
  contact_principal: string;
  logo_url: string;
  raison_sociale: string;
  actif: boolean;
  en_maintenance: boolean;
  base_url_api: string;
  timeout_api: number;
  retry_attempts: number;
  ip_whitelist: string;
  bank_id: string;
  total_transactions: number;
  total_montant: number;
  date_creation: string;
}

// Interface pour le détail complet
export interface PartenaireDetail extends Partenaire {
  bp_id: number;
  api_key: string;
  api_secret: string;
  permissions: string;
  limite_transaction_journaliere: number;
  limite_transaction_mensuelle: number;
  montant_minimum: number;
  montant_maximum: number;
  url_webhook_confirmation: string;
  url_webhook_annulation: string;
  secret_webhook: string;
  date_expiration: string;
  ip_autorisees: string;
  user_agent_autorises: string;
  dernier_acces: string;
  bp_actif: boolean;
  suspendu: boolean;
  raison_suspension: string;
  date_creation_formatee: string;
}

export interface ApiResponse {
  status: 'success' | 'error';
  message?: string;
  data?: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

const CACHE_TAGS = {
  PARTENAIRES_LIST: 'partenaires-list',
  PARTENAIRE_DETAILS: (id: number) => `partenaire-${id}`,
};

async function invalidatePartenairesCache(partenaireId?: number) {
  'use server';
  revalidateTag(CACHE_TAGS.PARTENAIRES_LIST, "max");
  if (partenaireId) {
    revalidateTag(CACHE_TAGS.PARTENAIRE_DETAILS(partenaireId), "max");
  }
}

export async function cleanPartenaireData(data: any): Promise<Partenaire> {
  return {
    id: data.id || 0,
    nom: data.nom || '',
    type_partenaire: data.type_partenaire || 'banque',
    code_banque: data.code_banque || '',
    code_swift: data.code_swift || '',
    pays: data.pays || '',
    ville: data.ville || '',
    adresse: data.adresse || '',
    telephone: data.telephone || '',
    email: data.email || '',
    site_web: data.site_web || '',
    contact_principal: data.contact_principal || '',
    logo_url: data.logo_url || '',
    raison_sociale: data.raison_sociale || '',
    actif: Boolean(data.actif),
    en_maintenance: Boolean(data.en_maintenance),
    base_url_api: data.base_url_api || '',
    timeout_api: Number(data.timeout_api) || 30,
    retry_attempts: Number(data.retry_attempts) || 3,
    ip_whitelist: data.ip_whitelist || '[]',
    bank_id: data.bank_id || '',
    total_transactions: Number(data.total_transactions) || 0,
    total_montant: Number(data.total_montant) || 0,
    date_creation: data.date_creation || '',
  };
}

/**
 * Récupère la liste de tous les partenaires (AVEC CACHE - 2 heures)
 */
export async function getPartenaires(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PARTENAIRES_LIST);

  try {
    const response = await fetch(`${API_BASE_URL}/banques/lister_partenaires.php`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (data.status === 'error') {
      return { status: 'error', message: data.message || 'Échec de la récupération des partenaires' };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanPartenaireData(item)))
      : [];

    return { status: 'success', data: cleanedData };
  } catch (error) {
    console.error('Get partenaires error:', error);
    return { status: 'error', message: 'Erreur réseau lors de la récupération des partenaires' };
  }
}

/**
 * Récupère le détail complet d'un partenaire (AVEC CACHE)
 */
export async function getPartenaireDetail(id: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PARTENAIRE_DETAILS(id));

  try {
    const response = await fetch(`${API_BASE_URL}/banques/detail_partenaire.php?id=${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (data.status === 'error') {
      return { status: 'error', message: data.message || 'Échec de la récupération du partenaire' };
    }

    return { status: 'success', data: data.data };
  } catch (error) {
    console.error('Get partenaire detail error:', error);
    return { status: 'error', message: 'Erreur réseau' };
  }
}

/**
 * Ajoute un nouveau partenaire (INVALIDE LE CACHE)
 */
export async function addPartenaire(partenaireData: Record<string, any>): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    Object.entries(partenaireData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE_URL}/banques/creer_partenaire.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (data.status === 'error') {
      return { status: 'error', message: data.message || "Échec de l'ajout du partenaire" };
    }

    await invalidatePartenairesCache();
    return data;
  } catch (error) {
    console.error('Add partenaire error:', error);
    return { status: 'error', message: "Erreur réseau lors de l'ajout du partenaire" };
  }
}

/**
 * Modifie un partenaire existant (INVALIDE LE CACHE)
 */
export async function updatePartenaire(id: number, partenaireData: Record<string, any>): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    Object.entries(partenaireData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE_URL}/banques/modifier_partenaire.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (data.status === 'error') {
      return { status: 'error', message: data.message || 'Échec de la modification du partenaire' };
    }

    await invalidatePartenairesCache(id);
    return data;
  } catch (error) {
    console.error('Update partenaire error:', error);
    return { status: 'error', message: 'Erreur réseau lors de la modification du partenaire' };
  }
}

/**
 * Supprime un partenaire (INVALIDE LE CACHE)
 */
export async function deletePartenaire(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/banques/supprimer_partenaire.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (data.status === 'error') {
      return { status: 'error', message: data.message || 'Échec de la suppression du partenaire' };
    }

    await invalidatePartenairesCache(id);
    return data;
  } catch (error) {
    console.error('Delete partenaire error:', error);
    return { status: 'error', message: 'Erreur réseau lors de la suppression du partenaire' };
  }
}

/**
 * Change le statut actif/inactif d'un partenaire (INVALIDE LE CACHE)
 */
export async function togglePartenaireStatus(id: number, actif: boolean): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/banques/changer_statut_partenaire.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (data.status === 'error') {
      return { status: 'error', message: data.message || 'Échec du changement de statut' };
    }

    await invalidatePartenairesCache(id);
    return data;
  } catch (error) {
    console.error('Toggle partenaire status error:', error);
    return { status: 'error', message: 'Erreur réseau lors du changement de statut' };
  }
}

/**
 * Upload du logo d'un partenaire (INVALIDE LE CACHE)
 */
export async function uploadLogo(id: number, file: File): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('logo', file);

    const response = await fetch(`${API_BASE_URL}/banques/upload_logo.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (data.status === 'error') {
      return { status: 'error', message: data.message || "Échec de l'upload du logo" };
    }

    await invalidatePartenairesCache(id);
    return data;
  } catch (error) {
    console.error('Upload logo error:', error);
    return { status: 'error', message: "Erreur réseau lors de l'upload du logo" };
  }
}
