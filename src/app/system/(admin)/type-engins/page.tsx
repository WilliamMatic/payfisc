// app/type-engins/page.tsx
import { getTypeEngins, TypeEngin as TypeEnginType } from '@/services/type-engins/typeEnginService';
import TypeEnginsClient from './components/TypeEnginsClient';

export default async function TypeEnginsPage() {
  try {
    const result = await getTypeEngins();

    // Vérification et nettoyage des données
    const typeEngins: TypeEnginType[] =
      result.status === 'success'
        ? (result.data || []).filter(
            (typeEngin: TypeEnginType | null | undefined): typeEngin is TypeEnginType =>
              typeEngin !== null && typeEngin !== undefined
          )
        : [];

    // Toujours forcer string | null
    const error: string | null =
      result.status === 'error' ? result.message ?? 'Erreur inconnue' : null;

    return (
      <TypeEnginsClient 
        initialTypeEngins={typeEngins}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading type engins:', error);
    return (
      <TypeEnginsClient 
        initialTypeEngins={[]}
        initialError="Erreur lors du chargement des types d'engins"
      />
    );
  }
}