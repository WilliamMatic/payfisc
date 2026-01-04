import { FileText, Users, Calendar } from "lucide-react";
import type { StatsCartesRoses } from "../types/carteRoseTypes";

interface StatsCardsProps {
  stats: StatsCartesRoses | null;
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-700 font-medium">
              Total Cartes Roses
            </p>
            <p className="text-2xl font-bold text-blue-800">
              {stats.total}
            </p>
          </div>
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-700 font-medium">
              Clients Uniques
            </p>
            <p className="text-2xl font-bold text-green-800">
              {stats.clientsUniques}
            </p>
          </div>
          <Users className="w-8 h-8 text-green-600" />
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-700 font-medium">
              Première attribution
            </p>
            <p className="text-sm font-bold text-purple-800">
              {stats.datePremiere ? formatDate(stats.datePremiere) : "N/A"}
            </p>
          </div>
          <Calendar className="w-8 h-8 text-purple-600" />
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-amber-700 font-medium">
              Dernière attribution
            </p>
            <p className="text-sm font-bold text-amber-800">
              {stats.dateDerniere ? formatDate(stats.dateDerniere) : "N/A"}
            </p>
          </div>
          <Calendar className="w-8 h-8 text-amber-600" />
        </div>
      </div>
    </div>
  );
}