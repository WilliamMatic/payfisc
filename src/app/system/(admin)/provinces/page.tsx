import { getProvinces, Province } from '@/services/provinces/provinceService';
import ProvinceClient from './components/ProvinceClient';

export default async function ProvincesPage() {
  try {
    const result = await getProvinces();

    // Vérification et nettoyage des données
    const provinces: Province[] =
      result.status === 'success'
        ? (result.data || []).filter(
            (province: Province | null | undefined): province is Province =>
              province !== null && province !== undefined
          )
        : [];

    // Toujours forcer string | null
    const error: string | null =
      result.status === 'error' ? result.message ?? 'Erreur inconnue' : null;

    return (
      <ProvinceClient 
        initialProvinces={provinces}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading provinces:', error);
    return (
      <ProvinceClient 
        initialProvinces={[]}
        initialError="Erreur lors du chargement des provinces"
      />
    );
  }
}