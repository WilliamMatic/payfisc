// app/couleurs/page.tsx
import { getCouleurs, EnginCouleur as EnginCouleurType } from '@/services/couleurs/couleurService';
import CouleursClient from './components/CouleursClient';

export default async function CouleursPage() {
  try {
    const result = await getCouleurs();

    // Vérification et nettoyage des données
    const couleurs: EnginCouleurType[] =
      result.status === 'success'
        ? (result.data || []).filter(
            (couleur: EnginCouleurType | null | undefined): couleur is EnginCouleurType =>
              couleur !== null && couleur !== undefined
          )
        : [];

    // Toujours forcer string | null
    const error: string | null =
      result.status === 'error' ? result.message ?? 'Erreur inconnue' : null;

    return (
      <CouleursClient 
        initialCouleurs={couleurs}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading couleurs:', error);
    return (
      <CouleursClient 
        initialCouleurs={[]}
        initialError="Erreur lors du chargement des couleurs"
      />
    );
  }
}