
import { getAdmins, Admin } from '@/services/admins/adminService';
import { getProvinces, Province } from '@/services/provinces/provinceService';
import AdminClient from './components/AdminClient';

export default async function AdminsPage() {
  try {
    const [adminsResult, provincesResult] = await Promise.all([
      getAdmins(),
      getProvinces()
    ]);

    // Vérification et nettoyage des données des administrateurs
    const admins: Admin[] =
      adminsResult.status === 'success'
        ? (adminsResult.data || []).filter(
            (admin: Admin | null | undefined): admin is Admin =>
              admin !== null && admin !== undefined
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
      adminsResult.status === 'error' 
        ? adminsResult.message ?? 'Erreur inconnue lors du chargement des administrateurs'
        : provincesResult.status === 'error'
        ? provincesResult.message ?? 'Erreur inconnue lors du chargement des provinces'
        : null;

    return (
      <AdminClient 
        initialAdmins={admins}
        initialProvinces={provinces}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading admins:', error);
    return (
      <AdminClient 
        initialAdmins={[]}
        initialProvinces={[]}
        initialError="Erreur lors du chargement des données"
      />
    );
  }
}