import { FileText, Calendar, Clock, AlertTriangle, ArrowLeft, Info, Shield } from 'lucide-react';
import { Impot as ImpotType } from '@/services/impots/impotService';
import { useRouter } from 'next/navigation';

interface ImpotServicesHeaderProps {
  impot: ImpotType;
}

export default function ImpotServicesHeader({ impot }: ImpotServicesHeaderProps) {
  const router = useRouter();

  const getPenaliteText = (penalites: any) => {
    if (!penalites || penalites.type === 'aucune') return 'Aucune pénalité';
    if (penalites.type === 'pourcentage') return `${penalites.valeur}% de pénalité`;
    if (penalites.type === 'montant_fixe') return `${penalites.valeur} FCFA de pénalité`;
    return 'Pénalités spécifiques';
  };

  const formatDelai = (delai: number) => {
    if (delai === 0) return 'Immédiat';
    if (delai === 1) return '1 jour ouvré';
    return `${delai} jours ouvrés`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      {/* Retour */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour aux impôts</span>
      </button>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* Infos principales */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1.5">{impot.nom}</h1>
              <p className="text-gray-500 text-[15px] leading-relaxed max-w-2xl">{impot.description}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 ${
              impot.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${impot.actif ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              {impot.actif ? 'Actif' : 'Inactif'}
            </span>
          </div>

          {/* Caractéristiques */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Période</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 capitalize">{impot.periode}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Délai</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{formatDelai(impot.delai_accord)}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pénalités</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{getPenaliteText(impot.penalites)}</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
            <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-gray-400" />
              Détails
            </h3>

            <div>
              <span className="text-xs text-gray-500">ID</span>
              <p className="text-sm font-mono font-semibold text-gray-900">#{impot.id}</p>
            </div>

            <div>
              <span className="text-xs text-gray-500">Créé le</span>
              <p className="text-sm font-medium text-gray-900">{impot.date_creation}</p>
            </div>

            <div>
              <span className="text-xs text-gray-500">Statut</span>
              <p className={`text-sm font-medium ${impot.actif ? 'text-emerald-600' : 'text-gray-500'}`}>
                {impot.actif ? 'Opérationnel' : 'Suspendu'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}