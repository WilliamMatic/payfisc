import { getPuissancesFiscales, PuissanceFiscale } from '@/services/puissances-fiscales/puissanceFiscaleService';
import { getTypeEnginsActifs, TypeEngin } from '@/services/type-engins/typeEnginService';
import PuissanceFiscaleClient from './components/PuissanceFiscaleClient';

export default async function PuissancesFiscalesPage() {
  try {
    const [puissancesResult, typeEnginsResult] = await Promise.all([
      getPuissancesFiscales(),
      getTypeEnginsActifs()
    ]);

    // Vérification et nettoyage des données des puissances fiscales
    const puissances: PuissanceFiscale[] =
      puissancesResult.status === 'success'
        ? (puissancesResult.data || []).filter(
            (puissance: PuissanceFiscale | null | undefined): puissance is PuissanceFiscale =>
              puissance !== null && puissance !== undefined
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
      puissancesResult.status === 'error' 
        ? puissancesResult.message ?? 'Erreur inconnue lors du chargement des puissances fiscales'
        : typeEnginsResult.status === 'error'
        ? typeEnginsResult.message ?? 'Erreur inconnue lors du chargement des types d\'engins'
        : null;

    return (
      <PuissanceFiscaleClient 
        initialPuissances={puissances}
        initialTypeEngins={typeEngins}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading puissances fiscales:', error);
    return (
      <PuissanceFiscaleClient 
        initialPuissances={[]}
        initialTypeEngins={[]}
        initialError="Erreur lors du chargement des données"
      />
    );
  }
}