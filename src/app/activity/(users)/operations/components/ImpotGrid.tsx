import { FileText, Calendar, Clock, AlertTriangle, Landmark, Car, Shield, RefreshCw, ChevronRight } from 'lucide-react';
import { Impot as ImpotType } from '@/services/impots/impotService';
import { useRouter } from 'next/navigation';

interface ImpotGridProps {
  impots: ImpotType[];
  loading: boolean;
}

const getImpotIcon = (id: number) => {
  switch (id) {
    case 11: return Landmark;
    case 12: return RefreshCw;
    case 14: return Car;
    case 19: return Shield;
    default: return FileText;
  }
};

export default function ImpotGrid({ impots, loading }: ImpotGridProps) {
  const router = useRouter();

  const handleAccessImpot = (impot: ImpotType) => {
    router.push(`operations/${impot.id}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full border-[3px] border-gray-200 border-t-[#2D5B7A] animate-spin mx-auto" />
          <p className="mt-4 text-gray-500 font-medium text-sm">Chargement des opérations...</p>
        </div>
      </div>
    );
  }

  if (impots.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-semibold">Aucun impôt trouvé</p>
          <p className="text-gray-400 text-sm mt-1">Les impôts apparaîtront ici une fois créés</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {impots.map((impot) => {
        const IconComponent = getImpotIcon(impot.id);

        return (
          <div
            key={impot.id}
            className="group bg-white rounded-xl border border-gray-200 hover:border-gray-300 overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer"
            onClick={() => handleAccessImpot(impot)}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 flex items-start gap-3.5">
              <div className="bg-[#2D5B7A]/10 p-2.5 rounded-lg flex-shrink-0">
                <IconComponent className="w-5 h-5 text-[#2D5B7A]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[15px] font-semibold text-gray-900 truncate">{impot.nom}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${
                    impot.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {impot.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <p className="text-gray-500 text-[13px] leading-relaxed line-clamp-2">
                  {impot.description}
                </p>
              </div>
            </div>

            {/* Info chips */}
            <div className="px-5 pb-4 flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md text-xs text-gray-600">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="capitalize">{impot.periode}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md text-xs text-gray-600">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{impot.delai_accord === 0 ? 'Immédiat' : `${impot.delai_accord}j`}</span>
              </div>
              {impot.penalites && impot.penalites.type !== 'aucune' && (
                <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-md text-xs text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>
                    {impot.penalites.type === 'pourcentage'
                      ? `${impot.penalites.valeur}%`
                      : impot.penalites.valeur}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-4 flex items-center justify-between">
              <p className="text-[11px] text-gray-400">Depuis le {impot.date_creation}</p>
              <button className="flex items-center gap-1.5 text-[13px] font-medium text-[#2D5B7A] hover:text-[#1a3a5c] transition-colors group/btn">
                <span>Accéder</span>
                <ChevronRight className="w-4 h-4 transform group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}