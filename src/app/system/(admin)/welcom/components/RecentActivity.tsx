import { BarChart3 } from 'lucide-react';

export default function RecentActivity() {
  return (
    <div className="mt-12">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
        Activité récente
      </h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center text-gray-500 py-8">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Aucune activité récente</p>
          <p className="text-sm mt-1">Les activités apparaîtront ici</p>
        </div>
      </div>
    </div>
  );
}