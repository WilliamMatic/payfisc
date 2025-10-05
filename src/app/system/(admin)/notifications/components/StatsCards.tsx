// app/notifications/components/StatsCards.tsx
"use client";

interface StatsData {
  total: number;
  unread: number;
  success: number;
  alerts: number;
}

interface StatsCardsProps {
  stats: StatsData | null;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
        <div className="text-2xl font-bold text-gray-800">
          {stats.total}
        </div>
        <div className="text-sm text-gray-600">Total</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
        <div className="text-2xl font-bold text-blue-600">
          {stats.unread}
        </div>
        <div className="text-sm text-gray-600">Non lues</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
        <div className="text-2xl font-bold text-green-600">
          {stats.success}
        </div>
        <div className="text-sm text-gray-600">Succès</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
        <div className="text-2xl font-bold text-yellow-600">
          {stats.alerts}
        </div>
        <div className="text-sm text-gray-600">Alertes</div>
      </div>
    </div>
  );
}