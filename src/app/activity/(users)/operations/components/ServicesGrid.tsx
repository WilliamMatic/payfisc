// ServicesGrid.tsx
import Link from "next/link";
import {
  User,
  Users,
  CreditCard,
  Package,
  ArrowRight,
  Zap,
  Crown,
  Shield,
  RefreshCw,
  Sparkles,
  BadgeCheck,
  Truck,
  Building,
} from "lucide-react";
import { Impot as ImpotType } from "@/services/impots/impotService";

interface ServicesGridProps {
  impot: ImpotType;
}

export default function ServicesGrid({ impot }: ServicesGridProps) {
  const services = [
    {
      id: "client-simple",
      title: "Assujetti - Vente Directe",
      description:
        "Pour les particuliers qui achètent une plaque et récupèrent immédiatement la carte rose correspondante.",
      icon: User,
      color: "emerald",
      features: [
        "Achat plaque unique",
        "Carte rose immédiate",
        "Processus express 30min",
      ],
      tag: "RETAIL",
      stats: "5 min",
      popular: true,
    },
    {
      id: "client-special",
      title: "Grossiste - Vente en Gros",
      description:
        "Pour les partenaires qui achètent plusieurs plaques et peuvent récupérer des cartes roses vierges ou pré-imprimées.",
      icon: Building,
      color: "indigo",
      features: [
        "Achat volume (5+ plaques)",
        "Cartes roses vierges",
        "Tarifs préférentiels",
        "Dashboard analytique",
      ],
      tag: "B2B",
      stats: "Volume",
      popular: true,
    },
    {
      id: "carte-rose",
      title: "Délivrance Carte Rose",
      description:
        "Lorsqu'un grossiste a vendu une plaque à un client externe, ce dernier vient finaliser et récupérer sa carte rose.",
      icon: CreditCard,
      color: "sky",
      features: [
        "Transfert de propriété",
        "Activation finale",
        "Validation MPAKO en direct",
        "Biométrie optionnelle",
      ],
      tag: "TRANSFERT",
      stats: "Sécurisé",
      popular: false,
    },
    {
      id: "plaque-carte",
      title: "Kit Complet Premium",
      description:
        "Service tout-en-un : plaque personnalisée + carte rose avec options premium et suivi prioritaire.",
      icon: Package,
      color: "amber",
      features: [
        "Plaque personnalisée",
        "Carte rose NFC",
        "Assurance 1 an incluse",
        "Livraison premium",
      ],
      tag: "PREMIUM",
      stats: "Premium",
      popular: false,
    },
    {
      id: "refactor-carte",
      title: "Correction & Reprocessing",
      description:
        "Refactorisation et correction des données erronées sur les cartes roses existantes.",
      icon: RefreshCw,
      color: "rose",
      features: [
        "Correction IA vérifiée",
        "Réimpression sécurisée",
        "Traçabilité complète",
        "Validation MPAKO",
      ],
      tag: "SUPPORT",
      stats: "16/6",
      popular: false,
    },
  ];

  const getColorClasses = (color: string) => {
    const classes = {
      emerald: {
        bg: "bg-gradient-to-br from-emerald-50 to-emerald-25",
        border: "border-emerald-200/60",
        icon: "text-emerald-600",
        button:
          "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-emerald-200/50",
        badge: "bg-emerald-100 text-emerald-800",
        tag: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
      },
      indigo: {
        bg: "bg-gradient-to-br from-indigo-50 to-indigo-25",
        border: "border-indigo-200/60",
        icon: "text-indigo-600",
        button:
          "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-indigo-200/50",
        badge: "bg-indigo-100 text-indigo-800",
        tag: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
      },
      sky: {
        bg: "bg-gradient-to-br from-sky-50 to-sky-25",
        border: "border-sky-200/60",
        icon: "text-sky-600",
        button:
          "bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 shadow-sky-200/50",
        badge: "bg-sky-100 text-sky-800",
        tag: "bg-sky-500/10 text-sky-700 border-sky-500/20",
      },
      amber: {
        bg: "bg-gradient-to-br from-amber-50 to-amber-25",
        border: "border-amber-200/60",
        icon: "text-amber-600",
        button:
          "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 shadow-amber-200/50",
        badge: "bg-amber-100 text-amber-800",
        tag: "bg-amber-500/10 text-amber-700 border-amber-500/20",
      },
      rose: {
        bg: "bg-gradient-to-br from-rose-50 to-rose-25",
        border: "border-rose-200/60",
        icon: "text-rose-600",
        button:
          "bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 shadow-rose-200/50",
        badge: "bg-rose-100 text-rose-800",
        tag: "bg-rose-500/10 text-rose-700 border-rose-500/20",
      },
      violet: {
        bg: "bg-gradient-to-br from-violet-50 to-violet-25",
        border: "border-violet-200/60",
        icon: "text-violet-600",
        button:
          "bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 shadow-violet-200/50",
        badge: "bg-violet-100 text-violet-800",
        tag: "bg-violet-500/10 text-violet-700 border-violet-500/20",
      },
      cyan: {
        bg: "bg-gradient-to-br from-cyan-50 to-cyan-25",
        border: "border-cyan-200/60",
        icon: "text-cyan-600",
        button:
          "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 shadow-cyan-200/50",
        badge: "bg-cyan-100 text-cyan-800",
        tag: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
      },
      fuchsia: {
        bg: "bg-gradient-to-br from-fuchsia-50 to-fuchsia-25",
        border: "border-fuchsia-200/60",
        icon: "text-fuchsia-600",
        button:
          "bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-700 hover:to-fuchsia-600 shadow-fuchsia-200/50",
        badge: "bg-fuchsia-100 text-fuchsia-800",
        tag: "bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/20",
      },
    };
    return classes[color as keyof typeof classes] || classes.emerald;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {services.map((service) => {
        const colorClasses = getColorClasses(service.color);
        const IconComponent = service.icon;

        return (
          <div
            key={service.id}
            className={`
              relative rounded-2xl border ${colorClasses.border} ${
              colorClasses.bg
            } 
              p-6 hover:shadow-2xl transition-all duration-300 group
              hover:scale-[1.02] hover:-translate-y-1
              backdrop-blur-sm
              ${!impot.actif ? "opacity-50 grayscale" : ""}
            `}
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.8) 0%, transparent 50%)",
            }}
          >
            {/* BADGE POPULAIRE 2026 */}
            {service.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-lg">
                  <Crown className="w-3.5 h-3.5" />
                  <span>TRENDING 2026</span>
                  <Zap className="w-3 h-3 animate-pulse" />
                </div>
              </div>
            )}

            {/* TAG DE CATÉGORIE */}
            <div className="absolute top-4 right-4">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colorClasses.tag}`}
              >
                {service.tag}
              </span>
            </div>

            {/* STATS MINI */}
            <div className="absolute top-4 left-4">
              <div className="text-xs font-bold text-gray-700 bg-white/80 px-2 py-1 rounded-lg">
                {service.stats}
              </div>
            </div>

            {/* CONTENU PRINCIPAL */}
            <div className="pt-8">
              {/* ICÔNE MODERNE */}
              <div className="flex items-center justify-between mb-5">
                <div
                  className={`
                  p-3.5 rounded-2xl ${colorClasses.bg} border ${colorClasses.border}
                  shadow-lg group-hover:shadow-xl transition-shadow
                `}
                >
                  <IconComponent className={`w-7 h-7 ${colorClasses.icon}`} />
                </div>
              </div>

              {/* TITRE ET DESCRIPTION */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                {service.title}
              </h3>
              <p className="text-gray-600 mb-5 leading-relaxed text-sm">
                {service.description}
              </p>

              {/* CARACTÉRISTIQUES MODERNES */}
              <ul className="space-y-3 mb-6">
                {service.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center space-x-3 text-sm"
                  >
                    <div
                      className={`
                      w-2 h-2 rounded-full ${colorClasses.icon} 
                      flex-shrink-0 shadow-sm
                    `}
                    ></div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* BOUTON D'ACCÈS 2026 */}
              {impot.actif ? (
                <Link
                  href={`${impot.id}/${service.id}`}
                  className={`
                    w-full flex items-center justify-between px-5 py-3.5 
                    ${colorClasses.button} text-white rounded-xl 
                    transition-all duration-300 hover:no-underline group/button
                    shadow-lg hover:shadow-xl
                    hover:scale-[1.02] active:scale-[0.98]
                  `}
                >
                  <span className="font-semibold text-sm tracking-wide">
                    Démarrer maintenant
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs opacity-80">GO</span>
                    <ArrowRight className="w-4 h-4 transform group-hover/button:translate-x-1.5 transition-transform" />
                  </div>
                </Link>
              ) : (
                <div
                  className={`
                  w-full flex items-center justify-center space-x-2 px-4 py-3.5 
                  ${colorClasses.button} text-white rounded-xl opacity-30 
                  cursor-not-allowed shadow-inner
                `}
                >
                  <Shield className="w-4 h-4" />
                  <span className="font-semibold text-sm">
                    Service suspendu
                  </span>
                </div>
              )}
            </div>

            {/* INDICATEUR DE STATUT AVANCÉ */}
            {!impot.actif && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full text-xs text-gray-700 border border-gray-300/50">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="font-medium">
                    Impôt temporairement suspendu
                  </span>
                </div>
              </div>
            )}

            {/* EFFET DE BORDURE ANIMÉ */}
            <div
              className={`
              absolute inset-0 rounded-2xl border-2 ${colorClasses.border} 
              opacity-0 group-hover:opacity-100 transition-opacity duration-500
              pointer-events-none
            `}
            ></div>
          </div>
        );
      })}
    </div>
  );
}
