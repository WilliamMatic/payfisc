"use client";

import { useState } from "react";
import {
  Sparkles,
  Bell,
  CheckCircle,
  Car,
  Palette,
  Gauge,
  Fuel,
  Tag,
  Calendar,
  TrendingUp,
  Shield,
  Users,
  ArrowRight,
  Database,
  PlusCircle,
  List,
  Phone,
  ExternalLink,
} from "lucide-react";

interface DashboardContentProps {
  currentYear: number;
}

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  delay: number;
  details: string;
}

export default function DashboardContent({ currentYear }: DashboardContentProps) {
  const [isCalling, setIsCalling] = useState(false);

  const handleSupportClick = () => {
    const phoneNumber = "+243811552166";
    setIsCalling(true);
    
    // Simuler un appel téléphonique
    const confirmCall = window.confirm(`Appeler le support technique au ${phoneNumber} ?`);
    
    if (confirmCall) {
      // Ouvrir le lien pour appeler (fonctionne sur mobile)
      window.location.href = `tel:${phoneNumber}`;
      
      // Pour les ordinateurs, afficher le numéro
      if (!/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        alert(`Numéro de support : ${phoneNumber}\nVeuillez composer ce numéro sur votre téléphone.`);
      }
    }
    
    setIsCalling(false);
  };

  const handleDocumentationClick = () => {
    // Ouvrir dans un nouvel onglet
    window.open("https://mpako.net", "_blank", "noopener,noreferrer");
  };

  const features: Feature[] = [
    {
      icon: Tag,
      title: "Ajout des marques",
      description: "Gestion complète des constructeurs automobiles",
      color: "from-blue-500 to-cyan-500",
      delay: 100,
      details: "Les OPS peuvent maintenant ajouter et gérer toutes les marques de véhicules dans l'onglet 'Création des données' du menu de navigation gauche.",
    },
    {
      icon: Car,
      title: "Ajout des modèles",
      description: "Catalogue exhaustif des véhicules",
      color: "from-violet-500 to-purple-500",
      delay: 200,
      details: "Accédez à l'onglet 'Création des données' pour ajouter tous les modèles de véhicules avec leurs spécifications techniques complètes.",
    },
    {
      icon: Palette,
      title: "Ajout des couleurs",
      description: "Nuancier complet pour l'identification",
      color: "from-rose-500 to-pink-500",
      delay: 300,
      details: "Dans la section 'Création des données', gérez le nuancier des couleurs pour une identification précise des véhicules.",
    },
    {
      icon: Gauge,
      title: "Gestion de la puissance fiscale",
      description: "Calcul automatique selon la réglementation",
      color: "from-emerald-500 to-teal-500",
      delay: 400,
      details: "Configurez et gérez les barèmes de puissance fiscale depuis l'onglet dédié dans 'Création des données'.",
    },
    {
      icon: Fuel,
      title: "Gestion du type d'énergie",
      description: "Classification thermique/électrique/hybride",
      color: "from-amber-500 to-orange-500",
      delay: 500,
      details: "Définissez les types d'énergie des véhicules via l'interface 'Création des données' dans le menu principal.",
    },
    {
      icon: CheckCircle,
      title: "Gestion des usages",
      description: "Catégorisation professionnelle/particulier",
      color: "from-indigo-500 to-blue-500",
      delay: 600,
      details: "Configurez les différents usages des véhicules dans la section 'Création des données' accessible depuis le menu latéral.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto relative z-30 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12">
        <div className="mb-6 md:mb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg blur opacity-30"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-violet-600 p-2 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-900 to-violet-900 bg-clip-text text-transparent">
              Payfisc v1.2
            </h1>
            <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold rounded-full animate-pulse">
              Nouveau
            </span>
          </div>
          <p className="text-gray-600">Tableau de bord institutionnel OPS</p>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105">
            <Bell className="w-5 h-5 text-gray-700" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping"></span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center text-white font-semibold shadow-lg hover:scale-105 transition-transform duration-300">
              OPS
            </div>
            <div>
              <p className="font-semibold text-gray-900">Équipe Institutionnelle</p>
              <p className="text-sm text-gray-600">Administrateur système</p>
            </div>
          </div>
        </div>
      </div>

      {/* Étape 1 - Message de vœux */}
      <div className="relative mb-12 group animate-fade-in-up">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
        <div className="relative bg-gradient-to-r from-white/95 to-gray-50/95 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-gray-200/50 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl animate-float">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                Nouvelle année institutionnelle
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                Excellente Année {currentYear}
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-lg text-gray-700 leading-relaxed">
              L&apos;équipe Payfisc vous présente ses meilleurs vœux pour cette nouvelle année.
              Que {currentYear} soit synonyme d&apos;innovation, d&apos;efficacité et de réussite
              pour toutes les équipes OPS.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Nous nous engageons à vous fournir les outils les plus performants pour
              transformer la gestion fiscale et offrir un service d&apos;excellence.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200/50 hover:scale-105 transition-transform duration-300">
              <div className="w-5 h-5 text-emerald-500 animate-pulse">🎯</div>
              <span className="text-sm font-medium text-gray-700">Excellence</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200/50 hover:scale-105 transition-transform duration-300">
              <div className="w-5 h-5 text-blue-500 animate-pulse">🛡️</div>
              <span className="text-sm font-medium text-gray-700">Sécurité</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200/50 hover:scale-105 transition-transform duration-300">
              <div className="w-5 h-5 text-violet-500 animate-pulse">👥</div>
              <span className="text-sm font-medium text-gray-700">Collaboration</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200/50 hover:scale-105 transition-transform duration-300">
              <div className="w-5 h-5 text-amber-500 animate-pulse">📈</div>
              <span className="text-sm font-medium text-gray-700">Innovation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section importante - Nouvelle fonctionnalité Création des données */}
      <div className="relative mb-12 group animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
        <div className="relative bg-gradient-to-r from-white/95 to-gray-50/95 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-gray-200/50 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl animate-float">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">
                  Nouvelle Fonctionnalité
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                  Création des Données
                </h2>
              </div>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-full border border-emerald-200/50 backdrop-blur-sm">
              <span className="text-sm font-semibold text-emerald-600 animate-pulse">
                Exclusif OPS
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              <span className="font-bold text-emerald-600">Accès direct pour les OPS :</span> Pour la première fois, 
              les agents OPS peuvent maintenant créer et gérer toutes les données de référence directement depuis 
              l&apos;interface Payfisc.
            </p>
            
            <div className="bg-gradient-to-r from-emerald-50 to-green-50/50 rounded-xl p-6 border border-emerald-100/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <List className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Comment y accéder ?
                </h3>
              </div>
              <p className="text-gray-700 mb-4">
                Dans le menu de navigation gauche, cliquez sur l&apos;onglet <span className="font-bold text-emerald-600">&quot;Création des données&quot;</span>.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Accédez à toutes les catégories de données (marques, modèles, couleurs, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Ajoutez des entrées en temps réel</span>
                </li>
                <li className="flex items-start gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Exportez les données aux formats standards</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Étape 2 - Nouveautés Payfisc v1.2 */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Nouveautés Payfisc v1.2
            </h2>
            <p className="text-gray-600 max-w-2xl">
              Découvrez les fonctionnalités innovantes qui transforment l&apos;expérience
              d&apos;immatriculation. Notre interface a été entièrement{" "}
              <span className="font-semibold text-blue-600">
                redesignée pour 2026
              </span>{" "}
              avec une approche moderne et intuitive.
            </p>
          </div>
          <div className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-violet-500/10 rounded-full border border-blue-200/50 backdrop-blur-sm">
            <span className="text-sm font-semibold text-blue-600 animate-pulse">
              Interface Redesignée
            </span>
          </div>
        </div>

        {/* Grille des fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative animate-fade-in-up"
              style={{ animationDelay: `${feature.delay}ms` }}
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="relative h-full bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="mb-5">
                  <div 
                    className={`p-3 rounded-xl bg-gradient-to-r ${feature.color} w-fit group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-violet-600 transition-all duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-3 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  {feature.description}
                </p>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed italic border-l-4 border-blue-200 pl-3 py-1 bg-blue-50/50 rounded-r">
                  {feature.details}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-500 group-hover:text-blue-500 transition-colors duration-300">
                    Disponible dans &quot;Création des données&quot;
                  </span>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-2 transition-all duration-300" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section UI Redesign */}
      <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm rounded-3xl overflow-hidden border border-gray-700/50 animate-fade-in-up" style={{ animationDelay: '700ms' }}>
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]"></div>
        <div className="relative p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white animate-pulse">
                Innovation 2026
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Interface complètement repensée
            </h2>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              L&apos;écran des actions d&apos;immatriculation a subi une transformation radicale.
              Nous avons adopté les standards UI/UX 2026 avec un design épuré, des interactions
              fluides et une expérience utilisateur optimisée pour les professionnels.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <span className="text-sm font-medium text-white">
                  Design System 2026
                </span>
              </div>
              <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <span className="text-sm font-medium text-white">
                  Animations fluides
                </span>
              </div>
              <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <span className="text-sm font-medium text-white">
                  Accessibilité AAA
                </span>
              </div>
              <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <span className="text-sm font-medium text-white">
                  Performance optimale
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer avec boutons fonctionnels */}
      <div className="mt-12 pt-8 border-t border-gray-200/50 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-gray-600 text-sm">
              © {currentYear} Payfisc v1.2 - Plateforme institutionnelle OPS
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Conforme aux standards gouvernementaux RG-2026-001
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Bouton Support - Appel téléphonique */}
            <button
              onClick={handleSupportClick}
              disabled={isCalling}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Phone className="w-4 h-4" />
              <span>{isCalling ? "Appel en cours..." : "Support technique"}</span>
            </button>
            
            {/* Bouton Documentation - Lien externe */}
            <button
              onClick={handleDocumentationClick}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <span>Documentation</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Informations de contact supplémentaires */}
        <div className="mt-6 text-center md:text-left">
          <p className="text-xs text-gray-500">
            Support disponible du lundi au vendredi, 8h-18h
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Email: support@payfisc.gov | Tél: +243 81 155 21 66
          </p>
        </div>
      </div>

      {/* Styles d'animation */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
        }

        @keyframes phoneRing {
          0%, 100% {
            transform: rotate(0deg);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: rotate(-15deg);
          }
          20%, 40%, 60%, 80% {
            transform: rotate(15deg);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-phone-ring {
          animation: phoneRing 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}