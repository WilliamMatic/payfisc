import { 
  getUtilisateurs, 
  Utilisateur as UtilisateurType,
  getSitesActifs,
  Site 
} from '@/services/utilisateurs/utilisateurService';
import UtilisateurClient from './components/UtilisateurClient';

export default async function UtilisateursPage() {
  try {
    const [utilisateursResult, sitesResult] = await Promise.all([
      getUtilisateurs(),
      getSitesActifs()
    ]);

    // Vérification et nettoyage des données utilisateurs
    const utilisateurs: UtilisateurType[] =
      utilisateursResult.status === 'success'
        ? (utilisateursResult.data || []).filter(
            (utilisateur: UtilisateurType | null | undefined): utilisateur is UtilisateurType =>
              utilisateur !== null && utilisateur !== undefined
          )
        : [];

    // Vérification et nettoyage des données sites
    const sites: Site[] =
      sitesResult.status === 'success'
        ? (sitesResult.data || []).filter(
            (site: Site | null | undefined): site is Site =>
              site !== null && site !== undefined
          )
        : [];

    // Gestion des erreurs
    const error: string | null =
      utilisateursResult.status === 'error' 
        ? utilisateursResult.message ?? 'Erreur inconnue' 
        : sitesResult.status === 'error'
        ? sitesResult.message ?? 'Erreur lors du chargement des sites'
        : null;

    return (
      <UtilisateurClient 
        initialUtilisateurs={utilisateurs}
        initialSites={sites}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading utilisateurs:', error);
    return (
      <UtilisateurClient 
        initialUtilisateurs={[]}
        initialSites={[]}
        initialError="Erreur lors du chargement des utilisateurs"
      />
    );
  }
}