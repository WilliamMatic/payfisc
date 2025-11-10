"use client";

interface AuditStatsData {
  total: number;
  today: number;
  admin: number;
  agent: number;
  system: number;
}

interface AuditStatsCardsProps {
  stats: AuditStatsData;
}

export default function AuditStatsCards({ stats }: AuditStatsCardsProps) {
  const statCards = [
    {
      title: "Total des activités",
      value: stats.total,
      icon: "📊",
      color: "bg-blue-500",
      description: "Toutes les activités enregistrées"
    },
    {
      title: "Aujourd'hui",
      value: stats.today,
      icon: "📅",
      color: "bg-green-500",
      description: "Activités du jour"
    },
    {
      title: "Administrateurs",
      value: stats.admin,
      icon: "👑",
      color: "bg-purple-500",
      description: "Actions des admins"
    },
    {
      title: "Agents",
      value: stats.agent,
      icon: "👤",
      color: "bg-cyan-500",
      description: "Actions des agents"
    },
    {
      title: "Système",
      value: stats.system,
      icon: "⚙️",
      color: "bg-gray-500",
      description: "Actions automatiques"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${stat.color}`}>
              <span className="text-lg">{stat.icon}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">
                {stat.value}
              </div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-800 mb-1">
            {stat.title}
          </div>
          <div className="text-xs text-gray-600">
            {stat.description}
          </div>
        </div>
      ))}
    </div>
  );
}