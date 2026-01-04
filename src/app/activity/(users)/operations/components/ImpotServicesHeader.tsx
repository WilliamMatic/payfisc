import { FileText, Calendar, Clock, AlertTriangle, ArrowLeft, Info, Shield, Zap, TrendingUp, ExternalLink } from 'lucide-react';
import { Impot as ImpotType } from '@/services/impots/impotService';
import { useRouter } from 'next/navigation';

interface ImpotServicesHeaderProps {
  impot: ImpotType;
}

export default function ImpotServicesHeader({ impot }: ImpotServicesHeaderProps) {
  const router = useRouter();

  const getPenaliteInfo = (penalites: any) => {
    if (!penalites || penalites.type === 'aucune') {
      return { 
        text: 'Aucune pénalité', 
        color: 'text-gray-600',
        bg: 'bg-gradient-to-r from-gray-100 to-gray-50',
        border: 'border-gray-200',
        iconColor: 'text-gray-500'
      };
    }
    
    switch (penalites.type) {
      case 'pourcentage':
        return { 
          text: `${penalites.valeur}% de pénalité`, 
          color: 'text-amber-700',
          bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
          border: 'border-amber-200',
          iconColor: 'text-amber-600'
        };
      case 'montant_fixe':
        return { 
          text: `${penalites.valeur} FCFA de pénalité`, 
          color: 'text-rose-700',
          bg: 'bg-gradient-to-r from-rose-50 to-pink-50',
          border: 'border-rose-200',
          iconColor: 'text-rose-600'
        };
      default:
        return { 
          text: 'Pénalités spécifiques', 
          color: 'text-yellow-700',
          bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
          border: 'border-yellow-200',
          iconColor: 'text-yellow-600'
        };
    }
  };

  const formatDelai = (delai: number) => {
    if (delai === 0) return 'Immédiat';
    if (delai === 1) return '1 jour ouvré';
    return `${delai} jours ouvrés`;
  };

  const getStatusGradient = (actif: boolean) => {
    return actif 
      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
      : 'bg-gradient-to-r from-gray-400 to-gray-500';
  };

  const penaliteInfo = getPenaliteInfo(impot.penalites);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-300/20 p-8 mb-8 relative overflow-hidden">
      {/* ARRIÈRE-PLAN DÉCORATIF */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/5 to-teal-500/5 rounded-full translate-y-24 -translate-x-24"></div>

      {/* BOUTON RETOUR MODERNE */}
      <button
        onClick={() => router.back()}
        className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 transition-all duration-300 group mb-8 bg-white/80 backdrop-blur-sm rounded-xl p-3 w-fit border border-gray-300/30 hover:border-gray-400/50 hover:shadow-lg"
      >
        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Retour aux impôts</span>
          <span className="text-xs text-gray-500">Navigation rapide</span>
        </div>
      </button>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 relative z-10">
        {/* INFORMATIONS PRINCIPALES - MODERNISÉ */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              {/* BADGE DE CATÉGORIE */}
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full mb-4 border border-blue-500/20">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Service Fiscal 2026
                </span>
              </div>

              {/* TITRE AVEC DÉGRADÉ */}
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                {impot.nom}
                <span className="text-emerald-600 ml-2">·</span>
              </h1>
              
              {/* DESCRIPTION AMÉLIORÉE */}
              <p className="text-gray-600 text-lg leading-relaxed max-w-3xl">
                {impot.description}
                <span className="inline-flex items-center ml-2 text-blue-600 hover:text-blue-700 cursor-pointer group/info">
                  <Info className="w-4 h-4 ml-1 opacity-0 group-hover/info:opacity-100 transition-opacity" />
                </span>
              </p>
            </div>
            
            {/* STATUT DYNAMIQUE */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${impot.actif ? 'bg-gradient-to-r from-emerald-50 to-teal-50' : 'bg-gradient-to-r from-gray-100 to-gray-200'} border ${impot.actif ? 'border-emerald-200' : 'border-gray-300'} shadow-sm`}>
              <div className={`w-2 h-2 rounded-full ${getStatusGradient(impot.actif)} animate-pulse`}></div>
              <span className={`text-sm font-semibold ${impot.actif ? 'text-emerald-700' : 'text-gray-600'}`}>
                {impot.actif ? '✅ Actif & Opérationnel' : '⏸️ Temporairement inactif'}
              </span>
            </div>
          </div>

          {/* CARACTÉRISTIQUES EN GRID MODERNE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {/* PÉRIODE CARD */}
            <div className="group relative bg-gradient-to-br from-white to-blue-50 rounded-xl border border-blue-200/50 p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <div className="absolute top-3 right-3">
                <Calendar className="w-5 h-5 text-blue-500 opacity-80" />
              </div>
              <div>
                <div className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1">Période fiscale</div>
                <div className="text-lg font-bold text-gray-900 capitalize">{impot.periode}</div>
                <div className="text-xs text-blue-600 mt-2 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Cycle 2026
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            {/* DÉLAI CARD */}
            <div className="group relative bg-gradient-to-br from-white to-emerald-50 rounded-xl border border-emerald-200/50 p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <div className="absolute top-3 right-3">
                <Zap className="w-5 h-5 text-emerald-500 opacity-80" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">Délai d'accord</div>
                <div className="text-lg font-bold text-gray-900">{formatDelai(impot.delai_accord)}</div>
                <div className="text-xs text-emerald-600 mt-2 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {impot.delai_accord === 0 ? 'Traitement instantané' : 'Délai garanti'}
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            {/* PÉNALITÉS CARD */}
            <div className="group relative bg-gradient-to-br from-white to-amber-50 rounded-xl border border-amber-200/50 p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <div className="absolute top-3 right-3">
                <Shield className="w-5 h-5 text-amber-500 opacity-80" />
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">Pénalités applicables</div>
                <div className={`text-lg font-bold ${penaliteInfo.color}`}>
                  {penaliteInfo.text}
                </div>
                <div className="text-xs text-amber-600 mt-2 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Conformité DGI 2026
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
        </div>

        {/* SIDEBAR INFORMATIONS - REDESIGN */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 border border-gray-700 shadow-2xl relative overflow-hidden">
            {/* EFFET DE LUMIÈRE */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-16 translate-x-16"></div>
            
            <h3 className="font-bold text-lg text-white mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-400" />
              Détails du service
            </h3>
            
            <div className="space-y-4 relative z-10">
              {/* ID AVEC COPY */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-700/80 rounded-xl p-3 border border-gray-600/50 group hover:border-blue-500/30 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400 font-medium">ID unique</span>
                  <button className="text-xs text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    Copier
                  </button>
                </div>
                <div className="text-sm font-mono text-white font-bold tracking-wide">
                  #{impot.id}
                </div>
              </div>

              {/* DATE DE CRÉATION */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-700/80 rounded-xl p-3 border border-gray-600/50">
                <div className="text-xs text-gray-400 font-medium mb-1">Créé le</div>
                <div className="text-sm text-white font-semibold flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-2 text-blue-400" />
                  {impot.date_creation}
                </div>
              </div>

              {/* STATUT AVANCÉ */}
              <div className={`rounded-xl p-3 border ${impot.actif ? 'border-emerald-500/30' : 'border-gray-600/50'} ${impot.actif ? 'bg-gradient-to-r from-emerald-900/30 to-teal-900/20' : 'bg-gradient-to-r from-gray-800 to-gray-700/80'}`}>
                <div className="text-xs text-gray-400 font-medium mb-1">Statut opérationnel</div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${impot.actif ? 'text-emerald-300' : 'text-gray-300'}`}>
                    {impot.actif ? '🟢 Opérationnel' : '⚫ Suspendu'}
                  </span>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${impot.actif ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
                </div>
                {impot.actif && (
                  <div className="text-xs text-emerald-400 mt-2 flex items-center">
                    <Zap className="w-3 h-3 mr-1" />
                    Tous services disponibles
                  </div>
                )}
              </div>

              {/* BOUTON ACTION */}
              <button 
                onClick={() => {/* Action supplémentaire */}}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl py-3 px-4 font-semibold text-sm flex items-center justify-center space-x-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] mt-2"
              >
                <span>Voir la documentation</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* FOOTER */}
            <div className="mt-6 pt-4 border-t border-gray-700/50">
              <div className="text-xs text-gray-500 text-center">
                Version 2026.1 • DGI Compliant
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BANDEAU D'INFORMATION DYNAMIQUE */}
      <div className="mt-8 pt-6 border-t border-gray-200/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Service mis à jour pour 2026 avec nouvelles fonctionnalités</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full border border-blue-200">
              🔄 Live Updates
            </span>
            <span className="text-xs px-3 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 rounded-full border border-emerald-200">
              ⚡ Performance 2026
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}