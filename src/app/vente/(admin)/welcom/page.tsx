import { Home } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="text-center">
      <div className="w-24 h-24 bg-gradient-to-r from-[#153258] to-[#23A974] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
        <Home className="w-12 h-12 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        Bienvenue sur PayFisc
      </h2>
      <p className="text-gray-600 text-lg max-w-md mx-auto">
        Votre plateforme de gestion fiscale moderne et intuitive. 
        Sélectionnez une fonctionnalité dans le menu pour commencer.
      </p>
      <div className="mt-8 flex justify-center space-x-4">
        <div className="w-3 h-3 bg-[#153258] rounded-full animate-bounce" />
        <div className="w-3 h-3 bg-[#23A974] rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
        <div className="w-3 h-3 bg-[#153258] rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
      </div>
    </div>
  );
}