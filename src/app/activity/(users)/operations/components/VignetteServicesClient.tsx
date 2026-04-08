'use client';
import { useState, useEffect } from 'react';
import { Impot as ImpotType } from '@/services/impots/impotService';
import ImpotServicesHeader from './ImpotServicesHeader';
import AlertMessage from './AlertMessage';
import Link from 'next/link';
import {
  Car,
  Ticket,
  Smartphone,
  CheckCircle,
  XCircle,
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
  Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { parseAndNormalizePrivileges } from '@/utils/normalizePrivileges';

interface VignetteServicesClientProps {
  impot: ImpotType;
}

export default function VignetteServicesClient({ impot }: VignetteServicesClientProps) {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { utilisateur } = useAuth();
  const [privileges, setPrivileges] = useState<any>(null);

  useEffect(() => {
    if (utilisateur) {
      setPrivileges(parseAndNormalizePrivileges(utilisateur.privileges_include));
    }
  }, [utilisateur]);

  const services = [
    {
      id: "vente-vignette",
      privilegeKey: "venteDirecte",
      title: "Vente de Vignette",
      description: "Pour les assujettis qui viennent acheter leur vignette automobile. Vérification préalable de l'immatriculation requise.",
      icon: Ticket,
      color: "emerald",
      features: [
        "Vérification immatriculation",
        "Paiement sécurisé MPAKO",
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
      privilegeKey: "delivrance",
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
      privilegeKey: "renouvellement",
      title: "Renouvellement Vignette",
      description: "Service de renouvellement de vignette automobile après expiration de la période de validité de 6 mois.",
      icon: RefreshCw,
      color: "amber",
      features: [
        "Vérification automatique",
        "Historique des vignettes",
        "Paiement en ligne intégré",
        "Rappel automatique"
      ],
      tag: "RENOUVELLEMENT",
      stats: "6 mois",
      popular: true,
      requirements: ["Vignette expirée ou proche expiration", "Véhicule en règle"]
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
    };
    return classes[color as keyof typeof classes] || classes.emerald;
  };

  const isServiceAllowed = (privilegeKey: string): boolean => {
    if (!privileges) return false;
    return !!privileges?.vignette?.[privilegeKey];
  };

  const authorizedCount = services.filter(s => isServiceAllowed(s.privilegeKey)).length;

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
                Pour tous les services de vignette, une vérification préalable de l&apos;immatriculation du véhicule est obligatoire. 
                Assurez-vous que l&apos;assujetti dispose de ses documents d&apos;immatriculation avant de procéder.
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

        {/* Privilege summary bar */}
        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Vos accès — Vignette</p>
              <p className="text-xs text-gray-500">{authorizedCount} / {services.length} services autorisés</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {services.map(s => (
              <div
                key={s.id}
                title={`${s.title}: ${isServiceAllowed(s.privilegeKey) ? 'Autorisé' : 'Non autorisé'}`}
                className={`w-3 h-3 rounded-full transition-colors ${isServiceAllowed(s.privilegeKey) ? 'bg-emerald-500' : 'bg-red-300'}`}
              />
            ))}
          </div>
        </div>

        {/* Grille des services - 3 colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((service) => {
            const colorClasses = getColorClasses(service.color);
            const IconComponent = service.icon;
            const allowed = isServiceAllowed(service.privilegeKey);

            return (
              <div
                key={service.id}
                className={`
                  relative rounded-2xl border p-6 transition-all duration-300 group backdrop-blur-sm
                  ${allowed
                    ? `${colorClasses.border} ${colorClasses.bg} hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1`
                    : 'border-gray-200 bg-gray-50/80 opacity-60 grayscale'
                  }
                  ${!impot.actif ? "opacity-50 grayscale" : ""}
                `}
                style={{
                  backgroundImage: allowed
                    ? "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.8) 0%, transparent 50%)"
                    : undefined,
                }}
              >
                {/* BADGE POPULAIRE / LOCK */}
                {allowed && service.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-lg">
                      <Crown className="w-3.5 h-3.5" />
                      <span>POPULAIRE</span>
                      <Zap className="w-3 h-3 animate-pulse" />
                    </div>
                  </div>
                )}
                {!allowed && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-lg">
                      <Lock className="w-3.5 h-3.5" />
                      <span>ACCÈS RESTREINT</span>
                    </div>
                  </div>
                )}

                {/* TAG DE CATÉGORIE */}
                <div className="absolute top-4 right-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${allowed ? colorClasses.tag : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
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
                  {/* ICÔNE */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3.5 rounded-2xl border shadow-lg transition-shadow ${allowed ? `${colorClasses.bg} ${colorClasses.border} group-hover:shadow-xl` : 'bg-gray-100 border-gray-200'}`}>
                      {allowed ? (
                        <IconComponent className={`w-7 h-7 ${colorClasses.icon}`} />
                      ) : (
                        <Lock className="w-7 h-7 text-gray-400" />
                      )}
                    </div>
                    <div className={`flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full ${allowed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {allowed ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{allowed ? 'Autorisé' : 'Verrouillé'}</span>
                    </div>
                  </div>

                  {/* TITRE ET DESCRIPTION */}
                  <h3 className={`text-xl font-bold mb-3 leading-tight ${allowed ? 'text-gray-900' : 'text-gray-500'}`}>
                    {service.title}
                  </h3>
                  <p className={`mb-5 leading-relaxed text-sm ${allowed ? 'text-gray-600' : 'text-gray-400'}`}>
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
                          <CheckCircle className={`w-3.5 h-3.5 mr-2 flex-shrink-0 ${allowed ? 'text-emerald-500' : 'text-gray-300'}`} />
                          <span className={allowed ? '' : 'text-gray-400'}>{req}</span>
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
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${allowed ? colorClasses.icon : 'bg-gray-300'}`}></div>
                          <span className={allowed ? "text-gray-700" : "text-gray-400"}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* BOUTON D'ACCÈS */}
                  {allowed && impot.actif ? (
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
                    <div className="w-full flex items-center justify-center space-x-2 px-4 py-3.5 bg-gray-300 text-gray-500 rounded-xl cursor-not-allowed">
                      <Lock className="w-4 h-4" />
                      <span className="font-semibold text-sm">
                        {!allowed ? 'Accès non autorisé' : 'Service suspendu'}
                      </span>
                    </div>
                  )}
                </div>

                {/* EFFET DE BORDURE ANIMÉ */}
                {allowed && (
                  <div
                    className={`
                      absolute inset-0 rounded-2xl border-2 ${colorClasses.border}
                      opacity-0 group-hover:opacity-100 transition-opacity duration-500
                      pointer-events-none
                    `}
                  ></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Informations complémentaires */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-5">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Receipt className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900">Paiement Sécurisé</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Intégration avec MPAKO pour des transactions sécurisées et traçables.
            </p>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-5">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <QrCode className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">Mobile Money</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Support des paiements Mobile Money avec vérification automatique.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}