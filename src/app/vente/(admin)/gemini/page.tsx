'use client';

import { useState, useRef, useEffect } from 'react';
import { askGemini } from '../../../services/ia/geminiService';

export default function GeminiScreen() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Gestion des messages flash
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    messageTimeoutRef.current = setTimeout(() => setMessage(null), 3000);
  };

  // Appel au service Gemini
  const handleAsk = async () => {
    if (!question.trim()) {
      showMessage('Veuillez saisir une question.', 'error');
      return;
    }

    setLoading(true);
    setResponse('');

    try {
      const res = await askGemini(question.trim());
      if (res.status === 'success') {
        setResponse(res.data);
      } else {
        showMessage(res.message || 'Erreur lors de la génération de la réponse', 'error');
      }
    } catch (error: any) {
      console.error('GeminiScreen error:', error);
      showMessage(error.message || 'Erreur inattendue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-500 py-5 px-4 flex justify-center items-start">
      <div className="w-full max-w-3xl bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-5 md:p-8 border border-white/20">
        <header className="text-center mb-8 pb-6 border-b border-blue-200/30">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-3">
            Assistant IA Gemini
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto font-medium text-sm md:text-base">
            Posez votre question et obtenez une réponse générée par Google Gemini.
          </p>
        </header>

        <div className="mb-4">
          <label htmlFor="question" className="block font-semibold text-gray-700 mb-1 text-sm">
            Votre question *
          </label>
          <input
            type="text"
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex: Donne-moi une citation inspirante"
            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-xl transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <div className="flex justify-center gap-3 mb-4">
          <button
            onClick={handleAsk}
            disabled={loading}
            className={`px-4 py-2 text-sm rounded-xl font-semibold text-white transition-all ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
            }`}
          >
            {loading ? 'Génération...' : 'Réponse'}
          </button>
          <button
            onClick={() => { setQuestion(''); setResponse(''); }}
            className="px-4 py-2 text-sm rounded-xl font-semibold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all"
          >
            🔄 Réinitialiser
          </button>
        </div>

        {response && (
          <div className="p-4 md:p-6 bg-gray-900 text-gray-200 rounded-2xl font-mono text-sm whitespace-pre-wrap mb-4">
            {response}
          </div>
        )}

        {message && (
          <div className={`text-center p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
