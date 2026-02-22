import Link from "next/link";
import {
  CheckCircle2,
  Database,
  ArrowRight,
  FileEdit,
  CreditCard,
  Shield,
  History,
  Users,
  BookOpen,
  Calendar,
  Clock,
  Layers,
  GitBranch,
  Copy,
  RefreshCw,
  PenTool,
  Sparkles,
  Target,
  UserCircle,
  Truck,
  Repeat,
  AlertCircle,
  FileText,
  UserPlus,
} from "lucide-react";

export default function MpakoMigrationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header simplifié */}
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-blue-700 uppercase tracking-wide">
            Gestion des Cartes Roses
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Deux façons de gérer les cartes roses
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Choisissez l'opération selon la situation de l'assujetti
        </p>
      </div>

      {/* Contenu principal */}
      <div className="max-w-5xl mx-auto px-4 pb-16 space-y-10">
        {/* Carte d'introduction - Focus sur les deux cas métier */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Refactor vs Reproduction : Deux cas différents
                  </h2>
                  <p className="text-blue-100 text-sm">
                    Comprendre quand utiliser chaque option
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Tableau comparatif des cas métier */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Colonne Refactor - Correction d'erreurs */}
              <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                    <PenTool className="w-6 h-6 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-purple-900">
                      REFACTOR
                    </h3>
                    <p className="text-sm text-purple-700">
                      Correction d'erreurs
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <UserCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <span className="font-medium">Cas typique :</span>
                      <p className="text-sm text-gray-700 mt-1">
                        L'assujetti a sa carte mais constate des erreurs : nom
                        mal orthographié, date de naissance erronée, adresse
                        incorrecte, etc.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <p className="text-xs font-medium text-purple-800 mb-1">
                      🔍 Exemple concret :
                    </p>
                    <p className="text-sm text-gray-700">
                      "Mon nom sur la carte est Koffi mais c'est Kouassi, il
                      faut corriger l'orthographe"
                    </p>
                  </div>
                </div>
              </div>

              {/* Colonne Reproduction - Duplicata/Changement de propriétaire */}
              <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center">
                    <Copy className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-900">
                      REPRODUCTION
                    </h3>
                    <p className="text-sm text-amber-700">
                      Duplicata ou Changement de propriétaire
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <Repeat className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-medium">Deux cas possibles :</span>
                      <ul className="text-sm text-gray-700 mt-2 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="w-1 h-1 bg-amber-500 rounded-full mt-2"></span>
                          <span>
                            <strong>Duplicata :</strong> L'assujetti a perdu sa
                            carte et revient pour obtenir un duplicata
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1 h-1 bg-amber-500 rounded-full mt-2"></span>
                          <span>
                            <strong>Mutation :</strong> L'assujetti a acheté
                            l'engin auprès d'un autre propriétaire et veut
                            mettre la carte à son nom
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-2">
                    <p className="text-xs font-medium text-amber-800 mb-1">
                      🔍 Exemples concrets :
                    </p>
                    <p className="text-sm text-gray-700">
                      • "J'ai perdu ma carte, je veux un duplicata"
                    </p>
                    <p className="text-sm text-gray-700">
                      • "J'ai acheté le véhicule à M. Yao, je veux la carte à
                      mon nom maintenant"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Message clé pour comprendre */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 p-6 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-gray-700" />
                Comment choisir ?
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-700 font-bold">1</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-bold text-purple-700">Refactor</span>{" "}
                    →
                    <span className="italic">
                      {" "}
                      "L'assujetti a sa carte mais il y a des erreurs à
                      corriger"
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-700 font-bold">2</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-bold text-amber-700">
                      Reproduction
                    </span>{" "}
                    →
                    <span className="italic">
                      {" "}
                      "L'assujetti n'a plus sa carte (perte) ou l'engin a changé
                      de propriétaire"
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section de choix - Titre */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Quelle est la situation ?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Sélectionnez l'option qui correspond au cas de l'assujetti
          </p>
        </div>

        {/* Options d'accès - Version métier */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Option 1: Refactor - Correction d'erreurs */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300">
              {/* Badge */}
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                  CORRECTION
                </span>
              </div>

              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <FileEdit className="w-8 h-8 text-purple-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Refactor</h3>
              <p className="text-sm text-purple-600 font-medium mb-4">
                ✏️ Corriger les erreurs sur une carte existante
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                L'assujetti a déjà sa carte mais a constaté des erreurs dans les
                informations (nom, prénom, date de naissance, adresse, etc.)
              </p>

              {/* Exemples concrets */}
              <div className="mb-8 bg-purple-50 p-4 rounded-xl">
                <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Erreurs fréquentes à corriger :
                </h4>
                <ul className="space-y-2">
                  {[
                    "Orthographe du nom ou prénom",
                    "Date de naissance erronée",
                    "Lieu de naissance incorrect",
                    "Adresse de résidence à mettre à jour",
                    "Situation matrimoniale à modifier",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-3 h-3 text-purple-500 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/activity/operations/11/refactor-carte"
                className="group/btn inline-flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 gap-3 shadow-md hover:shadow-lg"
              >
                <PenTool className="w-4 h-4" />
                <span>Corriger une carte existante</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>

              <p className="text-xs text-gray-500 text-center mt-3">
                👆 L'assujetti a sa carte mais les infos sont erronées
              </p>
            </div>
          </div>

          {/* Option 2: Reproduction - Duplicata/Mutation */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300">
              {/* Badge */}
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                  DUPLICATA / MUTATION
                </span>
              </div>

              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mb-6">
                <Repeat className="w-8 h-8 text-amber-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Reproduction de Carte
              </h3>
              <p className="text-sm text-amber-600 font-medium mb-4">
                🔄 Duplicata • Changement de propriétaire
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                L'assujetti a perdu sa carte et veut un duplicata, OU il a
                acheté l'engin à quelqu'un d'autre et veut la carte à son nom.
              </p>

              {/* Deux sous-cas clairement identifiés */}
              <div className="mb-8 space-y-4">
                {/* Cas 1: Duplicata */}
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    Cas 1 : Duplicata (perte de carte)
                  </h4>
                  <ul className="space-y-1">
                    {[
                      "Carte perdue par l'assujetti",
                      "Carte volée",
                      "Carte détériorée/illisible",
                      "Carte arrivée à expiration",
                    ].map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="w-1 h-1 bg-amber-500 rounded-full mt-2"></span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cas 2: Mutation */}
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                  <h4 className="text-sm font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Cas 2 : Mutation (changement de propriétaire)
                  </h4>
                  <ul className="space-y-1">
                    {[
                      "Achat de l'engin à un autre assujetti",
                      "Héritage / succession",
                      "Don de l'engin",
                      "L'assujetti veut la carte à son nom (le vendeur avait sa carte)",
                    ].map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="w-1 h-1 bg-orange-500 rounded-full mt-2"></span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                href="/activity/operations/12"
                className="group/btn inline-flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-200 gap-3 shadow-md hover:shadow-lg"
              >
                <Copy className="w-4 h-4" />
                <span>Créer un duplicata ou mutation</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>

              <div className="text-xs text-gray-500 text-center mt-3 space-y-1">
                <p>👆 Perte de carte → Duplicata</p>
                <p>👆 Changement de propriétaire → Mutation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Aide-mémoire visuel pour les OPS */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Guide de choix pour les OPS
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center">
                      <span className="text-purple-700 text-xs font-bold">
                        R
                      </span>
                    </div>
                    <span className="font-medium text-purple-800">
                      REFACTOR
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 pl-8">
                    <span className="font-medium">Quand ?</span> L'assujetti a
                    SA carte mais les infos sont fausses
                  </p>
                  <p className="text-sm text-gray-600 pl-8">
                    Ex: "Mon nom est mal écrit"
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center">
                      <span className="text-amber-700 text-xs font-bold">
                        R
                      </span>
                    </div>
                    <span className="font-medium text-amber-800">
                      REPRODUCTION
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 pl-8">
                    <span className="font-medium">Quand ?</span> L'assujetti N'A
                    PLUS sa carte (perte) OU l'engin a changé de propriétaire
                  </p>
                  <p className="text-sm text-gray-600 pl-8">
                    Ex: "J'ai perdu ma carte" ou "J'ai acheté le véhicule"
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 border-t border-blue-200 pt-3">
                💡 La question à poser : "Est-ce que l'assujetti a sa carte
                physique en main et veut juste corriger des infos (Refactor) OU
                est-ce qu'il n'a plus sa carte ou l'engin a changé de
                propriétaire (Reproduction) ?"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Badge contextuel */}
      <div className="fixed bottom-6 right-6 bg-white rounded-full shadow-xl px-5 py-3 border border-gray-200 flex items-center gap-3">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <div>
          <p className="text-xs font-medium text-gray-900">Mpako v1.2</p>
          <p className="text-xs text-gray-500">Refactor vs Reproduction</p>
        </div>
      </div>
    </div>
  );
}
