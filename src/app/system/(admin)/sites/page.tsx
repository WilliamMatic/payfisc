import { getSites, Site } from '@/services/sites/siteService';
import { getProvinces, Province } from '@/services/provinces/provinceService';
import SiteClient from './components/SiteClient';

export default async function SitesPage() {
  try {
    const [sitesResult, provincesResult] = await Promise.all([
      getSites(),
      getProvinces()
    ]);

    // Vérification et nettoyage des données des sites
    const sites: Site[] =
      sitesResult.status === 'success'
        ? (sitesResult.data || []).filter(
            (site: Site | null | undefined): site is Site =>
              site !== null && site !== undefined
          )
        : [];

    // Vérification et nettoyage des données des provinces
    const provinces: Province[] =
      provincesResult.status === 'success'
        ? (provincesResult.data || []).filter(
            (province: Province | null | undefined): province is Province =>
              province !== null && province !== undefined
          )
        : [];

    // Gestion des erreurs
    const error: string | null =
      sitesResult.status === 'error' 
        ? sitesResult.message ?? 'Erreur inconnue lors du chargement des sites'
        : provincesResult.status === 'error'
        ? provincesResult.message ?? 'Erreur inconnue lors du chargement des provinces'
        : null;

    return (
      <SiteClient 
        initialSites={sites}
        initialProvinces={provinces}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading sites:', error);
    return (
      <SiteClient 
        initialSites={[]}
        initialProvinces={[]}
        initialError="Erreur lors du chargement des données"
      />
    );
  }
}