import { Package, ShoppingCart, DollarSign } from "lucide-react";

interface StatistiquesProps {
  totalAchats: number;
  totalPlaques: number;
  totalMontant: number;
}

export default function Statistiques({ 
  totalAchats, 
  totalPlaques, 
  totalMontant 
}: StatistiquesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Total Achats
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {totalAchats}
            </p>
          </div>
          <div className="p-3 bg-[#2D5B7A]/10 rounded-xl">
            <Package className="w-6 h-6 text-[#2D5B7A]" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Plaques Vendues
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {totalPlaques.toLocaleString("fr-FR")}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-xl">
            <ShoppingCart className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Montant Total
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {totalMontant.toLocaleString("fr-FR")} $
            </p>
          </div>
          <div className="p-3 bg-purple-100 rounded-xl">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
}