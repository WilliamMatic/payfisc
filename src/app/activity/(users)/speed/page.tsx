import Link from "next/link";
import { CheckCircle2, Database, ArrowRight, FileEdit, CreditCard, Shield, History, Users, BookOpen, Calendar, Clock, Layers } from "lucide-react";

export default function MpakoMigrationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header avec titre principal */}
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-blue-700 uppercase tracking-wide">
            Migration Mpako
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Vos Données Historiques 2022-2025 sont Disponibles
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Tout l'historique de vos opérations depuis 2022 a été intégralement 
          migré dans Mpako. Accédez à 3 années complètes de données.
        </p>
      </div>

      {/* Contenu principal */}
      <div className="max-w-5xl mx-auto px-4 pb-16 space-y-10">
        {/* Carte d'état de la migration avec période */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Migration Complète 2022-2025 ✅
                  </h2>
                  <p className="text-emerald-100 text-sm">
                    Toutes les données de l'ancien système sont maintenant dans Mpako
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">2022 → 2025</span>
                </div>
                <div className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <span className="text-white text-sm font-medium">100% des données</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Timeline de la période de données */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  Période des données disponibles
                </h3>
                <span className="text-sm text-gray-500">3 années complètes</span>
              </div>
              
              <div className="relative">
                {/* Ligne de timeline */}
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -translate-y-1/2"></div>
                
                {/* Points sur la timeline */}
                <div className="relative flex justify-between">
                  {[
                    { year: "2022", label: "Début des données", status: "Migré" },
                    { year: "2023", label: "Données centrales", status: "Migré" },
                    { year: "2024", label: "Transition", status: "Migré" },
                    { year: "2025", label: "Données actuelles", status: "Actif" }
                  ].map((item, index) => (
                    <div key={index} className="flex flex-col items-center relative z-10">
                      <div className={`w-4 h-4 rounded-full ${index === 3 ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-emerald-400'} mb-2`}></div>
                      <div className="text-center">
                        <div className="font-bold text-gray-900">{item.year}</div>
                        <div className="text-xs text-gray-600 mt-1">{item.label}</div>
                        <div className={`text-xs font-medium ${index === 3 ? 'text-emerald-600' : 'text-emerald-500'} mt-1`}>
                          {item.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Note explicative */}
              <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <Layers className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      📋 Pour les OPS : Toutes vos anciennes données sont là !
                    </p>
                    <p className="text-sm text-blue-800">
                      <strong>Mpako prend en compte toutes les opérations de 2022 à 2025.</strong> 
                      {' '}L'ancien système et le nouveau partagent exactement les mêmes données historiques. 
                      Vous pouvez travailler en toute confiance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-600" />
                    Ce qui a été migré (2022-2025)
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Toutes les opérations depuis janvier 2022",
                      "Les historiques complets des cartes 2022-2025",
                      "Les données clients sur 3 années",
                      "Les états et rapports mensuels historiques",
                      "Les documents numérisés archivés"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    Continuité des opérations garantie
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Pas de rupture :</strong> Les données de l'ancien système sont intactes dans Mpako</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Même références :</strong> Tous les identifiants et codes sont conservés</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Accès simplifié :</strong> Recherchez comme avant, trouvez comme avant</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-5 rounded-xl">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    Guide rapide pour les OPS
                  </h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-purple-700">Refactor</span> pour modifier les données existantes (2022-2025) • 
                    <span className="font-medium text-amber-700"> Nouvelle carte</span> pour créer à partir de l'historique
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section de choix - Titre */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Comment souhaitez-vous accéder aux données 2022-2025 ?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Deux options pour travailler avec vos 3 années d'historique migré
          </p>
        </div>

        {/* Options d'accès */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Option 1: Refactor */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                  <FileEdit className="w-8 h-8 text-purple-600" />
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                  Modification
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Option 1 : Refactor
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Modifiez directement les données de 2022 à 2025 dans Mpako. 
                Toutes vos corrections seront appliquées sur l'historique complet.
              </p>
              
              <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>Disponible pour les années : 2022 • 2023 • 2024 • 2025</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                  Idéal pour :
                </h4>
                <ul className="space-y-3">
                  {[
                    "Corriger une opération de 2023",
                    "Mettre à jour un client de 2022",
                    "Rectifier un solde historique"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <ArrowRight className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-purple-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Link
                href="/activity/operations/11/refactor-carte"
                className="group/btn inline-flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 gap-3 shadow-md hover:shadow-lg"
              >
                <span>Accéder au Refactor</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Option 2: Reproduction de carte */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-amber-600" />
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                  Nouvelle émission
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Option 2 : Reproduction de Carte
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Créez de nouvelles cartes en vous basant sur l'historique 2022-2025. 
                L'accès aux anciennes données est instantané.
              </p>
              
              <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <History className="w-4 h-4" />
                  <span>Accède à l'historique complet des cartes</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                  Idéal pour :
                </h4>
                <ul className="space-y-3">
                  {[
                    "Remplacer une carte de 2024",
                    "Créer une carte pour un client historique",
                    "Dupliquer une configuration existante"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-amber-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Link
                href="/activity/operations/12"
                className="group/btn inline-flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-200 gap-3 shadow-md hover:shadow-lg"
              >
                <span>Reproduire une Carte</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Message de confirmation pour les OPS */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0 w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Pour les OPS : Tout est là, rien n'est perdu !
              </h3>
              <p className="text-gray-700">
                <strong>Les données de l'ancien système (2022-2025) sont intégralement disponibles dans Mpako.</strong> 
                {' '}Vous pouvez rechercher, modifier et travailler avec exactement les mêmes informations qu'avant. 
                La migration est terminée et toutes vos références historiques sont préservées.
              </p>
            </div>
          </div>
        </div>
        
      </div>

      {/* Badge de version amélioré */}
      <div className="fixed bottom-6 right-6 bg-white rounded-full shadow-xl px-5 py-3 border border-gray-200 flex items-center gap-3">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <div>
          <p className="text-xs font-medium text-gray-900">Mpako v1.2</p>
          <p className="text-xs text-gray-500">Données 2022-2025</p>
        </div>
      </div>
    </div>
  );
}