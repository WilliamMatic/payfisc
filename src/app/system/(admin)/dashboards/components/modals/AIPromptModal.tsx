import { Sparkles, X, Send, Loader2 } from 'lucide-react';

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiQuery: string;
  aiResponse: string;
  isLoadingAi: boolean;
  onQueryChange: (query: string) => void;
  onAiSearch: () => void;
}

export default function AIPromptModal({
  isOpen,
  onClose,
  aiQuery,
  aiResponse,
  isLoadingAi,
  onQueryChange,
  onAiSearch
}: AIPromptModalProps) {
  const quickPrompts = [
    "Quelle est la taxe la plus déclarée ce mois-ci ?",
    "Comparez les paiements cash et mobile money",
    "Quelles sont les prochaines échéances importantes ?",
    "Quel est le taux de déclaration des entreprises ?",
    "Analysez l'évolution des recettes fiscales",
    "Quels sont les contribuables les plus actifs ?"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 rounded-lg mr-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Assistant IA Fiscal</h3>
              <p className="text-sm text-gray-500">Analyse intelligente de vos données fiscales</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {/* Zone de saisie */}
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
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* Prompts rapides */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Questions rapides</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickPrompts.map((prompt, index) => (
                <div 
                  key={index}
                  className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-all duration-200 border border-transparent hover:border-purple-200"
                  onClick={() => onQueryChange(prompt)}
                >
                  <p className="text-sm text-gray-700">"{prompt}"</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Réponse de l'IA */}
          {isLoadingAi && (
            <div className="flex justify-center items-center py-12 bg-gray-50 rounded-xl">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Analyse en cours par l'IA...</p>
              </div>
            </div>
          )}
          
          {aiResponse && !isLoadingAi && (
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-200">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <Sparkles className="text-green-600" size={20} />
                </div>
                <h4 className="text-lg font-semibold text-gray-800">Réponse de l'IA fiscale</h4>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{aiResponse}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}