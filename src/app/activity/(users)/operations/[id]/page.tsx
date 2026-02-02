import { getImpots, Impot } from '@/services/impots/impotService';
import ImpotServicesClient from '../components/ImpotServicesClient';
import ReproductionServicesClient from '../components/ReproductionServicesClient';
import VignetteServicesClient from '../components/VignetteServicesClient';

interface ImpotPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ImpotPage({ params }: ImpotPageProps) {
  try {
    // ✅ CORRECTION : Await params AVANT de l'utiliser
    const { id } = await params;
    
    const impotsResult = await getImpots();
    
    if (impotsResult.status === 'error') {
      throw new Error(impotsResult.message);
    }

    const impots: Impot[] = impotsResult.data || [];
    const impot = impots.find(i => i.id === parseInt(id));

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

    // ✅ Utiliser directement 'id' au lieu de resolvedParams.id
    if (parseInt(id) === 12) {
      return <ReproductionServicesClient impot={impot} />;
    }

    if (parseInt(id) === 14) {
      return <VignetteServicesClient impot={impot} />;
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