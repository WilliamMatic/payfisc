import { Users, MapPin, CreditCard, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function QuickActions() {
  const quickActions = [
    {
      icon: <Users className="w-6 h-6" />,
      label: "Contribuables",
      description: "Gérer les particuliers et entreprises",
      href: "/system/particuliers",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      label: "Provinces",
      description: "Configurer les provinces et sites",
      href: "/system/provinces",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      label: "Paiements",
      description: "Traiter les transactions fiscales",
      href: "/system/paiement",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      label: "Statistiques",
      description: "Voir les rapports et analyses",
      href: "/system/ia-fiscale",
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="mb-12">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
        Accès rapide
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className="group block p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:translate-y-1"
          >
            <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              {action.icon}
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-[#2D5B7A] transition-colors">
              {action.label}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}