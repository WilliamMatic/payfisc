/**
 * Service pour la recherche de plaques
 */

export interface PlaqueResult {
  serie_item_id: number;
  numero_plaque: string;
  statut: '0' | '1'; // '0' = disponible, '1' = utilisé
  nom_serie: string;
  value: string;
}

export interface PlaqueSearchResponse {
  status: 'success' | 'error';
  message?: string;
  data?: PlaqueResult[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

/**
 * Recherche des plaques par terme de recherche
 */
export const rechercherPlaques = async (
  searchTerm: string,
  utilisateur: any
): Promise<PlaqueSearchResponse> => {
  try {
    const formData = new FormData();
    formData.append('search_term', searchTerm);
    formData.append('utilisateur_id', utilisateur.id.toString());
    formData.append('site_id', utilisateur.site_id?.toString() || '1');

    const response = await fetch(`${API_BASE_URL}/immatriculation/rechercher_plaques.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la recherche des plaques',
      };
    }

    return data;
  } catch (error) {
    console.error('Rechercher plaques error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des plaques',
    };
  }
};