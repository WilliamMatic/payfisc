'use client';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Lock } from 'lucide-react';
import ClientSimpleForm from './components/ClientSimpleForm';
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from 'react';

export default function ClientSimplePage() {
  const params = useParams();
  const router = useRouter();
  const impotId = params.id as string;
  const { utilisateur } = useAuth();

  // Afficher un écran de chargement ou d'erreur si pas les privilèges
  if (!utilisateur) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Vérification des autorisations...
          </h2>
          <p className="text-gray-600">
            Veuillez patienter pendant que nous vérifions vos accès.
          </p>
        </div>
      </div>
    );
  }

  if (!utilisateur.privileges?.simple) {
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
              Vous n'avez pas les privilèges nécessaires pour accéder à cette fonctionnalité.
            </p>
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
            <div className="text-sm text-gray-500">
              ID: #{impotId}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Client Simple - IMMATRICULATION PLAQUES
              </h1>
              <p className="text-gray-600 mt-1">
                Vente rapide pour particuliers
              </p>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 text-sm">
              L'immatriculation des plaques consiste à enregistrer officiellement un véhicule auprès des services compétents afin de lui attribuer un numéro unique d'identification. Elle permet de certifier la propriété, faciliter le contrôle routier et assurer la traçabilité du véhicule sur tout le territoire.
            </p>
          </div>

          {/* INFO UTILISATEUR CONNECTÉ */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-600">Opérateur connecté:</span>
                <span className="font-semibold text-gray-800 ml-2">
                  {utilisateur.nom_complet}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Site:</span>
                <span className="font-semibold text-gray-800 ml-2">
                  {utilisateur.site_nom} ({utilisateur.site_code})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FORMULAIRE */}
        <ClientSimpleForm impotId={impotId} utilisateur={utilisateur} />
      </div>
    </div>
  );
}