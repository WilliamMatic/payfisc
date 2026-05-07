'use client';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Lock } from 'lucide-react';
import ClientSimpleForm from './components/ClientSimpleForm';
import { useAuth } from "@/contexts/AuthContext";
import { parseAndNormalizePrivileges } from '@/utils/normalizePrivileges';
import { useMemo } from 'react';

export default function ClientSimpleClient() {
  const params = useParams();
  const router = useRouter();
  const impotId = params.id as string;
  const { utilisateur, isLoading: authLoading } = useAuth();
  const privileges: any = useMemo(() => {
    if (!utilisateur) return null;
    if (!utilisateur.privileges_include) return {};
    try {
      return parseAndNormalizePrivileges(utilisateur.privileges_include);
    } catch (error) {
      console.error('Erreur lors du parsing des privilèges:', error);
      return {};
    }
  }, [utilisateur]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-2">
            Chargement des autorisations...
          </h2>
          <p className="text-[13px] text-gray-600">
            Veuillez patienter pendant que nous vérifions vos accès.
          </p>
        </div>
      </div>
    );
  }

  if (!utilisateur || privileges === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-2">
            Vérification des autorisations...
          </h2>
          <p className="text-[13px] text-gray-600">
            Veuillez patienter pendant que nous vérifions vos accès.
          </p>
        </div>
      </div>
    );
  }

  if (!privileges?.ventePlaque?.simple) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-2">
              Accès Refusé
            </h2>
            <p className="text-[13px] text-gray-600 mb-6">
              Vous n'avez pas les privilèges nécessaires pour accéder à cette fonctionnalité.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              Privilèges disponibles:
              <div className="mt-2 text-left">
                {Object.entries(privileges).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>{key}: {value ? '✓' : '✗'}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Retour</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
          <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-500 hover:text-[#2D5B7A] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Retour aux services</span>
            </button>
            <span className="text-xs text-gray-400 font-mono">
              #{impotId}
            </span>
          </div>

          <div className="px-5 py-4 flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#2D5B7A]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-[#2D5B7A]" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-gray-900">
                Client Simple — Immatriculation Plaques
              </h1>
              <p className="text-xs text-gray-500">
                Vente rapide pour particuliers
              </p>
            </div>
          </div>

          <div className="px-5 pb-4">
            <div className="p-3 bg-[#2D5B7A]/5 rounded-lg border border-[#2D5B7A]/10">
              <p className="text-gray-600 text-xs leading-relaxed">
                L'immatriculation des plaques consiste à enregistrer officiellement un véhicule auprès des services compétents afin de lui attribuer un numéro unique d'identification. Elle permet de certifier la propriété, faciliter le contrôle routier et assurer la traçabilité du véhicule sur tout le territoire.
              </p>
            </div>
          </div>
        </div>

        <ClientSimpleForm impotId={impotId} utilisateur={utilisateur} />
      </div>
    </div>
  );
}
