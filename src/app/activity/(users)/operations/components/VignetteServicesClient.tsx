'use client';
import { useState } from 'react';
import { Impot as ImpotType } from '@/services/impots/impotService';
import ImpotServicesHeader from './ImpotServicesHeader';
import AlertMessage from './AlertMessage';
import Link from 'next/link';
import {
  Car,
  Ticket,
  Smartphone,
  CheckCircle,
  Shield,
  Zap,
  ArrowRight,
  Building,
  AlertTriangle,
  BadgeCheck,
  QrCode,
  Receipt,
  Key,
  RefreshCw,
  Crown,
  Wrench,
  FileCheck,
  CarFront,
  ClipboardCheck
} from 'lucide-react';

interface VignetteServicesClientProps {
  impot: ImpotType;
}

export default function VignetteServicesClient({ impot }: VignetteServicesClientProps) {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const services = [
    {
      id: "vente-vignette",
      title: "Vente de Vignette",
      description: "Pour les assujettis qui viennent acheter leur vignette automobile. Vérification préalable de l'immatriculation requise.",
      icon: Ticket,
      color: "emerald",
      features: [
        "Vérification immatriculation",
        "Paiement sécurisé DGI",
        "Émission vignette physique",
        "Validation en temps réel"
      ],
      tag: "VENTE",
      stats: "Vérification",
      popular: true,
      requirements: ["Immatriculation valide", "Carte d'identité", "Carte rose"]
    },
    {
      id: "delivrance-vignette",
      title: "Délivrance Vignette",
      description: "Pour les assujettis ayant déjà payé via mobile money et qui viennent récupérer leur vignette. Vérification du paiement et de l'immatriculation.",
      icon: Smartphone,
      color: "blue",
      features: [
        "Vérification paiement mobile",
        "Confirmation immatriculation",
        "Délivrance instantanée",
        "Traçabilité complète"
      ],
      tag: "RÉCUPÉRATION",
      stats: "Mobile Money",
      popular: false,
      requirements: ["Preuve de paiement", "Numéro immatriculation", "QR Code Mobile Money"]
    },
    {
      id: "renouvellement-vignette",
      title: "Renouvellement Annuel",
      description: "Service de renouvellement annuel de vignette automobile avec vérification automatique du statut du véhicule.",
      icon: RefreshCw,
      color: "amber",
      features: [
        "Vérification automatique",
        "Historique des vignettes",
        "Paiement en ligne intégré",
        "Rappel automatique"
      ],
      tag: "RENOUVELLEMENT",
      stats: "Annuel",
      popular: true,
      requirements: ["Vignette expirée", "Véhicule en règle", "Contrôle technique valide"]
    },
    {
      id: "controle-technique",
      title: "Contrôle Technique",
      description: "Consulter la liste des véhicules ayant effectué le contrôle technique et octroyer le Procès-Verbal.",
      icon: Wrench,
      color: "purple",
      features: [
        "Liste des véhicules contrôlés",
        "Génération de PV",
        "Validation des résultats",
        "Historique des contrôles"
      ],
      tag: "CONTROL",
      stats: "Technique",
      popular: false,
      requirements: ["Rapport de contrôle", "Certificat centre agréé", "Données véhicule"]
    }
  ];

  const getColorClasses = (color: string) => {
    const classes = {
      emerald: {
        bg: "bg-gradient-to-br from-emerald-50 to-emerald-25",
        border: "border-emerald-200/60",
        icon: "text-emerald-600",
        button: "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-emerald-200/50",
        badge: "bg-emerald-100 text-emerald-800",
        tag: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
      },
      blue: {
        bg: "bg-gradient-to-br from-blue-50 to-blue-25",
        border: "border-blue-200/60",
        icon: "text-blue-600",
        button: "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-200/50",
        badge: "bg-blue-100 text-blue-800",
        tag: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      },
      amber: {
        bg: "bg-gradient-to-br from-amber-50 to-amber-25",
        border: "border-amber-200/60",
        icon: "text-amber-600",
        button: "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 shadow-amber-200/50",
        badge: "bg-amber-100 text-amber-800",
        tag: "bg-amber-500/10 text-amber-700 border-amber-500/20",
      },
      purple: {
        bg: "bg-gradient-to-br from-purple-50 to-purple-25",
        border: "border-purple-200/60",
        icon: "text-purple-600",
        button: "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-purple-200/50",
        badge: "bg-purple-100 text-purple-800",
        tag: "bg-purple-500/10 text-purple-700 border-purple-500/20",
      },
    };
    return classes[color as keyof typeof classes] || classes.emerald;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Alertes */}
        <AlertMessage 
          error={error} 
          successMessage={successMessage} 
          onDismiss={() => {
            setError(null);
            setSuccessMessage(null);
          }}
        />
        
        {/* Header avec informations de l'impôt */}
        <ImpotServicesHeader impot={impot} />

        {/* Instructions importantes */}
        <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-800 mb-1">Instructions importantes</h3>
              <p className="text-amber-700 text-sm">
                Pour tous les services de vignette, une vérification préalable de l'immatriculation du véhicule est obligatoire. 
                Assurez-vous que l'assujetti dispose de ses documents d'immatriculation avant de procéder.
              </p>
            </div>
          </div>
        </div>

        {/* Titre des services */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Services Vignette Automobile</h2>
              <p className="text-gray-600 mt-1">Sélectionnez le service correspondant à votre besoin</p>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Vérification immatriculation requise</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grille des services */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {services.map((service) => {
            const colorClasses = getColorClasses(service.color);
            const IconComponent = service.icon;

            return (
              <div
                key={service.id}
                className={`
                  relative rounded-2xl border ${colorClasses.border} ${colorClasses.bg}
                  p-6 hover:shadow-2xl transition-all duration-300 group
                  hover:scale-[1.02] hover:-translate-y-1
                  backdrop-blur-sm
                  ${!impot.actif ? "opacity-50 grayscale" : ""}
                `}
                style={{
                  backgroundImage: "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.8) 0%, transparent 50%)",
                }}
              >
                {/* BADGE POPULAIRE */}
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-lg">
                      <Crown className="w-3.5 h-3.5" />
                      <span>POPULAIRE</span>
                      <Zap className="w-3 h-3 animate-pulse" />
                    </div>
                  </div>
                )}

                {/* TAG DE CATÉGORIE */}
                <div className="absolute top-4 right-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colorClasses.tag}`}>
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
                    <div className={`p-3.5 rounded-2xl ${colorClasses.bg} border ${colorClasses.border} shadow-lg group-hover:shadow-xl transition-shadow`}>
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

                  {/* EXIGENCES */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Exigences :
                    </div>
                    <ul className="space-y-1.5">
                      {service.requirements.map((req, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-700">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mr-2 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CARACTÉRISTIQUES */}
                  <div className="mb-6">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Caractéristiques :
                    </div>
                    <ul className="space-y-2">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm">
                          <div className={`w-1.5 h-1.5 rounded-full ${colorClasses.icon} mt-1.5 flex-shrink-0`}></div>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* BOUTON D'ACCÈS */}
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
                        Accéder au service
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
                        Vignettes temporairement suspendues
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

        {/* Informations complémentaires */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-5">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CarFront className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">Contrôle Technique</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Consultation des résultats de contrôle technique et génération du Procès-Verbal officiel.
            </p>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-5">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <FileCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900">Procès-Verbal</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Émission automatique du PV de contrôle technique après validation des résultats.
            </p>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-5">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClipboardCheck className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900">Validation des Résultats</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Système de vérification et validation des rapports de contrôle technique des centres agréés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}