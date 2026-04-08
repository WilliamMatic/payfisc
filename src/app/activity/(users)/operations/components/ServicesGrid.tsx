// ServicesGrid.tsx
'use client';
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  User,
  Users,
  CreditCard,
  Package,
  ArrowRight,
  Shield,
  RefreshCw,
  Building,
  Lock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Impot as ImpotType } from "@/services/impots/impotService";
import { useAuth } from "@/contexts/AuthContext";import { parseAndNormalizePrivileges } from '@/utils/normalizePrivileges';
interface ServicesGridProps {
  impot: ImpotType;
}

export default function ServicesGrid({ impot }: ServicesGridProps) {
  const { utilisateur } = useAuth();
  const [privileges, setPrivileges] = useState<any>(null);

  useEffect(() => {
    if (utilisateur) {
      setPrivileges(parseAndNormalizePrivileges(utilisateur.privileges_include));
    }
  }, [utilisateur]);

  const services = [
    {
      id: "client-simple",
      privilegeKey: "simple",
      title: "Assujetti - Vente Directe",
      description:
        "Pour les particuliers qui achètent une plaque et récupèrent immédiatement la carte rose correspondante.",
      icon: User,
      features: [
        "Achat plaque unique",
        "Carte rose immédiate",
        "Processus express 30min",
      ],
      tag: "RETAIL",
    },
    {
      id: "client-special",
      privilegeKey: "special",
      title: "Grossiste - Vente en Gros",
      description:
        "Pour les partenaires qui achètent plusieurs plaques et peuvent récupérer des cartes roses vierges ou pré-imprimées.",
      icon: Building,
      features: [
        "Achat volume (5+ plaques)",
        "Cartes roses vierges",
        "Tarifs préférentiels",
        "Dashboard analytique",
      ],
      tag: "B2B",
    },
    {
      id: "carte-rose",
      privilegeKey: "delivrance",
      title: "Délivrance Carte Rose",
      description:
        "Lorsqu'un grossiste a vendu une plaque à un client externe, ce dernier vient finaliser et récupérer sa carte rose.",
      icon: CreditCard,
      features: [
        "Transfert de propriété",
        "Activation finale",
        "Validation MPAKO en direct",
        "Biométrie optionnelle",
      ],
      tag: "TRANSFERT",
    },
    {
      id: "plaque-carte",
      privilegeKey: "plaque",
      title: "Kit Complet Premium",
      description:
        "Service tout-en-un : plaque personnalisée + carte rose avec options premium et suivi prioritaire.",
      icon: Package,
      features: [
        "Plaque personnalisée",
        "Carte rose NFC",
        "Assurance 1 an incluse",
        "Livraison premium",
      ],
      tag: "PREMIUM",
    },
    {
      id: "refactor-carte",
      privilegeKey: "correctionErreur",
      title: "Correction & Reprocessing",
      description:
        "Refactorisation et correction des données erronées sur les cartes roses existantes.",
      icon: RefreshCw,
      features: [
        "Correction IA vérifiée",
        "Réimpression sécurisée",
        "Traçabilité complète",
        "Validation MPAKO",
      ],
      tag: "SUPPORT",
    },
  ];

  const isServiceAllowed = (privilegeKey: string): boolean => {
    if (!privileges) return false;
    return !!privileges?.ventePlaque?.[privilegeKey];
  };

  const authorizedCount = services.filter(s => isServiceAllowed(s.privilegeKey)).length;

  return (
    <div>
      {/* Privilege summary bar */}
      <div className="mb-5 bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-md">
            <Shield className="w-4 h-4 text-[#2D5B7A]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Vos accès — Vente Plaque</p>
            <p className="text-xs text-gray-500">{authorizedCount} / {services.length} services autorisés</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {services.map(s => (
            <div
              key={s.id}
              title={`${s.title}: ${isServiceAllowed(s.privilegeKey) ? 'Autorisé' : 'Non autorisé'}`}
              className={`w-2.5 h-2.5 rounded-full ${isServiceAllowed(s.privilegeKey) ? 'bg-emerald-500' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.map((service) => {
          const IconComponent = service.icon;
          const allowed = isServiceAllowed(service.privilegeKey);

          return (
            <div
              key={service.id}
              className={`
                relative bg-white rounded-xl border p-5 transition-all duration-200 flex flex-col
                ${allowed
                  ? 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  : 'border-gray-200 bg-gray-50 opacity-60'
                }
                ${!impot.actif ? "opacity-50" : ""}
              `}
            >
              {/* TAG + ACCESS */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-wide">
                  {service.tag}
                </span>
                <div className={`flex items-center gap-1 text-xs font-medium ${allowed ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {allowed ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{allowed ? 'Autorisé' : 'Verrouillé'}</span>
                </div>
              </div>

              {/* ICON + TITLE */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 rounded-lg flex-shrink-0 ${allowed ? 'bg-[#2D5B7A]/10' : 'bg-gray-100'}`}>
                  {allowed ? (
                    <IconComponent className="w-5 h-5 text-[#2D5B7A]" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <h3 className={`text-[15px] font-semibold leading-tight ${allowed ? 'text-gray-900' : 'text-gray-500'}`}>
                  {service.title}
                </h3>
              </div>

              {/* DESCRIPTION */}
              <p className={`text-[13px] leading-relaxed mb-4 ${allowed ? 'text-gray-500' : 'text-gray-400'}`}>
                {service.description}
              </p>

              {/* FEATURES */}
              <ul className="space-y-2 mb-5 flex-1">
                {service.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-[13px]">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${allowed ? 'bg-[#2D5B7A]' : 'bg-gray-300'}`} />
                    <span className={allowed ? "text-gray-600" : "text-gray-400"}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* BUTTON */}
              <div className="mt-auto">
              {allowed && impot.actif ? (
                <Link
                  href={`${impot.id}/${service.id}`}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-[#2D5B7A] hover:bg-[#1a3a5c] text-white rounded-lg transition-colors duration-200 hover:no-underline text-sm font-medium"
                >
                  <span>Démarrer</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-sm font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{!allowed ? 'Accès non autorisé' : 'Service suspendu'}</span>
                </div>
              )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
