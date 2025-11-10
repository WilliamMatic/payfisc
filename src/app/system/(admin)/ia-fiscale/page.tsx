// app/ia-fiscale/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { poserQuestionIAFiscale, genererAnalyseFiscale, verifierConformiteFiscale } from '@/services/ia/iaFiscaleService';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  donneesContexte?: any;
}

export default function IAFiscale() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Bonjour ! Je suis votre assistant IA fiscal spécialisé dans l\'immatriculation des engins. Je peux vous aider avec les données des particuliers, les plaques, les paiements, les sites d\'enregistrement, les localités, et toute question fiscale. Comment puis-je vous aider aujourd\'hui ?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const resultat = await poserQuestionIAFiscale(inputValue);
      
      const iaResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: resultat.status === 'success' 
          ? resultat.data 
          : `Désolé, je n'ai pas pu traiter votre demande. Erreur: ${resultat.message}`,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, iaResponse]);
    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Une erreur est survenue lors du traitement de votre question. Veuillez réessayer.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyseGenerale = async () => {
    setIsAnalyzing(true);
    
    const messageChargement: Message = {
      id: Date.now().toString(),
      content: '🔄 Génération de l\'analyse fiscale complète en cours... Cette analyse inclut les sites, localités et données temporelles.',
      isUser: false,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, messageChargement]);

    try {
      const resultat = await genererAnalyseFiscale();
      
      const iaResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: resultat.status === 'success' 
          ? `## 📊 Analyse Fiscale Complète\n\n${resultat.data}`
          : `❌ Erreur lors de l'analyse: ${resultat.message}`,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, iaResponse]);
    } catch (error) {
      console.error('Erreur analyse:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Une erreur est survenue lors de l\'analyse fiscale.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVerificationConformite = async () => {
    const nif = prompt('Entrez le NIF du particulier à vérifier:');
    if (!nif) return;

    setIsLoading(true);
    
    const messageChargement: Message = {
      id: Date.now().toString(),
      content: `🔍 Vérification de la conformité fiscale pour le NIF: ${nif}... (incluant localisation et sites)`,
      isUser: false,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, messageChargement]);

    try {
      const resultat = await verifierConformiteFiscale(nif);
      
      const iaResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: resultat.status === 'success' 
          ? `## ✅ Rapport de Conformité Fiscale - NIF: ${nif}\n\n${resultat.data}`
          : `❌ ${resultat.message}`,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, iaResponse]);
    } catch (error) {
      console.error('Erreur vérification:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Une erreur est survenue lors de la vérification de conformité.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessageContent = (content: string) => {
    // Conversion basique du markdown
    const formattedContent = content
      .replace(/## (.*?)\n/g, '<h2 class="text-lg font-semibold mb-2">$1</h2>')
      .replace(/\n/g, '<br />')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

    return <div dangerouslySetInnerHTML={{ __html: formattedContent }} />;
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Section Chat principale */}
      <section className="py-8 px-4 -mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl shadow-[#2D5B7A]/10 border border-gray-100 overflow-hidden">
            {/* En-tête du chat avec actions */}
            <div className="bg-gradient-to-r from-[#2D5B7A] to-[#3A7A5F] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">IA Fiscal - Assistant Immobilisation</h2>
                    <p className="text-blue-100 text-sm">Système d'immatriculation • Données temps réel • Sites & Localités</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleAnalyseGenerale}
                    disabled={isAnalyzing}
                    className="px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 disabled:opacity-50 transition-all duration-200 text-sm font-medium backdrop-blur-sm flex items-center space-x-2"
                  >
                    {isAnalyzing ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    )}
                    <span>{isAnalyzing ? 'Analyse...' : 'Analyse générale'}</span>
                  </button>
                  <button
                    onClick={handleVerificationConformite}
                    disabled={isLoading}
                    className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-all duration-200 text-sm font-medium flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Vérifier conformité</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Zone des messages */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex max-w-[85%] space-x-3">
                    {!message.isUser && (
                      <div className="flex-shrink-0 w-8 h-8 bg-[#3A7A5F] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl p-4 ${
                        message.isUser
                          ? 'bg-gradient-to-br from-[#2D5B7A] to-[#2D5B7A] text-white rounded-br-none shadow-lg shadow-[#2D5B7A]/25'
                          : 'bg-white text-gray-800 rounded-bl-none border border-gray-200 shadow-lg shadow-gray-200/50'
                      }`}
                    >
                      <div className={`text-xs font-medium mb-2 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.isUser ? 'Vous' : 'IA Fiscal'} • {formatTime(message.timestamp)}
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {renderMessageContent(message.content)}
                      </div>
                    </div>
                    {message.isUser && (
                      <div className="flex-shrink-0 w-8 h-8 bg-[#2D5B7A] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex space-x-3 max-w-[85%]">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#3A7A5F] rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-4 shadow-lg shadow-gray-200/50">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-[#3A7A5F] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[#3A7A5F] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-[#3A7A5F] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie */}
            <div className="border-t border-gray-100 p-6 bg-white">
              <form onSubmit={handleSubmit} className="flex space-x-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Posez votre question sur les immatriculations, les particuliers, les plaques, les paiements, les sites, les localités..."
                    className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#2D5B7A]/20 focus:border-[#2D5B7A] transition-all duration-200 bg-gray-50/50 backdrop-blur-sm"
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="px-8 py-4 bg-gradient-to-r from-[#2D5B7A] to-[#3A7A5F] text-white rounded-2xl hover:from-[#255170] hover:to-[#327055] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg shadow-[#2D5B7A]/25 hover:shadow-[#2D5B7A]/40 flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Analyse...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Envoyer</span>
                    </>
                  )}
                </button>
              </form>
              
              {/* Suggestions rapides */}
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Questions fréquentes :
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    "Liste des particuliers avec plusieurs véhicules ?",
                    "Statut des plaques série AB ?",
                    "Paiements du dernier mois ?",
                    "Véhicules par type d'énergie ?",
                    "Sites d'enregistrement à Kinshasa ?",
                    "Motos immatriculées à Maniema ?",
                    "Dernières modifications des engins ?"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInputValue(suggestion)}
                      className="text-sm px-4 py-2 bg-[#2D5B7A]/10 text-[#2D5B7A] rounded-xl hover:bg-[#2D5B7A]/20 transition-all duration-200 border border-[#2D5B7A]/20 hover:border-[#2D5B7A]/30 font-medium"
                      disabled={isLoading}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section informations légales */}
      <section className="py-8 px-4 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-2xl mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-600 max-w-4xl mx-auto leading-relaxed">
            <strong>Information importante :</strong> L'IA analyse les données temps réel du système d'immatriculation. 
            Les réponses sont basées sur les données disponibles des tables SQL (particuliers, engins, paiements, séries, sites, provinces, audits). 
            Pour des situations complexes, consultez toujours un expert fiscal agréé.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Données temps réel</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Sites & Localités</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Analyse contextuelle</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Audits & Historique</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}