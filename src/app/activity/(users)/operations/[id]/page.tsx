import { getImpots, Impot } from '@/services/impots/impotService';
import ImpotServicesClient from '../components/ImpotServicesClient';
import ReproductionServicesClient from '../components/ReproductionServicesClient';

interface ImpotPageProps {
  params: {
    id: string;
  };
}

export default async function ImpotPage({ params }: ImpotPageProps) {
  try {
    const impotsResult = await getImpots();
    
    if (impotsResult.status === 'error') {
      throw new Error(impotsResult.message);
    }

    const impots: Impot[] = impotsResult.data || [];
    const impot = impots.find(i => i.id === parseInt(params.id));

    if (!impot) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Impôt non trouvé</h1>
            <p className="text-gray-600">L'impôt que vous recherchez n'existe pas.</p>
          </div>
        </div>
      );
    }

    // Si l'ID de l'impôt est 12, retourner ReproductionServicesClient
    if (parseInt(params.id) === 12) {
      return <ReproductionServicesClient impot={impot} />;
    }

    return <ImpotServicesClient impot={impot} />;

  } catch (error) {
    console.error('Error loading impot:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h1>
          <p className="text-gray-600">Une erreur est survenue lors du chargement de l'impôt.</p>
        </div>
      </div>
    );
  }
}