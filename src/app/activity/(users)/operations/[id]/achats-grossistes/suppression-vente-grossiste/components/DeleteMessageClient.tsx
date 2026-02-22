// src/app/activity/(users)/commandes-plaques/[id]/components/DeleteMessageClient.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, AlertTriangle, Mail } from 'lucide-react';

export default function DeleteMessageClient() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      {/* Élément décoratif d'arrière-plan */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      </div>

      <div className="relative">
        {/* Badge de statut */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium border border-amber-200 shadow-sm">
            <Shield className="w-4 h-4" />
            <span>Action restreinte</span>
          </div>
        </div>

        {/* Carte principale */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/60 p-8 max-w-md w-full text-center transform transition-all hover:scale-[1.02] duration-300">
          
          {/* Icône d'avertissement animée */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full animate-ping opacity-20" />
            </div>
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-orange-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <AlertTriangle className="w-10 h-10 text-amber-500" />
              </div>
            </div>
          </div>

          {/* Titre */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Suppression temporairement indisponible
          </h2>
          
          {/* Message principal */}
          <p className="text-gray-600 mb-4 leading-relaxed">
            Pour des raisons de sécurité et de traçabilité, la suppression directe n'est pas autorisée.
          </p>

          {/* Section d'aide */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 text-left border border-blue-100/50">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">
                  Contacter l'administrateur
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Notre équipe d'administration traitera votre demande manuellement dans les plus brefs délais.
                </p>
                <a 
                  href="mailto:willyam@williaminsi.com?subject=Demande%20de%20suppression%20-%20Commande%20de%20plaques"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors group"
                >
                  <span>Envoyer un email</span>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => router.back()}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la page précédente
            </button>
          </div>

          {/* Note de bas de page */}
          <p className="text-xs text-gray-400 mt-6">
            Cette mesure de sécurité protège l'intégrité de vos données
          </p>
        </div>
      </div>

      {/* Styles pour les animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: scale(1); }
          33% { transform: scale(1.1); }
          66% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}