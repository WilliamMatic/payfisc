// ServicesGrid.tsx
import Link from 'next/link';
import { 
  User, 
  Users, 
  CreditCard, 
  Car, 
  ArrowRight, 
  Zap, 
  Crown,
  Shield,
  RefreshCw // Nouvelle icône pour le refactor
} from 'lucide-react';
import { Impot as ImpotType } from '@/services/impots/impotService';

interface ServicesGridProps {
  impot: ImpotType;
}

export default function ServicesGrid({ impot }: ServicesGridProps) {
  const services = [
    {
      id: 'client-simple',
      title: 'Client Simple',
      description: 'Vente rapide et simple pour les particuliers. Processus simplifié pour un traitement immédiat.',
      icon: User,
      color: 'blue',
      features: ['Traitement rapide', 'Formulaire simplifié', 'Paiement immédiat'],
      popular: true
    },
    {
      id: 'client-special',
      title: 'Client Spécial',
      description: 'Vente dédiée aux partenaires avec conditions préférentielles et suivi personnalisé.',
      icon: Users,
      color: 'purple',
      features: ['Conditions partenaires', 'Suivi personnalisé', 'Rapports détaillés'],
      popular: false
    },
    {
      id: 'carte-rose',
      title: 'Délivrance Carte Rose',
      description: 'Gestion complète de la délivrance des cartes roses avec suivi du processus administratif.',
      icon: CreditCard,
      color: 'green',
      features: ['Gestion administrative', 'Suivi en temps réel', 'Documents sécurisés'],
      popular: false
    },
    {
      id: 'plaque-carte',
      title: 'Délivrance Plaque + Carte',
      description: 'Service complet incluant la délivrance de la plaque et de la carte rose en un seul processus.',
      icon: Car,
      color: 'orange',
      features: ['Processus complet', 'Coordination DGI', 'Livraison groupée'],
      popular: false
    },
    {
      id: 'refactor-carte',
      title: 'Gestion des Erreurs',
      description: 'Refactorisation des cartes roses avec informations mal saisies. Correction et réimpression des documents.',
      icon: RefreshCw,
      color: 'red',
      features: ['Correction des données', 'Réimpression immédiate', 'Historique des modifications'],
      popular: false
    }
  ];

  const getColorClasses = (color: string) => {
    const classes = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700',
        badge: 'bg-blue-100 text-blue-800'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'text-purple-600',
        button: 'bg-purple-600 hover:bg-purple-700',
        badge: 'bg-purple-100 text-purple-800'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        button: 'bg-green-600 hover:bg-green-700',
        badge: 'bg-green-100 text-green-800'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'text-orange-600',
        button: 'bg-orange-600 hover:bg-orange-700',
        badge: 'bg-orange-100 text-orange-800'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        button: 'bg-red-600 hover:bg-red-700',
        badge: 'bg-red-100 text-red-800'
      }
    };
    return classes[color as keyof typeof classes] || classes.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {services.map((service) => {
        const colorClasses = getColorClasses(service.color);
        const IconComponent = service.icon;

        return (
          <div
            key={service.id}
            className={`relative rounded-xl border-2 ${colorClasses.border} ${colorClasses.bg} p-6 hover:shadow-lg transition-all duration-300 group ${
              !impot.actif ? 'opacity-60' : ''
            }`}
          >
            {/* BADGE POPULAIRE */}
            {service.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                  <Crown className="w-3 h-3" />
                  <span>POPULAIRE</span>
                </div>
              </div>
            )}

            {/* ICÔNE */}
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${colorClasses.bg} border ${colorClasses.border}`}>
                <IconComponent className={`w-6 h-6 ${colorClasses.icon}`} />
              </div>
              {service.popular && (
                <Zap className="w-5 h-5 text-yellow-500" />
              )}
            </div>

            {/* TITRE ET DESCRIPTION */}
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {service.title}
            </h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              {service.description}
            </p>

            {/* CARACTÉRISTIQUES */}
            <ul className="space-y-2 mb-6">
              {service.features.map((feature, index) => (
                <li key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                  <div className={`w-1.5 h-1.5 rounded-full ${colorClasses.icon}`}></div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* BOUTON D'ACCÈS */}
            {impot.actif ? (
              <Link
                href={`${impot.id}/${service.id}`}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 ${colorClasses.button} text-white rounded-lg transition-all duration-200 hover:no-underline group/button`}
              >
                <span className="font-semibold">
                  Accéder au service
                </span>
                <ArrowRight className="w-4 h-4 transform group-hover/button:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <div className={`w-full flex items-center justify-center space-x-2 px-4 py-3 ${colorClasses.button} text-white rounded-lg opacity-50 cursor-not-allowed`}>
                <span className="font-semibold">
                  Service indisponible
                </span>
              </div>
            )}

            {/* INDICATEUR DE STATUT */}
            {!impot.actif && (
              <div className="mt-3 text-center">
                <div className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                  <Shield className="w-3 h-3" />
                  <span>Impôt suspendu</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}