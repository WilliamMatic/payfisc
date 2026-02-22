"use client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Lock } from "lucide-react";
import ClientSimpleForm from "./components/ClientSimpleForm";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export default function CarteRoseClient() {
  const params = useParams();
  const router = useRouter();
  const impotId = params.id as string;
  const { utilisateur, isLoading: authLoading } = useAuth();
  const [parsedPrivileges, setParsedPrivileges] = useState<any>(null);

  // Parser les privilèges quand utilisateur change
  useEffect(() => {
    if (utilisateur?.privileges_include) {
      try {
        const parsed = JSON.parse(utilisateur.privileges_include);
        setParsedPrivileges(parsed);
      } catch (error) {
        console.error('Erreur parsing privileges:', error);
        setParsedPrivileges({});
      }
    } else if (utilisateur) {
      setParsedPrivileges({});
    }
  }, [utilisateur]);

  // Afficher un écran de chargement
  if (authLoading || parsedPrivileges === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Chargement...
          </h2>
          <p className="text-gray-600">
            Veuillez patienter pendant que nous vérifions vos accès.
          </p>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur connecté
  if (!utilisateur) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Session expirée
          </h2>
          <p className="text-gray-600 mb-6">
            Veuillez vous reconnecter pour accéder à cette page.
          </p>
          <button
            onClick={() => router.push('/system/login')}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur a le privilège "delivrance"
  if (!parsedPrivileges.delivrance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Accès Refusé
            </h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas les privilèges nécessaires pour accéder à cette
              fonctionnalité.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              <div className="text-left bg-gray-50 p-3 rounded-lg">
                <div className="font-medium mb-2">Vos privilèges:</div>
                {Object.entries(parsedPrivileges).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-medium">{key}:</span>
                    <span className={value ? 'text-green-600' : 'text-red-600'}>
                      {value ? 'Activé' : 'Désactivé'}
                    </span>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* HEADER */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Retour aux services</span>
            </button>
            <div className="text-sm text-gray-500">ID: #{impotId}</div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Délivrance Carte Rose
              </h1>
              <p className="text-gray-600 mt-1">
                Gestion complète de la délivrance des cartes roses avec suivi du
                processus administratif
              </p>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 text-sm">
              La carte rose est le certificat d'immatriculation officiel d'un
              véhicule. Elle atteste de l'identité du propriétaire et contient
              les caractéristiques techniques du véhicule. Processus en 3 étapes
              : vérification → formulaire → impression.
            </p>
          </div>
        </div>

        {/* FORMULAIRE */}
        <ClientSimpleForm impotId={impotId} utilisateur={utilisateur} />
      </div>
    </div>
  );
}
