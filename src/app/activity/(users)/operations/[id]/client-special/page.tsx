"use client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Lock, FileText } from "lucide-react";
import ClientSimpleForm from "./components/ClientSimpleForm";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ClientSimplePage() {
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
        console.error("Erreur parsing privileges:", error);
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
            onClick={() => router.push("/system/login")}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur a le privilège "special"
  if (!parsedPrivileges.special) {
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
                {Object.entries(parsedPrivileges).map(
                  ([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          value ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>
                      <span className="font-medium">{key}:</span>
                      <span
                        className={value ? "text-green-600" : "text-red-600"}
                      >
                        {value ? "Activé" : "Désactivé"}
                      </span>
                    </div>
                  )
                )}
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
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Retour aux services</span>
            </button>

            <div className="flex items-center space-x-4">
              {/* Bouton Rapport avec Link et préchargement */}
              <Link
                href={`achats-grossistes/`}
                prefetch={true} // Précharge la page pour de meilleures performances
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg text-sm font-medium group relative overflow-hidden"
              >
                {/* Effet de fond animé */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Contenu */}
                <FileText className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10">Rapports</span>

                {/* Flèche discrète */}
                <svg
                  className="w-3 h-3 relative z-10 opacity-70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>

              {/* Séparateur */}
              <div className="h-6 w-px bg-gray-300"></div>

              {/* ID */}
              <div className="text-sm text-gray-500 font-medium">
                ID: <span className="text-gray-700">#{impotId}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Client Spécial - IMMATRICULATION PLAQUES
              </h1>
              <p className="text-gray-600 mt-1">
                Vente rapide pour partenaires privilégiés
              </p>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 text-sm">
              L'immatriculation des plaques consiste à enregistrer
              officiellement un véhicule auprès des services compétents afin de
              lui attribuer un numéro unique d'identification. Elle permet de
              certifier la propriété, faciliter le contrôle routier et assurer
              la traçabilité du véhicule sur tout le territoire.
            </p>
          </div>
        </div>

        {/* FORMULAIRE */}
        <ClientSimpleForm impotId={impotId} utilisateur={utilisateur} />
      </div>
    </div>
  );
}
