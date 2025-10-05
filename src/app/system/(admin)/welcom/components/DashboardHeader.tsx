import { Home } from 'lucide-react';

export default function DashboardHeader() {
  return (
    <div className="text-center mb-12">
      <div className="w-20 h-20 bg-gradient-to-r from-[#2D5B7A] to-[#3A7A5F] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
        <Home className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Bienvenue sur PayFisc
      </h1>
      <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
        Votre plateforme complète de gestion fiscale moderne et intuitive. 
        Gérez facilement les contribuables, les paiements et les données fiscales.
      </p>
    </div>
  );
}