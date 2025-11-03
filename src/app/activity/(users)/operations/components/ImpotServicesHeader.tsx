import { FileText, Calendar, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Impot as ImpotType } from '@/services/impots/impotService';
import { useRouter } from 'next/navigation';

interface ImpotServicesHeaderProps {
  impot: ImpotType;
}

export default function ImpotServicesHeader({ impot }: ImpotServicesHeaderProps) {
  const router = useRouter();

  const getPenaliteInfo = (penalites: any) => {
    if (!penalites || penalites.type === 'aucune') {
      return { text: 'Aucune pénalité', color: 'text-gray-500' };
    }
    
    switch (penalites.type) {
      case 'pourcentage':
        return { text: `${penalites.valeur}% de pénalité`, color: 'text-orange-600' };
      case 'montant_fixe':
        return { text: `${penalites.valeur} FCFA de pénalité`, color: 'text-red-600' };
      default:
        return { text: 'Pénalités spécifiques', color: 'text-yellow-600' };
    }
  };

  const formatDelai = (delai: number) => {
    if (delai === 0) return 'Immédiat';
    if (delai === 1) return '1 jour';
    return `${delai} jours`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      {/* BOUTON RETOUR */}
      <button
        onClick={() => router.back()}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Retour aux impôts</span>
      </button>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* INFORMATIONS PRINCIPALES */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {impot.nom}
              </h1>
              <p className="text-gray-600 text-lg">
                {impot.description}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              impot.actif 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}>
              {impot.actif ? 'Actif' : 'Inactif'}
            </div>
          </div>

          {/* CARACTÉRISTIQUES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <div className="text-sm text-blue-800 font-medium">Période</div>
                <div className="text-blue-700 capitalize">{impot.periode}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <Clock className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <div className="text-sm text-green-800 font-medium">Délai d'accord</div>
                <div className="text-green-700">{formatDelai(impot.delai_accord)}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div>
                <div className="text-sm text-orange-800 font-medium">Pénalités</div>
                <div className={getPenaliteInfo(impot.penalites).color}>
                  {getPenaliteInfo(impot.penalites).text}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATISTIQUES OU ACTIONS RAPIDES */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">Informations</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="font-medium">#{impot.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Créé le:</span>
                <span className="font-medium">
                  {impot.date_creation}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <span className={`font-medium ${
                  impot.actif ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {impot.actif ? 'Opérationnel' : 'Suspendu'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}