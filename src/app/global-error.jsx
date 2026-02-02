"use client";
import BackButton from "./_components/ui/BackButton";
import { AlertTriangle, RefreshCw, Home, Shield, Terminal } from "lucide-react";

export default function GlobalError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* En-tête avec logo/icône */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-lg border border-rose-100 mb-6">
            <div className="relative">
              <AlertTriangle className="w-16 h-16 text-rose-600" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center">
                <Terminal className="w-3 h-3 text-rose-700" />
              </div>
            </div>
          </div>

          <div className="mb-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 text-sm font-semibold rounded-full border border-rose-200">
              <Shield className="w-4 h-4" />
              Système de protection activé
            </span>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Erreur système détectée
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Une erreur inattendue s'est produite. Notre équipe technique a été
              alertée.
            </p>

            <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-amber-50/50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-amber-800">
                  Incident ID:{" "}
                  <code className="ml-1 px-2 py-1 bg-amber-100 rounded">
                    ERR-{Date.now().toString(36).toUpperCase()}
                  </code>
                </span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-amber-300" />
              <span className="text-sm text-amber-700">
                {new Date().toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Section d'instructions */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Solutions rapides
              </h3>
              <ul className="space-y-3 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                  Rafraîchir la page (F5 ou Ctrl+R)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                  Vider le cache de votre navigateur
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                  Vérifier votre connexion internet
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                  Réessayer dans quelques minutes
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Actions automatiques
              </h3>
              <ul className="space-y-3 text-sm text-slate-800">
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 bg-slate-500 rounded-full flex-shrink-0" />
                  Rapport d'erreur généré
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 bg-slate-500 rounded-full flex-shrink-0" />
                  Équipe technique notifiée
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 bg-slate-500 rounded-full flex-shrink-0" />
                  Analyse des logs en cours
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 bg-slate-500 rounded-full flex-shrink-0" />
                  Système de surveillance activé
                </li>
              </ul>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <BackButton />
          </div>
        </div>

        {/* Informations techniques (optionnel) */}
        <div className="text-center">
          <div className="inline-flex items-center gap-4 text-sm text-gray-500">
            <span>
              Statut :{" "}
              <span className="font-medium text-rose-600">Erreur critique</span>
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span>
              Environnement :{" "}
              <span className="font-medium text-gray-700">Production</span>
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span>
              Version :{" "}
              <span className="font-medium text-gray-700">v2.1.0</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
