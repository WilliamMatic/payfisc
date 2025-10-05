'use client';

import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  const handlePaiementClick = () => {
    router.push('/activity/paiement');
  };

  const handleDeclarationClick = () => {
    router.push('/activity/declaration');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🚀 Espace Contribuable
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Bienvenue dans votre espace dédié ! Effectuez vos démarches fiscales 
            rapidement et en toute simplicité.
          </p>
        </div>

        {/* Section d'accès rapide */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Services Disponibles ⚡
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Choisissez l'opération que vous souhaitez effectuer
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Carte Paiement Taxe */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200 hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Paiement de Taxes
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Réglez vos impôts et taxes en ligne. 
                Paiement sécurisé avec reçu immédiat.
              </p>
              <button 
                onClick={handlePaiementClick}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 w-full"
              >
                Accéder au Paiement
              </button>
            </div>

            {/* Carte Vérification Déclaration */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-100 rounded-xl p-6 border border-blue-200 hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Vérification Déclaration
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Consultez le statut de vos déclarations. 
                Historique complet et suivi en temps réel.
              </p>
              <button 
                onClick={handleDeclarationClick}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 w-full"
              >
                Vérifier mes Déclarations
              </button>
            </div>
          </div>
        </div>

        {/* Section informations importantes */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            ℹ️ Informations Importantes
          </h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-yellow-500 text-xl mr-3">⏰</span>
              <div>
                <h4 className="font-medium text-gray-800">Délais de Paiement</h4>
                <p className="text-sm text-gray-600">
                  Pensez à respecter les dates limites de paiement pour éviter les majorations.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 text-xl mr-3">✅</span>
              <div>
                <h4 className="font-medium text-gray-800">Confirmation Immédiate</h4>
                <p className="text-sm text-gray-600">
                  Recevez un accusé de réception instantané pour chaque transaction.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-blue-500 text-xl mr-3">🔒</span>
              <div>
                <h4 className="font-medium text-gray-800">Sécurité Garantie</h4>
                <p className="text-sm text-gray-600">
                  Toutes vos transactions sont cryptées et sécurisées.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Message d'assistance */}
        <div className="text-center bg-blue-50 rounded-xl p-6">
          <p className="text-gray-700 mb-2">
            🆘 Besoin d'aide ? Notre équipe support est disponible pour vous accompagner.
          </p>
          <button className="text-blue-600 hover:text-blue-800 font-medium underline">
            Contacter le support
          </button>
        </div>
      </div>
    </div>
  );
}