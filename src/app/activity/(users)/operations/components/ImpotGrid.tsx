import { FileText, Calendar, Clock, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { Impot as ImpotType } from '@/services/impots/impotService';
import { useRouter } from 'next/navigation';

interface ImpotGridProps {
  impots: ImpotType[];
  loading: boolean;
}

export default function ImpotGrid({ impots, loading }: ImpotGridProps) {
  const router = useRouter();

  const handleAccessImpot = (impot: ImpotType) => {
    // Redirection vers la page des services de cet impôt spécifique
    router.push(`operations/${impot.id}`);
  };

  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des impôts...</span>
        </div>
      </div>
    );
  }

  const getStatusBadge = (actif: boolean) => {
    return actif 
      ? 'bg-green-50 text-green-700 border border-green-100' 
      : 'bg-gray-100 text-gray-600 border border-gray-200';
  };

  const getPeriodeIcon = (periode: string) => {
    switch (periode.toLowerCase()) {
      case 'mensuel':
        return '📅';
      case 'trimestriel':
        return '📊';
      case 'semestriel':
        return '📈';
      case 'annuel':
        return '📆';
      default:
        return '📋';
    }
  };

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
    <div className="flex-1">
      {impots.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucun impôt trouvé</p>
            <p className="text-gray-400 text-sm mt-1">
                Aucun résultat pour votre recherche' : 'Les impôts apparaîtront ici une fois créés
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {impots.map((impot) => (
            <div
              key={impot.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer"
              onClick={() => handleAccessImpot(impot)}
            >
              {/* EN-TÊTE DE LA CARTE */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="bg-blue-50 p-2 rounded-lg mr-3">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(impot.actif)}`}>
                      {impot.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="text-2xl">
                    {getPeriodeIcon(impot.periode)}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                  {impot.nom}
                </h3>
                
                <p className="text-gray-600 text-sm line-clamp-3">
                  {impot.description}
                </p>
              </div>

              {/* INFORMATIONS DÉTAILLÉES */}
              <div className="p-5 space-y-3">
                {/* PÉRIODE */}
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="capitalize">{impot.periode}</span>
                </div>

                {/* DÉLAI D'ACCORD */}
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Délai: {formatDelai(impot.delai_accord)}</span>
                </div>

                {/* PÉNALITÉS */}
                <div className="flex items-center text-sm">
                  <AlertTriangle className="w-4 h-4 mr-2 text-gray-400" />
                  <span className={getPenaliteInfo(impot.penalites).color}>
                    {getPenaliteInfo(impot.penalites).text}
                  </span>
                </div>

                {/* DATE DE CRÉATION */}
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  Créé le {impot.date_creation}
                </div>
              </div>

              {/* BOUTON ACCÉDER */}
              <div className="px-5 pb-5">
                <div className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#2D5B7A] text-white rounded-lg hover:bg-[#234761] transition-colors group/button">
                  <span className="font-medium text-sm">
                    Accéder aux services
                  </span>
                  <ArrowRight className="w-4 h-4 transform group-hover/button:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}