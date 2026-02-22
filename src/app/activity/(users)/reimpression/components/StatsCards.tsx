// src/app/activity/(users)/reimpression/components/StatsCards.tsx
"use client";

interface StatsCardsProps {
  stats: {
    total: number;
    aImprimer: number;
    dejaImprime: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
        <div className="text-sm text-blue-600 font-medium">
          Total des cartes
        </div>
        <div className="text-2xl font-bold text-blue-800 mt-1">
          {stats.total}
        </div>
      </div>
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
        <div className="text-sm text-amber-600 font-medium">À imprimer</div>
        <div className="text-2xl font-bold text-amber-800 mt-1">
          {stats.aImprimer}
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
        <div className="text-sm text-green-600 font-medium">Déjà imprimées</div>
        <div className="text-2xl font-bold text-green-800 mt-1">
          {stats.dejaImprime}
        </div>
      </div>
    </div>
  );
}
