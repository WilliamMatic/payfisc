import { Sparkles, Loader2 } from 'lucide-react';

interface AISearchProps {
  aiQuery: string;
  aiResponse: string;
  isLoadingAi: boolean;
  onQueryChange: (query: string) => void;
  onAiSearch: () => void;
}

export default function AISearch({
  aiQuery,
  aiResponse,
  isLoadingAi,
  onQueryChange,
  onAiSearch
}: AISearchProps) {
  const quickPrompts = [
    "Quelle est la taxe la plus déclarée ce mois-ci ?",
    "Comparez les paiements cash et mobile money",
    "Quelles sont les prochaines échéances importantes ?",
    "Quel est le taux de déclaration des entreprises ?"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Assistant IA fiscal</h2>
        <p className="text-gray-600 mt-1">Obtenez des insights intelligents sur vos données fiscales</p>
      </div>
      
      <div className="bg-gradient-to-br from-white to-purple-50/50 rounded-2xl shadow-sm border border-gray-200/60 p-8">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-purple-100 rounded-xl mr-4">
            <Sparkles className="text-purple-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Posez votre question à notre IA fiscale</h3>
            <p className="text-gray-600">Analyse intelligente de vos données en temps réel</p>
          </div>
        </div>
        
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Ex: Quelle est la taxe la plus déclarée ce mois-ci ?"
            className="w-full border border-gray-300 rounded-xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-32"
            value={aiQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onAiSearch()}
          />
          <button 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50"
            onClick={onAiSearch}
            disabled={isLoadingAi || !aiQuery.trim()}
          >
            {isLoadingAi ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Analyser'
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickPrompts.map((prompt, index) => (
            <div 
              key={index}
              className="bg-white/50 rounded-xl p-4 cursor-pointer hover:bg-white transition-all duration-200 border border-transparent hover:border-purple-200"
              onClick={() => onQueryChange(prompt)}
            >
              <p className="text-sm text-gray-700">"{prompt}"</p>
            </div>
          ))}
        </div>
      </div>
      
      {isLoadingAi && (
        <div className="flex justify-center items-center py-12 bg-white/80 rounded-2xl">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Analyse en cours par l'IA...</p>
          </div>
        </div>
      )}
      
      {aiResponse && !isLoadingAi && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-8">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <Sparkles className="text-green-600" size={20} />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Réponse de l'IA fiscale</h3>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 border border-green-200/60">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{aiResponse}</p>
          </div>
        </div>
      )}
    </div>
  );
}