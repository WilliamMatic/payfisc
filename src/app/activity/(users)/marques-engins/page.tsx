import { getMarquesEngins, MarqueEngin } from '@/services/marques-engins/marqueEnginService';
import { getTypeEnginsActifs, TypeEngin } from '@/services/type-engins/typeEnginService';
import MarqueEnginClient from './components/MarqueEnginClient';

export default async function MarquesEnginsPage() {
  try {
    const [marquesResult, typeEnginsResult] = await Promise.all([
      getMarquesEngins(),
      getTypeEnginsActifs()
    ]);

    // Vérification et nettoyage des données des marques
    const marques: MarqueEngin[] =
      marquesResult.status === 'success'
        ? (marquesResult.data || []).filter(
            (marque: MarqueEngin | null | undefined): marque is MarqueEngin =>
              marque !== null && marque !== undefined
          )
        : [];

    // Vérification et nettoyage des données des types d'engins
    const typeEngins: TypeEngin[] =
      typeEnginsResult.status === 'success'
        ? (typeEnginsResult.data || []).filter(
            (typeEngin: TypeEngin | null | undefined): typeEngin is TypeEngin =>
              typeEngin !== null && typeEngin !== undefined
          )
        : [];

    // Gestion des erreurs
    const error: string | null =
      marquesResult.status === 'error' 
        ? marquesResult.message ?? 'Erreur inconnue lors du chargement des marques'
        : typeEnginsResult.status === 'error'
        ? typeEnginsResult.message ?? 'Erreur inconnue lors du chargement des types d\'engins'
        : null;

    return (
      <MarqueEnginClient 
        initialMarques={marques}
        initialTypeEngins={typeEngins}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading marques engins:', error);
    return (
      <MarqueEnginClient 
        initialMarques={[]}
        initialTypeEngins={[]}
        initialError="Erreur lors du chargement des données"
      />
    );
  }
}