interface StatsData {
  total_contribuables: number;
  total_provinces: number;
  total_paiements: number;
  total_sites: number;
}

interface StatsOverviewProps {
  statsData: StatsData;
}

export default function StatsOverview({ statsData }: StatsOverviewProps) {
  // Formater les nombres avec des séparateurs de milliers
  const formatNumber = (num: number): string => {
    return num.toLocaleString('fr-FR');
  };

  return (
    <div className="bg-gradient-to-r from-[#2D5B7A] to-[#3A7A5F] rounded-2xl p-8 text-white mb-12">
      <h2 className="text-xl font-semibold mb-6 text-center">
        Aperçu du système
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">
            {formatNumber(statsData.total_contribuables)}
          </div>
          <div className="text-sm opacity-90">Contribuables</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">
            {formatNumber(statsData.total_provinces)}
          </div>
          <div className="text-sm opacity-90">Provinces</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">
            {formatNumber(statsData.total_paiements)}
          </div>
          <div className="text-sm opacity-90">Paiements</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">
            {formatNumber(statsData.total_sites)}
          </div>
          <div className="text-sm opacity-90">Sites</div>
        </div>
      </div>
    </div>
  );
}