'use client';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User } from 'lucide-react';
import ClientSimpleForm from './components/ClientSimpleForm';
import { useAuth } from "@/contexts/AuthContext";

export default function ClientSimplePage() {
  const params = useParams();
  const router = useRouter();
  const impotId = params.id as string;
  const { utilisateur } = useAuth();

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
              L'immatriculation des plaques consiste à enregistrer officiellement un véhicule auprès des services compétents afin de lui attribuer un numéro unique d'identification. Elle permet de certifier la propriété, faciliter le contrôle routier et assurer la traçabilité du véhicule sur tout le territoire.
            </p>
          </div>
        </div>

        {/* FORMULAIRE */}
        <ClientSimpleForm impotId={impotId} utilisateur={utilisateur} />
      </div>
    </div>
  );
}